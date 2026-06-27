import { useEffect, useRef, useState } from "react";
import { IMAGES } from "@/constants/assets";
import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import { classroomSocket } from "@/lib/ws/classroomSocket";
import { uploadScreenshot } from "@/lib/api/classroom";
import { registerCameraStream } from "@/lib/media/classroomMedia";

type TeacherCameraPanelProps = {
  large?: boolean;
};

export function TeacherCameraPanel({ large = false }: TeacherCameraPanelProps) {
  const { session, toggleMedia, toggleBoardCamera } = useClassroom();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInFlightRef = useRef(false);
  const lastSampleRef = useRef<Uint8ClampedArray | null>(null);
  const lastUploadAtRef = useRef(0);
  const [cameraError, setCameraError] = useState(false);
  const [frameInset, setFrameInset] = useState(12);
  const [lastUploadLabel, setLastUploadLabel] = useState("Esperando captura");

  const audio = session?.media.audio ?? false;
  const video = session?.media.video ?? false;
  const boardCamera = session?.media.boardCamera ?? false;
  const screenShare = session?.media.screenShare ?? false;
  const activeBoardCamera = boardCamera && !screenShare;
  const shouldUseCamera = (video || activeBoardCamera) && !screenShare;

  useEffect(() => {
    if (!shouldUseCamera) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      registerCameraStream(null);
      setCameraError(false);
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: activeBoardCamera ? "environment" : "user" },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        registerCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(false);
      } catch {
        setCameraError(true);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
    };
  }, [activeBoardCamera, shouldUseCamera]);

  useEffect(() => {
    const sessionId = session?.id;
    if (!activeBoardCamera || session?.connectionMode !== "api" || !sessionId) return;
    const activeSessionId = sessionId;

    function hasMeaningfulChange(videoElement: HTMLVideoElement): boolean {
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 32;
      sampleCanvas.height = 18;
      const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return true;

      sampleContext.drawImage(videoElement, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const sample = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      const previous = lastSampleRef.current;
      lastSampleRef.current = new Uint8ClampedArray(sample);

      if (!previous) return true;

      let changedPixels = 0;
      for (let i = 0; i < sample.length; i += 4) {
        const delta =
          Math.abs(sample[i] - previous[i]) +
          Math.abs(sample[i + 1] - previous[i + 1]) +
          Math.abs(sample[i + 2] - previous[i + 2]);
        if (delta > 55) changedPixels += 1;
      }

      return changedPixels / (sample.length / 4) > 0.08;
    }

    async function captureAndUpload() {
      if (uploadInFlightRef.current || !videoRef.current) return;
      const videoElement = videoRef.current;
      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (!hasMeaningfulChange(videoElement)) {
        setLastUploadLabel("Sin cambios relevantes");
        return;
      }

      const now = Date.now();
      if (now - lastUploadAtRef.current < 12000) {
        setLastUploadLabel("Cambio detectado");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 360;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const sendCanvas = document.createElement("canvas");
      const maxFrameWidth = 480;
      const scale = Math.min(1, maxFrameWidth / canvas.width);
      sendCanvas.width = Math.round(canvas.width * scale);
      sendCanvas.height = Math.round(canvas.height * scale);
      const sendCtx = sendCanvas.getContext("2d");
      if (sendCtx) {
        sendCtx.drawImage(canvas, 0, 0, sendCanvas.width, sendCanvas.height);
        sendCanvas.toBlob((sendBlob) => {
          if (sendBlob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              classroomSocket.send({
                type: "screen_frame",
                payload: { data: reader.result as string, width: sendCanvas.width, height: sendCanvas.height },
              });
            };
            reader.readAsDataURL(sendBlob);
          }
        }, "image/jpeg", 0.55);
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      uploadInFlightRef.current = true;
      lastUploadAtRef.current = now;
      try {
        const result = await uploadScreenshot(activeSessionId, blob);
        setLastUploadLabel(result.duplicate ? "Sin cambios en pizarra" : "Pizarra analizada");
      } catch {
        setLastUploadLabel("No se pudo analizar la pizarra");
      } finally {
        uploadInFlightRef.current = false;
      }
    }

    const timer = window.setInterval(() => void captureAndUpload(), 3000);
    void captureAndUpload();
    return () => window.clearInterval(timer);
  }, [activeBoardCamera, session?.connectionMode, session?.id]);

  if (!session) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-outline-variant bg-white/90 p-3 shadow-[0_18px_48px_rgba(18,32,51,0.08)]">
      <h2 className="mb-unit flex items-center gap-2 font-body text-label-lg text-on-surface">
        <Icon name={boardCamera ? "photo_camera" : "video_camera_front"} />
        {screenShare ? "Pantalla Compartida" : boardCamera ? "Cámara de Pizarra" : "Cámara Docente"}
      </h2>

      <div
        className={`relative mb-4 flex w-full items-center justify-center overflow-hidden rounded-2xl border border-outline bg-inverse-surface ${
          large ? "min-h-[460px] flex-1" : "aspect-video"
        }`}
      >
        {screenShare ? (
          <div className="flex flex-col items-center gap-2 text-inverse-on-surface/70">
            <Icon name="screen_share" size={40} />
            <span className="px-4 text-center font-body text-label-sm">
              La pantalla compartida se está mostrando en el marco principal
            </span>
          </div>
        ) : shouldUseCamera ? (
          cameraError ? (
            <img
              src={IMAGES.teacherCamera}
              alt={boardCamera ? "Pizarra física en transmisión" : "Docente en transmisión en vivo"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-inverse-on-surface/60">
            <Icon name="videocam_off" size={40} />
            <span className="font-body text-label-sm">Cámara desactivada</span>
          </div>
        )}
        {activeBoardCamera && (
          <>
            <div
              className="pointer-events-none absolute rounded-lg border-2 border-secondary shadow-[0_0_0_999px_rgba(0,0,0,0.18)]"
              style={{ inset: `${frameInset}%` }}
            />
            <div className="absolute left-2 top-2 rounded-md bg-surface/90 px-2 py-1 font-body text-[11px] text-primary">
              {lastUploadLabel}
            </div>
          </>
        )}
        <div className="absolute bottom-2 left-2 flex gap-2">
          <button
            type="button"
            aria-label={audio ? "Silenciar micrófono" : "Activar micrófono"}
            onClick={() => toggleMedia("audio")}
            className="rounded-full bg-surface/90 p-1.5 backdrop-blur-sm shadow-sm transition-colors hover:bg-surface"
          >
            <Icon name={audio ? "mic" : "mic_off"} size={16} className={audio ? "text-on-surface" : "text-error"} />
          </button>
          <button
            type="button"
            aria-label={video ? "Desactivar cámara" : "Activar cámara"}
            onClick={() => toggleMedia("video")}
            className="rounded-full bg-surface/90 p-1.5 backdrop-blur-sm shadow-sm transition-colors hover:bg-surface"
          >
            <Icon name={video ? "videocam" : "videocam_off"} size={16} className={video ? "text-on-surface" : "text-error"} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="font-body text-label-sm text-on-surface-variant">
          {boardCamera
            ? screenShare
              ? "El análisis visual usa la pantalla compartida."
              : "Enfoca tu cámara hacia la pizarra física"
            : "Comparte tu cámara y micrófono con los estudiantes conectados."}
        </span>
        <button
          type="button"
          onClick={toggleBoardCamera}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          title={boardCamera ? "Cambiar a cámara de docente" : "Cambiar a cámara de pizarra"}
        >
          <Icon name={boardCamera ? "person" : "photo_camera"} size={14} />
          <span className="hidden sm:inline">
            {boardCamera ? "Modo Docente" : "Modo Pizarra"}
          </span>
        </button>
      </div>
      {activeBoardCamera && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Amplio", value: 8 },
            { label: "Medio", value: 14 },
            { label: "Cerrado", value: 20 },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setFrameInset(option.value)}
              aria-pressed={frameInset === option.value}
              className={`rounded-md border px-2 py-1 font-body text-[11px] transition-colors ${
                frameInset === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
