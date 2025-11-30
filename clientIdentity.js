// clientIdentity.js (project root)
import { db } from "./firebaseConfig.js";
import { doc, runTransaction, setDoc, updateDoc } from "firebase/firestore";

const LS_KEY = "enigimaClient";

function rand4() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, "0");
}

function loadLocal() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v?.id) return v;
  } catch {}
  return null;
}

function saveLocal(client) {
  localStorage.setItem(LS_KEY, JSON.stringify(client));
}

export async function initClientIdentity() {
  // 0) localStorage가 있으면 그대로 사용하되, Firestore 문서도 merge로 보장
  const stored = loadLocal();
  if (stored?.id) {
    await setDoc(
      doc(db, "clients", stored.id),
      {
        id: stored.id,
        userName: stored.userName ?? null,
        lastActiveAtMs: Date.now(),
      },
      { merge: true }
    );
    return { id: stored.id, userName: stored.userName ?? "" };
  }

  // 1) 없으면 새로 생성: clients 목록을 확인하여 중복 방지(트랜잭션)
  for (let i = 0; i < 50; i++) {
    const id = rand4();
    const ref = doc(db, "clients", id);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) throw new Error("ID_TAKEN");

        tx.set(ref, {
          id,
          userName: null,
          createdAtMs: Date.now(),
          lastActiveAtMs: Date.now(),
        });
      });

      const client = { id, userName: "" };
      saveLocal(client);
      return client;
    } catch (e) {
      if (e?.message === "ID_TAKEN") continue;
      console.error("initClientIdentity failed:", e);
    }
  }

  throw new Error("Failed to allocate unique 4-digit client id");
}

function sanitizeName(name) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  // 너무 긴 이름 방지 (원하는 길이로 조절)
  return trimmed.slice(0, 20);
}

export async function setClientUserName(clientId, userName) {
  const clean = sanitizeName(userName);
  if (!clean) throw new Error("Nickname cannot be empty");

  await updateDoc(doc(db, "clients", clientId), {
    userName: clean,
    lastActiveAtMs: Date.now(),
  });

  const stored = loadLocal() ?? { id: clientId };
  const next = { ...stored, id: clientId, userName: clean };
  saveLocal(next);
  return next;
}

export function getStoredClient() {
  return loadLocal();
}

export function resetClientIdentity() {
  localStorage.removeItem(LS_KEY);
}