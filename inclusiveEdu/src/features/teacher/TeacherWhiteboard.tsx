import { useEffect, useRef, useState } from "react";
import { useClassroom } from "@/hooks/useClassroom";
import { StatusChip } from "@/components/ui/StatusChip";
import { Icon } from "@/components/ui/Icon";
import { classroomSocket } from "@/lib/ws/classroomSocket";
import { uploadScreenshot } from "@/lib/api/classroom";

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

export function TeacherWhiteboard() {
  const { session, nextSlide, prevSlide, toggleMedia } = useClassroom();
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const uploadInFlightRef = useRef(false);
  const lastScreenSampleRef = useRef<Uint8ClampedArray | null>(null);
  const lastScreenUploadAtRef = useRef(0);
  const rateLimitUntilRef = useRef(0);
  const firstScreenUploadPendingRef = useRef(false);
  const [screenStatus, setScreenStatus] = useState("Listo para compartir pantalla");

  const screenShare = session?.media.screenShare ?? false;
  const sessionId = session?.id;

  useEffect(() => {
    if (!screenShare) {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        lastScreenSampleRef.current = null;
        firstScreenUploadPendingRef.current = false;
        rateLimitUntilRef.current = 0;
        setScreenStatus("Listo para compartir pantalla");
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

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          firstScreenUploadPendingRef.current = true;
        }

        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
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
  }, [screenShare, toggleMedia]);

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

    async function captureAndUploadScreen() {
      if (uploadInFlightRef.current || !screenVideoRef.current) return;
      if (Date.now() < rateLimitUntilRef.current) {
        setScreenStatus("Visión en espera por límite de API");
        return;
      }
      const videoElement = screenVideoRef.current;
      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
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

      const canvas = drawScaledFrame(videoElement);
      if (!canvas) return;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.82),
      );
      if (!blob) return;

      const sendCanvas = document.createElement("canvas");
      const maxFrameWidth = 640;
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

  const slide = session.slides[session.slideIndex];
  const total = session.slides.length;
  const hasSlides = total > 0;

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-outline-variant bg-surface-container-lowest shadow-sm">
      <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <h2 className="flex items-center gap-2 font-headline text-headline-md text-on-surface">
          <Icon name={screenShare ? "screen_share" : "co_present"} />
          {screenShare ? "Pantalla compartida" : "Contenido principal"}
        </h2>
        <div className="flex items-center gap-2">
          {hasSlides && !screenShare ? (
            <>
              <button
                type="button"
                aria-label="Diapositiva anterior"
                disabled={session.slideIndex === 0}
                onClick={prevSlide}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-40"
              >
                <Icon name="chevron_left" />
              </button>
              <StatusChip label={`Página ${session.slideIndex + 1}/${total}`} />
              <button
                type="button"
                aria-label="Diapositiva siguiente"
                disabled={session.slideIndex >= total - 1}
                onClick={nextSlide}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-40"
              >
                <Icon name="chevron_right" />
              </button>
            </>
          ) : (
            <StatusChip label={screenStatus} />
          )}
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-[#111318] p-4">
        {screenShare ? (
          <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-outline-variant bg-black">
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full max-h-full w-full object-contain"
            />
          </div>
        ) : slide?.imageUrl ? (
          <div className="flex h-full flex-col gap-4">
            <h3 className="font-headline text-headline-lg text-on-background">{slide.topic}</h3>
            <img
              src={slide.imageUrl}
              alt={slide.body}
              className="mx-auto max-h-[420px] w-full max-w-3xl rounded-lg object-contain"
            />
            <p className="text-center font-body text-body-md text-on-surface-variant">{slide.body}</p>
          </div>
        ) : slide ? (
          <div className="relative mx-auto flex h-full min-h-[280px] max-w-3xl flex-col rounded-xl border border-dashed border-outline-variant/50 bg-white p-8">
            <h3 className="mb-8 font-headline text-headline-lg text-on-background">{slide.topic}</h3>
            <div className="my-auto text-center font-display text-display text-primary">
              {slide.expression ?? slide.body}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
            <Icon name="screen_share" size={56} className="text-primary" />
            <div>
              <p className="font-headline text-headline-md text-on-surface">
                Comparte una pantalla o activa la cámara de pizarra
              </p>
              <p className="mt-2 max-w-xl font-body text-body-md text-on-surface-variant">
                En clase virtual, usa Compartir Pantalla. En presencial, usa el modo Pizarra para enfocar el tablero físico.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
