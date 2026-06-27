import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { MediaToggle } from "@/components/classroom/SessionWidgets";
import { useClassroom } from "@/hooks/useClassroom";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/constants/routes";
import { Icon } from "@/components/ui/Icon";
import { uploadAudio } from "@/lib/api/classroom";
import { setTeacherAudioStream } from "@/lib/rtc/audioBridge";
import { classroomSocket } from "@/lib/ws/classroomSocket";

const STT_SEGMENT_MS = 4500;
const MIN_STT_BLOB_BYTES = 12_000;
const VOICE_ACTIVITY_THRESHOLD = 0.08;

export function ClassControlsBar() {
  const { session, toggleMedia, toggleBoardCamera, endClassroom, pushSubtitle } = useClassroom();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const segmentTimerRef = useRef<number | null>(null);
  const uploadInFlightRef = useRef(false);
  const sttChunksRef = useRef<Blob[]>([]);
  const segmentHadVoiceRef = useRef(false);
  const lastSpeakingSignalAtRef = useRef(0);
  const wasSpeakingRef = useRef(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const sessionId = session?.id;
  const isTeacherApiSession =
    session?.role === "teacher" && session.connectionMode === "api" && !!sessionId;
  const audioEnabled = session?.media.audio ?? false;

  useEffect(() => {
    if (!isTeacherApiSession || !sessionId) return;
    const activeSessionId = sessionId;

    let cancelled = false;
    let shouldContinueRecording = false;

    async function startMicrophone() {
      if (!audioEnabled || recorderRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        micStreamRef.current = stream;
        setTeacherAudioStream(stream);
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        const samples = new Uint8Array(analyser.frequencyBinCount);

        const readLevel = () => {
          analyser.getByteFrequencyData(samples);
          const average = samples.reduce((total, value) => total + value, 0) / samples.length;
          const nextLevel = Math.min(1, average / 72);
          const isSpeakingNow = nextLevel > VOICE_ACTIVITY_THRESHOLD;
          if (isSpeakingNow) {
            segmentHadVoiceRef.current = true;
          }

          const now = Date.now();
          if (isSpeakingNow && now - lastSpeakingSignalAtRef.current > 900) {
            lastSpeakingSignalAtRef.current = now;
            wasSpeakingRef.current = true;
            classroomSocket.send({ type: "teacher_speaking", payload: { active: true } });
          }
          if (!isSpeakingNow && wasSpeakingRef.current && now - lastSpeakingSignalAtRef.current > 1800) {
            wasSpeakingRef.current = false;
            classroomSocket.send({ type: "teacher_speaking", payload: { active: false } });
          }

          setVoiceLevel(nextLevel);
          analyserFrameRef.current = requestAnimationFrame(readLevel);
        };
        readLevel();

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const publishTranscript = (text: string) => {
          pushSubtitle(text);
          classroomSocket.send({
            type: "subtitle",
            payload: {
              id: crypto.randomUUID(),
              text,
              timestamp: Date.now(),
              isFinal: true,
            },
          });
        };

        const uploadSegment = (blob: Blob) => {
          if (uploadInFlightRef.current) {
            console.info("[STT] Segmento omitido: hay otra transcripción en curso");
            return;
          }

          uploadInFlightRef.current = true;
          uploadAudio(activeSessionId, blob)
            .then((result) => {
              if (!result.transcript) {
                console.warn("[STT] Sin transcripción útil", result);
                return;
              }
              publishTranscript(result.transcript);
            })
            .catch((err) => {
              console.error("[STT] Error al subir audio:", err);
            })
            .finally(() => {
              uploadInFlightRef.current = false;
            });
        };

        const startSegment = () => {
          if (cancelled || !shouldContinueRecording || !micStreamRef.current) return;
          if (!micStreamRef.current.getAudioTracks().some((track) => track.readyState === "live")) {
            return;
          }

          sttChunksRef.current = [];
          segmentHadVoiceRef.current = false;
          const recorder = new MediaRecorder(micStreamRef.current, { mimeType });
          recorderRef.current = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data.size) {
              sttChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(sttChunksRef.current, { type: mimeType });
            sttChunksRef.current = [];
            recorderRef.current = null;

            const hasEnoughAudio = blob.size >= MIN_STT_BLOB_BYTES || segmentHadVoiceRef.current;
            if (hasEnoughAudio) {
              uploadSegment(blob);
            } else {
              console.info("[STT] Segmento omitido: silencio o audio demasiado corto", {
                bytes: blob.size,
              });
            }

            if (!cancelled && shouldContinueRecording) {
              window.setTimeout(startSegment, 250);
            }
          };

          recorder.start();
          segmentTimerRef.current = window.setTimeout(() => {
            if (recorder.state === "recording") {
              recorder.stop();
            }
          }, STT_SEGMENT_MS);
        };

        shouldContinueRecording = true;
        startSegment();
      } catch {
        if (audioEnabled) {
          toggleMedia("audio");
        }
      }
    }

    function stopMicrophone() {
      shouldContinueRecording = false;
      if (analyserFrameRef.current) {
        cancelAnimationFrame(analyserFrameRef.current);
        analyserFrameRef.current = null;
      }
      if (segmentTimerRef.current) {
        window.clearTimeout(segmentTimerRef.current);
        segmentTimerRef.current = null;
      }
      void audioContextRef.current?.close();
      audioContextRef.current = null;
      segmentHadVoiceRef.current = false;
      wasSpeakingRef.current = false;
      lastSpeakingSignalAtRef.current = 0;
      classroomSocket.send({ type: "teacher_speaking", payload: { active: false } });
      setVoiceLevel(0);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      sttChunksRef.current = [];
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      setTeacherAudioStream(null);
    }

    if (audioEnabled) {
      void startMicrophone();
    } else {
      stopMicrophone();
    }

    return () => {
      cancelled = true;
      stopMicrophone();
    };
  }, [audioEnabled, isTeacherApiSession, pushSubtitle, sessionId, toggleMedia]);

  if (!session) return null;

  const handleEnd = () => {
    endClassroom();
    navigate(ROUTES.home);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(session.code);
    showToast(`Código ${session.code} copiado`, "success");
  };

  return (
    <footer className="z-40 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/70 bg-white/85 p-4 shadow-[0_-12px_36px_rgba(18,32,51,0.08)] backdrop-blur-xl">
      <div className="flex flex-wrap gap-2">
        <MediaToggle
          icon="mic"
          offIcon="mic_off"
          label="Audio"
          active={session.media.audio}
          onClick={() => toggleMedia("audio")}
        />
        {session.media.audio && (
          <div
            className="teacher-mic-meter"
            aria-label={voiceLevel > 0.14 ? "El docente está hablando" : "Micrófono activo"}
            title={voiceLevel > 0.14 ? "El docente está hablando" : "Micrófono activo"}
          >
            <span className="teacher-mic-dot" />
            <span className="teacher-mic-bars" style={{ "--voice-level": voiceLevel } as CSSProperties}>
              {Array.from({ length: 5 }).map((_, index) => (
                <i key={index} />
              ))}
            </span>
          </div>
        )}
        <MediaToggle
          icon="videocam"
          offIcon="videocam_off"
          label="Vídeo"
          active={session.media.video}
          onClick={() => toggleMedia("video")}
        />
        <MediaToggle
          icon="photo_camera"
          offIcon="photo_camera"
          label="Pizarra"
          active={session.media.boardCamera}
          onClick={toggleBoardCamera}
        />
        <MediaToggle
          icon="screen_share"
          label="Compartir Pantalla"
          active={session.media.screenShare}
          onClick={() => toggleMedia("screenShare")}
          hideLabel
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void copyCode()}
          className="hidden min-h-touch-target-min items-center gap-2 rounded-full border border-outline-variant bg-white/70 px-3 py-2 font-body text-label-sm font-semibold text-on-surface-variant shadow-sm transition-colors hover:bg-primary-fixed/70 hover:text-primary md:flex"
          title="Copiar código de clase"
          aria-label={`Copiar código de clase ${session.code}`}
        >
          <Icon name="content_copy" size={16} />
          Código: <strong className="text-primary">{session.code}</strong>
        </button>
        <Button variant="danger" aria-label="Finalizar clase" onClick={handleEnd} className="px-6">
          <Icon name="call_end" />
          Finalizar Clase
        </Button>
      </div>
    </footer>
  );
}
