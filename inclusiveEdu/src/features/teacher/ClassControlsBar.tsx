import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { MediaToggle } from "@/components/classroom/SessionWidgets";
import { useClassroom } from "@/hooks/useClassroom";
import { ROUTES } from "@/constants/routes";
import { Icon } from "@/components/ui/Icon";
import { uploadAudio } from "@/lib/api/classroom";
import { setTeacherAudioStream } from "@/lib/rtc/audioBridge";

export function ClassControlsBar() {
  const { session, toggleMedia, toggleBoardCamera, endSession } = useClassroom();
  const navigate = useNavigate();
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const uploadInFlightRef = useRef(false);
  const sttChunksRef = useRef<Blob[]>([]);
  const lastSttUploadAtRef = useRef(0);

  const sessionId = session?.id;
  const isTeacherApiSession =
    session?.role === "teacher" && session.connectionMode === "api" && !!sessionId;
  const audioEnabled = session?.media.audio ?? false;

  useEffect(() => {
    if (!isTeacherApiSession || !sessionId) return;
    const activeSessionId = sessionId;

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
        setTeacherAudioStream(stream);
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (event) => {
          if (!event.data.size) return;

          sttChunksRef.current.push(event.data);
          const now = Date.now();
          if (now - lastSttUploadAtRef.current < 5000 || uploadInFlightRef.current) return;

          const sttBlob = new Blob(sttChunksRef.current, { type: event.data.type || mimeType });
          sttChunksRef.current = [];
          lastSttUploadAtRef.current = now;
          uploadInFlightRef.current = true;
          uploadAudio(activeSessionId, sttBlob).then((result) => {
            if (!result.transcript) {
              console.warn("[STT] Transcripción vacía (silencio?)");
            }
          }).catch((err) => {
            console.error("[STT] Error al subir audio:", err);
          }).finally(() => {
            uploadInFlightRef.current = false;
          });
        };

        recorder.start(750);
        recorderRef.current = recorder;
      } catch {
        if (audioEnabled) {
          toggleMedia("audio");
        }
      }
    }

    function stopMicrophone() {
      recorderRef.current?.stop();
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
  }, [audioEnabled, isTeacherApiSession, sessionId, toggleMedia]);

  if (!session) return null;

  const handleEnd = () => {
    endSession();
    navigate(ROUTES.home);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(session.code);
  };

  return (
    <footer className="z-40 flex flex-wrap items-center justify-between gap-4 border-t-2 border-outline-variant bg-surface-container-highest p-4">
      <div className="flex gap-2">
        <MediaToggle
          icon="mic"
          offIcon="mic_off"
          label="Audio"
          active={session.media.audio}
          onClick={() => toggleMedia("audio")}
        />
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
          className="hidden items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 font-body text-label-sm text-on-surface-variant transition-colors hover:bg-surface-variant md:flex"
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
