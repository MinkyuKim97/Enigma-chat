// presenceService.js
import { rtdb } from "./firebaseConfig.js";
import {
  ref,
  onValue,
  set,
  remove,
  onDisconnect,
  serverTimestamp,
  runTransaction,
  get,
} from "firebase/database";

// 방 입장 시: 2명 제한 + onDisconnect 자동정리
export async function joinPresence(roomId, clientId, payload = {}) {
  const roomRef = ref(rtdb, `presence/${roomId}`);
  const myRef = ref(rtdb, `presence/${roomId}/${clientId}`);

  // 2명 제한을 "원자적으로" 처리 (레이스 방지)
  const res = await runTransaction(roomRef, (current) => {
    const obj = current || {};
    const keys = Object.keys(obj);

    // 이미 들어와 있으면 유지
    if (obj[clientId]) return obj;

    if (keys.length >= 2) return; // abort -> room full
    obj[clientId] = { ...payload, lastSeen: Date.now() };
    return obj;
  });

  if (!res.committed) {
    throw new Error("ROOM_FULL");
  }

  // 서버가 연결 끊김을 감지하면 자동 remove
  await onDisconnect(myRef).remove();

  // 즉시 한번 기록(표시용)
  await set(myRef, {
    ...payload,
    lastSeen: serverTimestamp(),
  });

  return true;
}

export async function leavePresence(roomId, clientId) {
  const myRef = ref(rtdb, `presence/${roomId}/${clientId}`);
  await remove(myRef);
}

export function subscribePresence(roomId, callback) {
  const roomRef = ref(rtdb, `presence/${roomId}`);
  return onValue(roomRef, (snap) => {
    const obj = snap.val() || {};
    callback(obj);
  });
}