import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ClassroomContext, type ClassroomContextValue } from "@/context/classroomContext";
import { env } from "@/config/env";
import { createClassroom, joinClassroom } from "@/lib/api/classroom";
import { checkApiHealth } from "@/lib/api/client";
import {
  createDemoSession,
  DEMO_CAPTIONS,
  DEMO_SUBTITLE_PHRASES,
  buildSessionSummary,
} from "@/lib/demo/classroomDemo";
import { classroomSocket } from "@/lib/ws/classroomSocket";
import {
  announceStudentAudioReady,
  enableStudentAudio,
  handleRtcEvent,
  isTeacherAudioActive,
  setAudioBlockedHandler,
  stopStudentAudio,
} from "@/lib/rtc/audioBridge";
import type {
  ClassroomSession,
  ConnectionMode,
  MediaState,
  Participant,
  ScreenFramePayload,
  SubtitleEntry,
  UserRole,
} from "@/types/classroom";
import type { SignGlossPayload } from "@/features/deaf-student/types/signEvents";

type ToastFn = (message: string, type?: "info" | "success" | "error") => void;
const PARTICIPANT_STALE_MS = 35_000;

function applySessionPatch(
  session: ClassroomSession,
  patch: Partial<ClassroomSession>,
): ClassroomSession {
  return { ...session, ...patch };
}

