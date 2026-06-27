import { useCallback, useEffect, useRef, useState } from "react";
import { useClassroom } from "@/hooks/useClassroom";
import { StatusChip } from "@/components/ui/StatusChip";
import { Icon } from "@/components/ui/Icon";
import { classroomSocket } from "@/lib/ws/classroomSocket";
import { uploadScreenshot } from "@/lib/api/classroom";
import { TeacherCameraPanel } from "@/features/teacher/TeacherCameraPanel";
import { AvatarVideo } from "@/features/deaf-student/components/AvatarVideo";
import { registerScreenStream } from "@/lib/media/classroomMedia";

function drawScaledFrame(videoElement: HTMLVideoElement) {
  const sourceWidth = videoElement.videoWidth || 1280;
  const sourceHeight = videoElement.videoHeight || 720;
  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / sourceWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(sourceWidth * scale));
  canvas.height = Math.max(2, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function TeacherInterpreterPreview({
  isSpeaking,
  status,
}: {
  isSpeaking: boolean;
  status?: string;
}) {
  return (
    <aside className="hidden min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-3 lg:flex">
      <div className="mb-2 flex items-center justify-between text-white">
        <span className="font-body text-label-sm font-semibold">Intérprete AI</span>
        <span className={`text-[11px] ${isSpeaking ? "text-emerald-300" : "text-white/55"}`}>
          {isSpeaking ? "Activo" : "En espera"}
        </span>
      </div>
      <AvatarVideo isSpeaking={isSpeaking} compact className="h-auto" />
      <p className="mt-3 font-body text-[11px] leading-relaxed text-white/60">
        Vista previa compacta del intérprete que ven los estudiantes sordos.
      </p>
      {status && <StatusChip label={status} className="mt-auto justify-center" />}
    </aside>
  );
}

export function TeacherWhiteboard() {
  const { session, toggleMedia, teacherIsSpeaking } = useClassroom();
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const uploadInFlightRef = useRef(false);
  const lastScreenSampleRef = useRef<Uint8ClampedArray | null>(null);
  const lastScreenUploadAtRef = useRef(0);
  const lastPreviewFrameAtRef = useRef(0);
  const rateLimitUntilRef = useRef(0);
  const firstScreenUploadPendingRef = useRef(false);
  const screenWasActiveRef = useRef(false);
  const [screenStatus, setScreenStatus] = useState("Listo para compartir pantalla");
  const [activeTab, setActiveTab] = useState<"screen" | "board">("screen");

  const screenShare = session?.media.screenShare ?? false;
  const sessionId = session?.id;

  const publishScreenShareStopped = useCallback(() => {
    if (!screenWasActiveRef.current && !screenStreamRef.current) return;

    screenWasActiveRef.current = false;
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    registerScreenStream(null);
    lastScreenSampleRef.current = null;
    firstScreenUploadPendingRef.current = false;
    rateLimitUntilRef.current = 0;
    lastPreviewFrameAtRef.current = 0;
    uploadInFlightRef.current = false;
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setScreenStatus("Listo para compartir pantalla");
    classroomSocket.send({ type: "screen_share_stopped" });
    classroomSocket.send({
      type: "screen_frame",
      payload: { data: "", width: 0, height: 0 },
    });
  }, []);

  useEffect(() => {
    if (!screenShare) {
      publishScreenShareStopped();
      return;
    }

    let cancelled = false;

    async function startScreenShare() {
      try {
        setScreenStatus("Selecciona una pestaña, ventana o pantalla");
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = stream;
        registerScreenStream(stream);
        screenWasActiveRef.current = true;

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          firstScreenUploadPendingRef.current = true;
        }

        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          publishScreenShareStopped();
          if (screenShare) toggleMedia("screenShare");
        });

        setScreenStatus("Compartiendo pantalla");
      } catch {
        setScreenStatus("No se pudo compartir pantalla");
        if (screenShare) toggleMedia("screenShare");
      }
    }

    void startScreenShare();

    return () => {
      cancelled = true;
    };
  }, [publishScreenShareStopped, screenShare, toggleMedia]);

  useEffect(() => {
    if (!screenShare || session?.connectionMode !== "api" || !sessionId) return;
    const activeSessionId = sessionId;

    function hasMeaningfulScreenChange(videoElement: HTMLVideoElement): boolean {
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 32;
      sampleCanvas.height = 18;
      const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return true;

      sampleContext.drawImage(videoElement, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const sample = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      const previous = lastScreenSampleRef.current;
      lastScreenSampleRef.current = new Uint8ClampedArray(sample);

      if (!previous) return true;

      let changedPixels = 0;
      for (let i = 0; i < sample.length; i += 4) {
        const delta =
          Math.abs(sample[i] - previous[i]) +
          Math.abs(sample[i + 1] - previous[i + 1]) +
          Math.abs(sample[i + 2] - previous[i + 2]);
        if (delta > 45) changedPixels += 1;
      }

      return changedPixels / (sample.length / 4) > 0.05;
    }

    function publishPreviewFrame(videoElement: HTMLVideoElement, sourceCanvas: HTMLCanvasElement) {
      const now = Date.now();
      if (now - lastPreviewFrameAtRef.current < 1000) return;
      lastPreviewFrameAtRef.current = now;

      const previewCanvas = document.createElement("canvas");
      const maxFrameWidth = 960;
      const scale = Math.min(1, maxFrameWidth / sourceCanvas.width);
      previewCanvas.width = Math.round(sourceCanvas.width * scale);
      previewCanvas.height = Math.round(sourceCanvas.height * scale);
      const previewCtx = previewCanvas.getContext("2d");
      if (!previewCtx) return;
      previewCtx.drawImage(videoElement, 0, 0, previewCanvas.width, previewCanvas.height);
      previewCanvas.toBlob((sendBlob) => {
        if (sendBlob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            classroomSocket.send({
              type: "screen_frame",
              payload: {
                data: reader.result as string,
                width: previewCanvas.width,
                height: previewCanvas.height,
              },
            });
          };
          reader.readAsDataURL(sendBlob);
        }
      }, "image/jpeg", 0.72);
    }

    async function captureAndUploadScreen() {
      if (!screenVideoRef.current) return;
      const videoElement = screenVideoRef.current;
      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const canvas = drawScaledFrame(videoElement);
      if (!canvas) return;
      publishPreviewFrame(videoElement, canvas);

      if (uploadInFlightRef.current) return;
      if (Date.now() < rateLimitUntilRef.current) {
        setScreenStatus("Visión en espera por límite de API");
        return;
      }
      const forceFirstUpload = firstScreenUploadPendingRef.current;
      if (!forceFirstUpload && !hasMeaningfulScreenChange(videoElement)) {
        setScreenStatus("Pantalla sin cambios relevantes");
        return;
      }
      firstScreenUploadPendingRef.current = false;

      const now = Date.now();
      if (!forceFirstUpload && now - lastScreenUploadAtRef.current < 12000) {
        setScreenStatus("Cambio detectado");
        return;
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.82),
      );
      if (!blob) return;

      uploadInFlightRef.current = true;
      lastScreenUploadAtRef.current = now;
      try {
        console.info("[InclusiveEDU][Vision] subiendo captura de pantalla", {
          force: forceFirstUpload,
          width: canvas.width,
          height: canvas.height,
        });
        const result = await uploadScreenshot(activeSessionId, blob, forceFirstUpload);
        console.info("[InclusiveEDU][Vision] respuesta captura", result);
        setScreenStatus(
          result.rateLimited
            ? "Visión limitada, reintentando"
            : result.duplicate
              ? "Pantalla sin cambios"
              : "Pantalla analizada",
        );
        if (result.rateLimited) {
          rateLimitUntilRef.current = Date.now() + 45000;
          firstScreenUploadPendingRef.current = false;
        }
      } catch {
        console.error("[InclusiveEDU][Vision] no se pudo analizar la pantalla");
        setScreenStatus("No se pudo analizar la pantalla");
      } finally {
        uploadInFlightRef.current = false;
      }
    }

    const timer = window.setInterval(() => void captureAndUploadScreen(), 3000);
    void captureAndUploadScreen();
    return () => window.clearInterval(timer);
  }, [screenShare, session?.connectionMode, sessionId]);

  if (!session) return null;

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white/90 shadow-[0_18px_48px_rgba(18,32,51,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/70 bg-white/75 px-4 py-3 backdrop-blur-xl">
        <div className="flex rounded-full border border-outline-variant bg-surface-container-low p-1">
          {[
            { key: "screen" as const, label: "Pantalla compartida", icon: "screen_share" },
            { key: "board" as const, label: "Pizarra / Cámara", icon: "photo_camera" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-body text-label-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-white hover:text-primary"
              }`}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {screenShare && <StatusChip label="Compartiendo pantalla" />}
          {session.media.boardCamera && <StatusChip label="Cámara activa" />}
          {teacherIsSpeaking && <StatusChip label="Docente hablando" />}
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-[#111318] p-4">
        {activeTab === "screen" ? (
          <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-outline-variant bg-black">
              {screenShare ? (
                <div className="relative flex h-full max-h-full w-full items-center justify-center">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full max-h-full w-full object-contain"
                  />
                  <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-surface-container-high/95 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <span className="font-body text-label-lg text-on-surface">Estás compartiendo tu pantalla</span>
                    <button
                      type="button"
                      onClick={() => toggleMedia("screenShare")}
                      className="rounded-full bg-error px-4 py-2 font-body text-label-sm font-semibold text-on-error shadow-sm transition-colors hover:bg-error/90 focus-visible:ring-3 focus-visible:ring-error focus-visible:ring-offset-2"
                    >
                      Dejar de compartir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center text-inverse-on-surface/70">
                  <Icon name="screen_share" size={56} />
                  <div>
                    <p className="font-headline text-headline-md text-inverse-on-surface">
                      Pantalla compartida
                    </p>
                    <p className="mt-2 max-w-md font-body text-body-md">
                      Comparte una pestaña, ventana o pantalla para que el sistema describa el contenido.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMedia("screenShare")}
                    className="rounded-full bg-primary px-5 py-3 font-body text-label-lg font-semibold text-on-primary shadow-lg transition-colors hover:bg-primary/90"
                  >
                    Compartir pantalla
                  </button>
                </div>
              )}
            </div>
            <TeacherInterpreterPreview isSpeaking={teacherIsSpeaking} status={screenStatus} />
          </div>
        ) : (
          <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <TeacherCameraPanel large />
            <TeacherInterpreterPreview
              isSpeaking={teacherIsSpeaking}
              status={session.media.boardCamera ? "Cámara activa" : "Cámara lista"}
            />
          </div>
        )}
      </div>
    </section>
  );
}
