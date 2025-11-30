import { db } from "./firebaseConfig.js";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  runTransaction,
} from "firebase/firestore";
//----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

export function subscribeRooms(onRooms) {
  const q = query(collection(db, "rooms"), orderBy("createdAtMs", "asc"));
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map((d) => ({ roomId: d.id, ...d.data() }));
    onRooms(rooms);
  });
}
//----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

export async function tryJoinRoom(roomId, clientId) {
  const roomRef = doc(db, "rooms", roomId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error("ROOM_NOT_FOUND");

    const data = snap.data();
    const max = data.maxParticipants ?? 2;
    const participants = data.participants ?? [];

    const alreadyIn = participants.includes(clientId);
    if (!alreadyIn && participants.length >= max) throw new Error("ROOM_FULL");

    const next = alreadyIn ? participants : [...participants, clientId];
    tx.update(roomRef, {
      participants: next,
      participantsCount: next.length,
    });

    return { joined: !alreadyIn, participantsCount: next.length, max };
  });
}

export function subscribeMessages(roomId, onMessages) {
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("sentAtMs", "asc")
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onMessages(msgs);
  });
}

export async function sendMessage(roomId, clientInfo, text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "rooms", roomId, "messages"), {
    senderId: clientInfo.id,
    senderName: clientInfo.userName,
    sentAtMs: Date.now(),
    text: trimmed,
  });
}
//----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------
export async function leaveRoom(roomId, clientId) {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const participants = Array.isArray(data.participants) ? data.participants : [];

    if (!participants.includes(clientId)) return;

    const next = participants.filter((p) => p !== clientId);

    tx.update(roomRef, {
      participants: next,
      participantsCount: next.length,
    });
  });
}