function sanitizeNarrationText(text: string): string {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[`*_#>{}\[\]|~^]/g, " ")
    .replace(/["“”]/g, "")
    .replace(/\b(the user|the image|the prompt|instruction|analysis|reasoning)\b.*$/gi, " ")
    .replace(/\b(el usuario|la instrucción|el prompt|razonamiento interno)\b.*$/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(the user|the image|the prompt|analysis|reasoning)\b/i.test(cleaned)) {
    return "";
  }

  return cleaned;
}

function getSpanishVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es-pe")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es-419")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es")) ??
    null
  );
}

const SIGN_GLOSS_DICTIONARY: Record<string, string> = {
  hoy: "TODAY",
  vamos: "GO",
  estudiar: "STUDY",
  aprender: "LEARN",
  derivadas: "DERIVATIVE",
  derivada: "DERIVATIVE",
  funcion: "FUNCTION",
  funciones: "FUNCTION",
  ecuacion: "EQUATION",
  ecuaciones: "EQUATION",
  grafico: "GRAPH",
  grafica: "GRAPH",
  pregunta: "QUESTION",
  respuesta: "ANSWER",
  importante: "IMPORTANT",
  ejemplo: "EXAMPLE",
  pizarra: "BOARD",
  tablero: "BOARD",
  hash: "HASH",
  clave: "CLAVE",
  seguridad: "SEGURIDAD",
};

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function buildSimulatedSignGloss(text: string): SignGlossPayload {
  const words = normalizeText(text)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const gloss = words
    .map((word) => SIGN_GLOSS_DICTIONARY[word] ?? word.toUpperCase())
    .filter((word) => word.length > 2)
    .slice(0, 8);

  return {
    language: "LSP",
    mode: "simulation",
    original_text: text,
    gloss: gloss.length ? gloss : ["EXPLAIN"],
    pose: { mode: "mock_pose", frames: [] },
  };
}

function getPresenceId() {
  const key = "inclusiveedu.presenceId";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.sessionStorage.setItem(key, next);
  return next;
}

function buildParticipantPresence(session: ClassroomSession): Participant {
  const accessibility =
    session.role === "blind-student" ? "blind" : session.role === "deaf-student" ? "deaf" : "none";
  const name =
    session.role === "blind-student"
      ? "Estudiante ciego"
      : session.role === "deaf-student"
        ? "Estudiante sordo"
        : "Docente";

  return {
    id: getPresenceId(),
    name,
    role: session.role ?? "deaf-student",
    accessibility,
    isOnline: true,
    lastSeenAt: Date.now(),
  };
}

type ClassroomProviderProps = {
  children: ReactNode;
  onToast?: ToastFn;
};

export function ClassroomProvider({ children, onToast }: ClassroomProviderProps) {
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [isRecordingQuestion, setIsRecordingQuestion] = useState(false);
  const [teacherAudioBlocked, setTeacherAudioBlocked] = useState(false);
  const [teacherIsSpeaking, setTeacherIsSpeaking] = useState(false);
  const [latestSignGloss, setLatestSignGloss] = useState<SignGlossPayload | null>(null);
  const [latestScreenFrame, setLatestScreenFrame] = useState<ScreenFramePayload | null>(null);

  const demoIndexRef = useRef(0);
  const captionIndexRef = useRef(0);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<ClassroomSession | null>(null);
  const lastNarrationAtRef = useRef(0);
  const pendingNarrationRef = useRef<string | null>(null);
  const narrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teacherSpeakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const toast = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      onToast?.(message, type);
    },
    [onToast],
  );

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
  }, []);

  const stopNarration = useCallback(() => {
    pendingNarrationRef.current = null;
    if (narrationTimerRef.current) {
      clearTimeout(narrationTimerRef.current);
      narrationTimerRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stopTeacherAudio = useCallback(() => {
    stopStudentAudio();
  }, []);

  const enableTeacherAudio = useCallback(() => {
    setTeacherAudioBlocked(false);
    void enableStudentAudio();
  }, []);

  useEffect(() => {
    setAudioBlockedHandler(setTeacherAudioBlocked);
    return () => setAudioBlockedHandler(null);
  }, []);

  const pushSubtitle = useCallback((text: string, isFinal = true) => {
    const entry: SubtitleEntry = {
      id: crypto.randomUUID(),
      text,
      timestamp: Date.now(),
      isFinal,
    };

    setSession((prev) => {
      if (!prev) return prev;
      const subtitles = [...prev.subtitles, entry].slice(-20);
      return applySessionPatch(prev, { subtitles });
    });
  }, []);

  const setCaption = useCallback((text: string) => {
    setSession((prev) => (prev ? applySessionPatch(prev, { currentCaption: text }) : prev));
  }, []);

  const setSignGloss = useCallback((payload: SignGlossPayload) => {
    setLatestSignGloss(payload);
  }, []);

  const markTeacherSpeaking = useCallback((active = true) => {
    if (teacherSpeakingTimerRef.current) {
      clearTimeout(teacherSpeakingTimerRef.current);
      teacherSpeakingTimerRef.current = null;
    }

    if (!active) {
      setTeacherIsSpeaking(false);
      return;
    }

    setTeacherIsSpeaking(true);
    teacherSpeakingTimerRef.current = setTimeout(() => {
      setTeacherIsSpeaking(false);
      teacherSpeakingTimerRef.current = null;
    }, 2000);
  }, []);

  const speakNow = useCallback((text: string, interrupt = false) => {
    if (!text || !("speechSynthesis" in window)) return;
    const spokenText = sanitizeNarrationText(text);
    if (!spokenText) return;

    if (interrupt) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "es-PE";
    utterance.voice = getSpanishVoice();
    utterance.rate = sessionRef.current?.subtitleSpeed ?? 1;
    utterance.volume = isTeacherAudioActive() ? 0.55 : 0.92;
    window.speechSynthesis.speak(utterance);
    lastNarrationAtRef.current = Date.now();
  }, []);

  const queueBoardNarration = useCallback(
    (text: string) => {
      const cleanText = sanitizeNarrationText(text);
      if (!cleanText || sessionRef.current?.status === "ended") return;

      const minGapMs = 18000;
      const elapsed = Date.now() - lastNarrationAtRef.current;

      const isSpeaking = "speechSynthesis" in window && window.speechSynthesis.speaking;
      console.info("[InclusiveEDU][Vision] narración visual recibida", cleanText);

      if (elapsed >= minGapMs && !isSpeaking) {
        speakNow(`Descripción visual: ${cleanText}`, true);
        return;
      }

      pendingNarrationRef.current = cleanText;
      if (narrationTimerRef.current) return;

      narrationTimerRef.current = setTimeout(() => {
        narrationTimerRef.current = null;
        const pending = pendingNarrationRef.current;
        pendingNarrationRef.current = null;
        if (pending && sessionRef.current?.status !== "ended") {
          speakNow(`Descripción visual: ${pending}`, true);
        }
      }, Math.max(2500, minGapMs - elapsed));
    },
    [speakNow],
  );

  useEffect(() => {
    return () => stopNarration();
  }, [stopNarration]);

  useEffect(() => {
    return () => {
      if (teacherSpeakingTimerRef.current) {
        clearTimeout(teacherSpeakingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session?.status === "ended") {
      stopNarration();
    }
    if (session?.role !== "blind-student") {
      stopNarration();
    }
    if (session?.role !== "blind-student" && session?.role !== "deaf-student") {
      stopTeacherAudio();
    }
    if (session?.status === "ended") {
      stopTeacherAudio();
    }
  }, [session?.role, session?.status, stopNarration, stopTeacherAudio]);

  useEffect(() => {
    if (
      (session?.role === "blind-student" || session?.role === "deaf-student") &&
      session.status === "live"
    ) {
      announceStudentAudioReady();
      const cleanup = classroomSocket.onOpen(() => announceStudentAudioReady());
      const retry = window.setInterval(() => announceStudentAudioReady(), 3000);
      const stopRetry = window.setTimeout(() => window.clearInterval(retry), 15000);
      return () => {
        cleanup();
        window.clearInterval(retry);
        window.clearTimeout(stopRetry);
      };
    }
    return undefined;
  }, [session?.role, session?.status]);

  useEffect(() => {
    if (!session || session.status !== "live" || session.role === "teacher") return undefined;

    const sendPresence = (isOnline = true) => {
      const participant = buildParticipantPresence(session);
      classroomSocket.send({
        type: "participant",
        payload: { ...participant, isOnline, lastSeenAt: Date.now() },
      });
    };

    sendPresence(true);
    const timer = window.setInterval(() => sendPresence(true), 10_000);
    return () => {
      window.clearInterval(timer);
      sendPresence(false);
    };
  }, [session]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.role !== "teacher") return prev;
        const now = Date.now();
        const participants = prev.participants.filter(
          (participant) =>
            participant.role === "teacher" ||
            (participant.isOnline && now - (participant.lastSeenAt ?? now) < PARTICIPANT_STALE_MS),
        );
        return participants.length === prev.participants.length
          ? prev
          : applySessionPatch(prev, { participants });
      });
    }, 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const startSimulation = useCallback(
    (mode: ConnectionMode) => {
      if (mode !== "demo") return;
      stopSimulation();

      simulationRef.current = setInterval(() => {
        const phrase = DEMO_SUBTITLE_PHRASES[demoIndexRef.current % DEMO_SUBTITLE_PHRASES.length];
        demoIndexRef.current += 1;
        pushSubtitle(phrase);

        if (demoIndexRef.current % 2 === 0) {
          const caption = DEMO_CAPTIONS[captionIndexRef.current % DEMO_CAPTIONS.length];
          captionIndexRef.current += 1;
          setCaption(caption);
        }
      }, 6000);
    },
    [pushSubtitle, setCaption, stopSimulation],
  );

  const connectRealtime = useCallback(
    (sessionId: string, mode: ConnectionMode) => {
      if (mode !== "api" && mode !== "websocket") return;

	      classroomSocket.connect(
	        sessionId,
	        (event) => {
	          void handleRtcEvent(event, sessionRef.current?.role ?? null);
	          if (event.type === "subtitle") {
              markTeacherSpeaking(true);
	            pushSubtitle(event.payload.text, event.payload.isFinal);
	            if (sessionRef.current?.role === "deaf-student") {
	              setLatestSignGloss(buildSimulatedSignGloss(event.payload.text));
	            }
	          }
	          if (event.type === "sign_gloss") {
              markTeacherSpeaking(true);
	            setLatestSignGloss(event.payload);
	          }
          if (event.type === "teacher_speaking") {
            markTeacherSpeaking(event.payload.active);
          }
          if (event.type === "caption") {
            setCaption(event.payload);
            if (sessionRef.current?.role === "blind-student") {
              queueBoardNarration(event.payload);
            }
          }
          if (event.type === "participant") {
            setSession((prev) => {
              if (!prev) return prev;
              if (!event.payload.isOnline) {
                return applySessionPatch(prev, {
                  participants: prev.participants.filter((p) => p.id !== event.payload.id),
                });
              }
              const payload = { ...event.payload, lastSeenAt: event.payload.lastSeenAt ?? Date.now() };
              const current = prev.participants.find((p) => p.id === payload.id);
              if (
                current &&
                current.name === payload.name &&
                current.role === payload.role &&
                current.accessibility === payload.accessibility &&
                current.isOnline === payload.isOnline &&
                Date.now() - (current.lastSeenAt ?? 0) < 20_000
              ) {
                return prev;
              }
              const participants = current
                ? prev.participants.map((p) => (p.id === payload.id ? payload : p))
                : [...prev.participants, payload];
              return applySessionPatch(prev, { participants });
            });
          }
          if (event.type === "slide") {
            setSession((prev) =>
              prev ? applySessionPatch(prev, { slideIndex: event.payload }) : prev,
            );
          }
          if (event.type === "media") {
            setSession((prev) => (prev ? applySessionPatch(prev, { media: event.payload }) : prev));
          }
          if (event.type === "screen_frame") {
            setLatestScreenFrame(event.payload);
          }
          if (event.type === "session_end") {
            setSession((prev) => (prev ? applySessionPatch(prev, { status: "ended" }) : prev));
            toast("La clase ha finalizado", "info");
          }
        },
        () => toast("Conexión en tiempo real interrumpida", "error"),
      );
    },
    [markTeacherSpeaking, pushSubtitle, queueBoardNarration, setCaption, toast],
  );

  useEffect(() => {
    checkApiHealth().then(setApiAvailable);
    return () => {
      stopSimulation();
      classroomSocket.disconnect();
    };
  }, [stopSimulation]);

  const activateSession = useCallback(
    (next: ClassroomSession, mode: ConnectionMode) => {
      const hydrated = applySessionPatch(next, {
        connectionMode: mode,
        status: "live",
        slides: [],
      });
      setSession(hydrated);
      setLatestScreenFrame(null);
      pushSubtitle("Clase iniciada — los subtítulos aparecerán aquí");
      startSimulation(mode);
      connectRealtime(hydrated.id, mode);
    },
    [connectRealtime, pushSubtitle, startSimulation],
  );

  const createSessionHandler = useCallback(
    async (title = "Sesión de hoy") => {
      setIsLoading(true);
      try {
        if (apiAvailable) {
          const created = await createClassroom({ title });
          activateSession({ ...created, role: "teacher" }, "api");
          toast("Clase creada y conectada al servidor", "success");
          return;
        }
      } catch {
        if (!env.demoFallback) {
          toast("No se pudo crear la clase. Verifica el backend.", "error");
          return;
        }
      } finally {
        setIsLoading(false);
      }

      const demo = createDemoSession(title);
      activateSession({ ...demo, role: "teacher" }, "demo");
      toast("Modo demostración — backend no disponible", "info");
    },
    [activateSession, apiAvailable, toast],
  );

  const joinSessionHandler = useCallback(
    async (code: string, role: UserRole, displayName?: string): Promise<boolean> => {
      if (!code.trim()) {
        toast("Ingresa un código de clase válido", "error");
        return false;
      }

      setIsLoading(true);
      try {
        if (apiAvailable) {
          const joined = await joinClassroom({ code, role, displayName });
          activateSession({ ...joined, role }, "api");
          toast("Te has unido a la clase", "success");
          return true;
        }
      } catch {
        if (!env.demoFallback) {
          toast("Código inválido o servidor no disponible", "error");
          return false;
        }
      } finally {
        setIsLoading(false);
      }

      const demo = createDemoSession("Sesión de hoy");
      activateSession({ ...demo, code: code.toUpperCase(), role }, "demo");
      toast("Modo demostración — simulación en vivo activa", "info");
      return true;
    },
    [activateSession, apiAvailable, toast],
  );

  const endSession = useCallback(() => {
    stopSimulation();
    stopNarration();
    stopTeacherAudio();
    classroomSocket.disconnect();
    setSession((prev) => (prev ? applySessionPatch(prev, { status: "ended" }) : prev));
    toast("Clase finalizada", "info");
  }, [stopNarration, stopSimulation, stopTeacherAudio, toast]);

  const toggleMedia = useCallback((key: keyof MediaState) => {
    setSession((prev) => {
      if (!prev) return prev;
      const media = { ...prev.media, [key]: !prev.media[key] };
      classroomSocket.send({ type: "media", payload: media });
      return applySessionPatch(prev, { media });
    });
  }, []);

  const nextSlide = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const slideIndex = Math.min(prev.slideIndex + 1, prev.slides.length - 1);
      classroomSocket.send({ type: "slide", payload: slideIndex });
      return applySessionPatch(prev, { slideIndex });
    });
  }, []);

  const prevSlide = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const slideIndex = Math.max(prev.slideIndex - 1, 0);
      classroomSocket.send({ type: "slide", payload: slideIndex });
      return applySessionPatch(prev, { slideIndex });
    });
  }, []);

  const setSubtitleSpeed = useCallback((speed: number) => {
    const clamped = Math.min(2, Math.max(0.5, speed));
    setSession((prev) => (prev ? applySessionPatch(prev, { subtitleSpeed: clamped }) : prev));
  }, []);

  const speakCaption = useCallback(() => {
    if (!session?.currentCaption || !("speechSynthesis" in window)) {
      toast("Tu navegador no soporta síntesis de voz", "error");
      return;
    }
    window.speechSynthesis.cancel();
    const spokenText = sanitizeNarrationText(session.currentCaption);
    if (!spokenText) return;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "es-PE";
    utterance.voice = getSpanishVoice();
    utterance.rate = session.subtitleSpeed;
    window.speechSynthesis.speak(utterance);
    toast("Reproduciendo narración", "info");
  }, [session, toast]);

  const downloadSummary = useCallback(() => {
    if (!session) return;
    const content = buildSessionSummary(session);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inclusive-edu-${session.code}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Resumen descargado", "success");
  }, [session, toast]);

  const toggleQuestionRecording = useCallback(() => {
    const next = !isRecordingQuestion;
    setIsRecordingQuestion(next);
    toast(next ? "Grabando pregunta… (simulado)" : "Pregunta enviada al docente", next ? "info" : "success");
    if (next) {
      setTimeout(() => setIsRecordingQuestion(false), 4000);
    }
  }, [isRecordingQuestion, toast]);

  const toggleBoardCamera = useCallback(() => {
    let message: string | null = null;
    setSession((prev) => {
      if (!prev) return prev;
      const boardCamera = !prev.media.boardCamera;
      const media = { ...prev.media, boardCamera };
      classroomSocket.send({ type: "media", payload: media });
      message = boardCamera ? "Cámara de pizarra activada" : "Cámara de pizarra desactivada";
      return applySessionPatch(prev, { media });
    });
    if (message) toast(message, "info");
  }, [toast]);

  const value = useMemo<ClassroomContextValue>(
    () => ({
      session,
      isLoading,
      apiAvailable,
      createSession: createSessionHandler,
      joinSession: joinSessionHandler,
      endSession,
      toggleMedia,
      nextSlide,
      prevSlide,
      setSubtitleSpeed,
      pushSubtitle,
      setCaption,
      speakCaption,
      enableTeacherAudio,
      teacherAudioBlocked,
      teacherIsSpeaking,
      latestSignGloss,
      setSignGloss,
      downloadSummary,
      isRecordingQuestion,
      toggleQuestionRecording,
      toggleBoardCamera,
      latestScreenFrame,
    }),
    [
      session,
      isLoading,
      apiAvailable,
      createSessionHandler,
      joinSessionHandler,
      endSession,
      toggleMedia,
      nextSlide,
      prevSlide,
      setSubtitleSpeed,
      pushSubtitle,
      setCaption,
      speakCaption,
      enableTeacherAudio,
      teacherAudioBlocked,
      teacherIsSpeaking,
      latestSignGloss,
      setSignGloss,
      downloadSummary,
      isRecordingQuestion,
      toggleQuestionRecording,
      toggleBoardCamera,
      latestScreenFrame,
    ],
  );

  return <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>;
}
