import { createContext } from "react";
import type {
  ClassroomSession,
  MediaState,
  ScreenFramePayload,
  UserRole,
} from "@/types/classroom";
import type { SignGlossPayload } from "@/features/deaf-student/types/signEvents";

export type ClassroomContextValue = {
  session: ClassroomSession | null;
  isLoading: boolean;
  apiAvailable: boolean | null;
  createSession: (title?: string) => Promise<void>;
  joinSession: (code: string, role: UserRole, displayName?: string) => Promise<boolean>;
  endSession: () => void;
  leaveClassroom: () => void;
  endClassroom: () => void;
  toggleMedia: (key: keyof MediaState) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setSubtitleSpeed: (speed: number) => void;
  pushSubtitle: (text: string, isFinal?: boolean) => void;
  setCaption: (payload: { explanation: string; full_text: string }) => void;
  speakCaption: () => void;
  speakFullText: () => void;
  stopSpeaking: () => void;
  enableTeacherAudio: () => void;
  toggleTeacherAudio: () => void;
  isTeacherAudioMuted: boolean;
  teacherAudioBlocked: boolean;
  teacherIsSpeaking: boolean;
  latestSignGloss: SignGlossPayload | null;
  setSignGloss: (payload: SignGlossPayload) => void;
  downloadSummary: () => void;
  isRecordingQuestion: boolean;
  toggleQuestionRecording: () => void;
  toggleBoardCamera: () => void;
  latestScreenFrame: ScreenFramePayload | null;
};

export const ClassroomContext = createContext<ClassroomContextValue | null>(null);
