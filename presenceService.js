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

// Limiting more than 2 users in teh chatroom
export async function joinPresence(roomId, clientId, payload = {}) {
  const roomRef = ref(rtdb, `presence/${roomId}`);
  const myRef = ref(rtdb, `presence/${roomId}/${clientId}`);

  const res = await runTransaction(roomRef, (current) => {
    const obj = current || {};
    const keys = Object.keys(obj);

    if (obj[clientId]) return obj;

    if (keys.length >= 2) return; // abort -> room full
    obj[clientId] = { ...payload, lastSeen: Date.now() };
    return obj;
  });

  if (!res.committed) {
    throw new Error("ROOM_FULL");
  }

  // Auto remove when the server detect user is gone
  await onDisconnect(myRef).remove();

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