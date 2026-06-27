import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { MediaToggle } from "@/components/classroom/SessionWidgets";
import { useClassroom } from "@/hooks/useClassroom";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/constants/routes";
import { Icon } from "@/components/ui/Icon";
import { setTeacherAudioStream } from "@/lib/rtc/audioBridge";
import { classroomSocket } from "@/lib/ws/classroomSocket";
import { registerTeacherMicStream } from "@/lib/media/classroomMedia";

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

    let cancelled = false;

    async function startMicrophone() {
      if (!audioEnabled || recorderRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        micStreamRef.current = stream;
        registerTeacherMicStream(stream);
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

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        let recognition: any = null;

        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = "es-PE";
          
          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            if (finalTranscript.trim()) {
              publishTranscript(finalTranscript.trim());
            }
          };
          
          recognition.onend = () => {
            if (!cancelled && audioEnabled) {
              try { recognition.start(); } catch {}
            }
          };

          try {
            recognition.start();
          } catch (e) {
            console.error("SpeechRecognition error:", e);
          }
        }
        
        // Save recognition to ref to stop it later
        (micStreamRef as any).recognition = recognition;
      } catch {
        if (audioEnabled) {
          toggleMedia("audio");
        }
      }
    }

    function stopMicrophone() {
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
      if ((micStreamRef as any).recognition) {
        try {
          (micStreamRef as any).recognition.onend = null;
          (micStreamRef as any).recognition.stop();
        } catch {}
        (micStreamRef as any).recognition = null;
      }
      
      sttChunksRef.current = [];
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      registerTeacherMicStream(null);
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
          icon="stop_screen_share"
          offIcon="screen_share"
          label={session.media.screenShare ? "Dejar de compartir" : "Compartir Pantalla"}
          active={session.media.screenShare}
          onClick={() => toggleMedia("screenShare")}
          hideLabel={!session.media.screenShare}
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
