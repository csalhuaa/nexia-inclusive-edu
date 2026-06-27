let screenStream: MediaStream | null = null;
let cameraStream: MediaStream | null = null;
let teacherMicStream: MediaStream | null = null;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function registerScreenStream(stream: MediaStream | null) {
  if (screenStream && screenStream !== stream) {
    stopStream(screenStream);
  }
  screenStream = stream;
}

export function registerCameraStream(stream: MediaStream | null) {
  if (cameraStream && cameraStream !== stream) {
    stopStream(cameraStream);
  }
  cameraStream = stream;
}

export function registerTeacherMicStream(stream: MediaStream | null) {
  if (teacherMicStream && teacherMicStream !== stream) {
    stopStream(teacherMicStream);
  }
  teacherMicStream = stream;
}

export function stopAllClassroomMedia() {
  stopStream(screenStream);
  stopStream(cameraStream);
  stopStream(teacherMicStream);
  screenStream = null;
  cameraStream = null;
  teacherMicStream = null;
}
