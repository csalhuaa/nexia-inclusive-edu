import { classroomSocket } from "@/lib/ws/classroomSocket";
import type { ClassroomEvent, UserRole } from "@/types/classroom";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const peerId = crypto.randomUUID();
const teacherPeers = new Map<string, RTCPeerConnection>();
const teacherIceQueue = new Map<string, RTCIceCandidateInit[]>();
const pendingStudentPeers = new Set<string>();
let teacherStream: MediaStream | null = null;
let studentPeer: RTCPeerConnection | null = null;
let studentRemoteReady = false;
let studentIceQueue: RTCIceCandidateInit[] = [];
let remoteAudio: HTMLAudioElement | null = null;
let audioBlockedHandler: ((blocked: boolean) => void) | null = null;

function sendSignal(type: ClassroomEvent["type"], payload: Record<string, unknown>) {
  classroomSocket.send({ type, payload } as ClassroomEvent);
}

function ensureRemoteAudio() {
  if (remoteAudio) return remoteAudio;
  remoteAudio = new Audio();
  remoteAudio.autoplay = true;
  remoteAudio.controls = false;
  return remoteAudio;
}

async function createTeacherPeer(targetPeerId: string) {
  if (!teacherStream) {
    pendingStudentPeers.add(targetPeerId);
    return;
  }
  teacherPeers.get(targetPeerId)?.close();

  const pc = new RTCPeerConnection(RTC_CONFIG);
  teacherPeers.set(targetPeerId, pc);

  teacherStream.getAudioTracks().forEach((track) => pc.addTrack(track, teacherStream!));

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    sendSignal("webrtc_ice", {
      from: peerId,
      target: targetPeerId,
      candidate: event.candidate.toJSON(),
    });
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.info("[InclusiveEDU][RTC] offer enviada", { targetPeerId });
  sendSignal("webrtc_offer", {
    from: peerId,
    target: targetPeerId,
    description: pc.localDescription?.toJSON(),
  });
}

async function ensureStudentPeer() {
  if (studentPeer) return studentPeer;

  const pc = new RTCPeerConnection(RTC_CONFIG);
  studentPeer = pc;

  pc.ontrack = (event) => {
    console.info("[InclusiveEDU][RTC] audio remoto recibido", {
      streams: event.streams.length,
      tracks: event.streams[0]?.getAudioTracks().length ?? 0,
    });
    const audio = ensureRemoteAudio();
    audio.srcObject = event.streams[0];
    audio.play().then(
      () => audioBlockedHandler?.(false),
      () => audioBlockedHandler?.(true),
    );
  };

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    sendSignal("webrtc_ice", {
      from: peerId,
      candidate: event.candidate.toJSON(),
    });
  };

  return pc;
}

export function setTeacherAudioStream(stream: MediaStream | null) {
  teacherStream = stream;
  if (!stream) {
    teacherPeers.forEach((pc) => pc.close());
    teacherPeers.clear();
    return;
  }
  pendingStudentPeers.forEach((targetPeerId) => {
    void createTeacherPeer(targetPeerId);
  });
  pendingStudentPeers.clear();
}

export function announceStudentAudioReady() {
  console.info("[InclusiveEDU][RTC] estudiante listo para audio", { peerId });
  sendSignal("webrtc_ready", { from: peerId });
}

export function setAudioBlockedHandler(handler: ((blocked: boolean) => void) | null) {
  audioBlockedHandler = handler;
}

export async function enableStudentAudio() {
  const audio = ensureRemoteAudio();
  await audio.play().catch(() => undefined);
  audioBlockedHandler?.(false);
  announceStudentAudioReady();
}

export function stopStudentAudio() {
  studentPeer?.close();
  studentPeer = null;
  studentRemoteReady = false;
  studentIceQueue = [];
  if (remoteAudio) {
    remoteAudio.pause();
    remoteAudio.srcObject = null;
    remoteAudio = null;
  }
}

export async function handleRtcEvent(event: ClassroomEvent, role: UserRole | null) {
  if (event.type === "webrtc_ready" && role === "teacher") {
    console.info("[InclusiveEDU][RTC] ready recibido en docente", event.payload);
    await createTeacherPeer(String(event.payload.from));
    return;
  }

  if (event.type === "webrtc_offer" && role === "blind-student") {
    if (event.payload.target && event.payload.target !== peerId) return;
    const pc = await ensureStudentPeer();
    await pc.setRemoteDescription(event.payload.description as RTCSessionDescriptionInit);
    studentRemoteReady = true;
    for (const candidate of studentIceQueue) {
      await pc.addIceCandidate(candidate);
    }
    studentIceQueue = [];
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.info("[InclusiveEDU][RTC] answer enviada", { target: event.payload.from });
    sendSignal("webrtc_answer", {
      from: peerId,
      target: event.payload.from,
      description: pc.localDescription?.toJSON(),
    });
    return;
  }

  if (event.type === "webrtc_answer" && role === "teacher") {
    const target = String(event.payload.from);
    const pc = teacherPeers.get(target);
    if (pc) {
      await pc.setRemoteDescription(event.payload.description as RTCSessionDescriptionInit);
      for (const candidate of teacherIceQueue.get(target) ?? []) {
        await pc.addIceCandidate(candidate);
      }
      teacherIceQueue.delete(target);
      console.info("[InclusiveEDU][RTC] answer recibida en docente", { target });
    }
    return;
  }

  if (event.type === "webrtc_ice") {
    const candidate = event.payload.candidate as RTCIceCandidateInit | undefined;
    if (!candidate) return;
    if (role === "teacher") {
      const from = String(event.payload.from);
      const pc = teacherPeers.get(from);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        teacherIceQueue.set(from, [...(teacherIceQueue.get(from) ?? []), candidate]);
      }
      return;
    }
    if (role === "blind-student") {
      if (event.payload.target && event.payload.target !== peerId) return;
      if (studentPeer && studentRemoteReady) {
        await studentPeer.addIceCandidate(candidate);
      } else {
        studentIceQueue.push(candidate);
      }
    }
  }
}
