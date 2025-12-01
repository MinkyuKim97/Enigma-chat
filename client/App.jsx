// import CSS
import "../style.css";

// Import React
import { useEffect, useMemo, useRef, useState } from "react";
//Import basic Firebase database, real-time database
import { db, rtdb } from "../firebaseConfig.js";
// Import Firestore database
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction as runFsTransaction,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  limit,
  deleteField,
} from "firebase/firestore";

// Import Firebase real-time database
import {
  ref,
  onValue,
  set,
  remove,
  onDisconnect,
  runTransaction as runRtdbTransaction,
  serverTimestamp,
} from "firebase/database";

import {
  initClientIdentity,
  setClientUserName,
  resetClientIdentity,
} from "../clientIdentity.js";

// Limiting the amount of participants
const MAX_OCCUPANTS = 2;

// Set the origianl 8 digit recipes as a '00000000'
const RECIPE_DEFAULT = "00000000";
//Compare the recipe and check is it available
const isValidRecipe = (r) =>
  typeof r === "string" && /^\d{8}$/.test(r) && r !== RECIPE_DEFAULT;

function toDateFromMs(ms) {
  return typeof ms === "number" ? new Date(ms) : new Date();
}

// Limiting room name length (from examples)
function sanitizeRoomName(name) {
  const cleaned = (name ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return cleaned.slice(0, 30);
}

// Limiting the message omly with Eng for encrypting the string in the right way
function validateEnglishOnly(text) {
  for (const ch of text) {
    if (/\p{L}/u.test(ch)) {
      if (!/[A-Za-z]/.test(ch)) {
        return { ok: false, badChar: ch };
      }
    }
  }
  return { ok: true, badChar: null };
}

function makeRoomId() {
  return `room__${Date.now()}`;
}
function makeRoomNameFallback(nextNumber) {
  return `room no.${nextNumber}`;
}

//**********************************************************************
// Room encrypt/decrypt recipe making function
// Comparing first 2 participants of the chatroom
// Compare the 1st digit number, and 4th digit number -> if first one is bigger than the second, place the first participant(room creator client)
// Divide the 8 digit numbers with 26/26/26/99 to make a 3 rotor combinations and combinations case control
function buildRecipeFromTwoIds(idA, idB, creatorId) {
  const a = String(idA ?? "0000")
    .padStart(4, "0")
    .slice(0, 4);
  const b = String(idB ?? "0000")
    .padStart(4, "0")
    .slice(0, 4);
  const creator = creatorId
    ? String(creatorId).padStart(4, "0").slice(0, 4)
    : null;

  const a0 = Number(a[0]);
  const a3 = Number(a[3]);
  const b0 = Number(b[0]);
  const b3 = Number(b[3]);

  const frontDiff = Math.abs(a0 - b0);
  const backDiff = Math.abs(a3 - b3);

  let first = a;
  let second = b;

  if (frontDiff > backDiff) {
    if (a0 > b0) {
      first = a;
      second = b;
    } else if (a0 < b0) {
      first = b;
      second = a;
    } else {
      first = a;
      second = b;
    }
  } else if (frontDiff < backDiff) {
    if (a3 > b3) {
      first = a;
      second = b;
    } else if (a3 < b3) {
      first = b;
      second = a;
    } else {
      first = a;
      second = b;
    }
  } else {
    first = a;
    second = b;
  }

  if (first === second) {
    first = a;
    second = b;
  } else {
    const needTieBreak =
      (frontDiff > backDiff && a0 === b0) ||
      (frontDiff < backDiff && a3 === b3) ||
      frontDiff === backDiff;

    if (needTieBreak) {
      if (creator === a && creator !== b) {
        first = a;
        second = b;
      } else if (creator === b && creator !== a) {
        first = b;
        second = a;
      } else {
        if (Number(a) <= Number(b)) {
          first = a;
          second = b;
        } else {
          first = b;
          second = a;
        }
      }
    }
  }

  const raw = `${first}${second}`;

  let out = "";
  for (let i = 0; i < 8; i++) {
    const d = Number(raw[i]);
    if (Number.isNaN(d)) {
      out += "0";
      continue;
    }

    if (i <= 5) {
      const mod = i % 2 === 0 ? 3 : 6;
      out += String(d % mod);
    } else {
      out += String(d);
    }
  }

  return out;
}

// Import the base 8 digit number to compare
// If there's no participant on one seat, replace it with '0000'
function buildRecipeFromCurrentParticipants(presenceRoomObj, creatorId) {
  const ids = Object.keys(presenceRoomObj || {});
  const a = ids.length >= 1 ? ids[0] : "0000";
  const b = ids.length >= 2 ? ids[1] : "0000";
  return buildRecipeFromTwoIds(a, b, creatorId);
}
// After saving the room recipe on the database, lock it to use it as a default setting
async function lockRecipeIfNeeded(roomId, enteringClientId) {
  const roomRef = doc(db, "rooms", roomId);

  await runFsTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() || {};
    if (data.recipesLocked === true && isValidRecipe(data.recipes)) return;

    if (isValidRecipe(data.recipes) && data.recipesLocked !== true) {
      tx.update(roomRef, { recipesLocked: true, recipeFirstId: deleteField() });
      return;
    }

    const firstId = data.recipeFirstId ? String(data.recipeFirstId) : null;
    const me = String(enteringClientId).padStart(4, "0").slice(0, 4);

    if (!firstId) {
      tx.update(roomRef, { recipeFirstId: me });
      return;
    }

    const first = String(firstId).padStart(4, "0").slice(0, 4);
    if (first === me) return;

    const creatorId = data.createdById ? String(data.createdById) : first;
    const recipe = buildRecipeFromTwoIds(first, me, creatorId);

    tx.update(roomRef, {
      recipes: recipe,
      recipesLocked: true,
      recipeFirstId: deleteField(),
    });
  });
}

// Setting the room name at the initial room creating stage
async function setRoomNameOnce(roomId, clientId, newNameRaw) {
  const newName = sanitizeRoomName(newNameRaw);
  if (!newName) throw new Error("Room name cannot be empty");

  const roomRef = doc(db, "rooms", roomId);

  await runFsTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists()) throw new Error("ROOM_NOT_FOUND");

    const data = snap.data() || {};
    if (data.createdById !== clientId) throw new Error("NOT_CREATOR");
    if (data.roomNameLocked === true) throw new Error("NAME_LOCKED");

    tx.update(roomRef, {
      roomName: newName,
      roomNameLocked: true,
    });
  });
}

async function deleteRoomCascade(roomId) {
  const messagesCol = collection(db, "rooms", roomId, "messages");

  while (true) {
    const snap = await getDocs(query(messagesCol, limit(100)));
    if (snap.empty) break;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, "rooms", roomId));
}

// Selecting the room and enter (from example)
async function joinPresence(roomId, clientId, userName) {
  const roomRef = ref(rtdb, `presence/${roomId}`);
  const myRef = ref(rtdb, `presence/${roomId}/${clientId}`);

  const result = await runRtdbTransaction(roomRef, (current) => {
    const obj = current || {};
    const keys = Object.keys(obj);

    if (obj[clientId]) return obj;
    if (keys.length >= MAX_OCCUPANTS) return;

    obj[clientId] = { userName: userName || "", joinedAt: Date.now() };
    return obj;
  });

  if (!result.committed) throw new Error("ROOM_FULL");

  await onDisconnect(myRef).remove();

  await set(myRef, {
    userName: userName || "",
    joinedAt: serverTimestamp(),
  });

  return true;
}
//Clearing the presence when the user leaves the room
async function leavePresence(roomId, clientId) {
  if (!roomId || !clientId) return;
  const myRef = ref(rtdb, `presence/${roomId}/${clientId}`);
  await remove(myRef);
}

const A_CODE = "A".charCodeAt(0);

function isAsciiLetter(ch) {
  const c = ch.charCodeAt(0);
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}
function letterToIdx(ch) {
  const up = ch.toUpperCase();
  return up.charCodeAt(0) - A_CODE;
}
function idxToLetter(idx, isLower) {
  const ch = String.fromCharCode(A_CODE + idx);
  return isLower ? ch.toLowerCase() : ch;
}

const REFLECTOR_B_STR = "YRUHQSLDPXNGOKMIEBFZCWVJAT";
const REFLECTOR_B = Array.from(REFLECTOR_B_STR).map((ch) => letterToIdx(ch));

function parse2(recipe, start) {
  const s = recipe.slice(start, start + 2);
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

//************************************************** */
// [!] Encrypting/Decrypting function
// make arrays to export a encypted letter
// ex. unput 'A' -> translate 'A' as '0' -> Put '0' into PERM_ENC[] (PERM_ENC[0] => 10)
// -> Put '10' into next rotor -> reapeating -> and it export the result letter from it
// + Whenever user add one letter, it increase the rotor number, so change the ecrypting combination every single letter
// Also, when the rotor hit 26(max num), it rototes the next rotor and go back to initial state(0)
const P_A = 0,
  P_B = 1,
  P_C = 2,
  P_D = 3,
  P_E = 4,
  P_F = 5,
  P_G = 6,
  P_H = 7,
  P_I = 8,
  P_J1 = 9,
  P_J2 = 10,
  P_J3 = 11;

const PERM_ENC = [
  [
    10, 6, 15, 22, 16, 1, 3, 20, 14, 11, 9, 18, 17, 2, 12, 5, 0, 4, 13, 7, 24,
    21, 8, 23, 19, 25,
  ],
  [
    6, 11, 3, 18, 1, 22, 25, 19, 0, 2, 23, 16, 8, 4, 10, 9, 5, 13, 20, 24, 15,
    17, 7, 21, 12, 14,
  ],
  [
    9, 25, 0, 8, 19, 15, 13, 22, 16, 1, 3, 20, 14, 11, 10, 6, 18, 17, 2, 12, 5,
    4, 7, 24, 21, 23,
  ],
  [
    4, 7, 13, 10, 14, 21, 12, 8, 24, 25, 9, 18, 17, 2, 1, 0, 5, 20, 23, 19, 15,
    11, 16, 6, 22, 3,
  ],
  [
    13, 18, 25, 0, 8, 19, 15, 6, 22, 17, 2, 12, 5, 4, 7, 24, 21, 23, 9, 10, 1,
    3, 20, 14, 11, 16,
  ],
  [
    8, 3, 5, 24, 21, 17, 2, 11, 16, 7, 23, 13, 20, 4, 25, 9, 10, 1, 12, 18, 14,
    6, 0, 15, 22, 19,
  ],
  [
    4, 11, 5, 9, 25, 0, 8, 19, 15, 6, 7, 22, 17, 2, 12, 10, 1, 3, 20, 14, 13,
    18, 24, 21, 23, 16,
  ],
  [
    2, 12, 6, 4, 11, 5, 9, 25, 0, 8, 19, 15, 13, 22, 16, 1, 3, 20, 14, 10, 7,
    24, 21, 23, 18, 17,
  ],
  [
    11, 16, 7, 12, 6, 4, 25, 0, 8, 19, 15, 13, 22, 17, 2, 5, 9, 24, 21, 23, 18,
    3, 20, 14, 10, 1,
  ],
  [
    4, 1, 6, 16, 19, 25, 12, 23, 14, 9, 0, 5, 21, 8, 15, 20, 11, 10, 2, 24, 3,
    18, 13, 22, 17, 7,
  ],
  [
    10, 18, 17, 2, 12, 11, 23, 6, 14, 22, 16, 1, 25, 9, 5, 0, 4, 13, 7, 24, 15,
    21, 3, 19, 20, 8,
  ],
  [
    9, 3, 5, 18, 15, 11, 6, 20, 23, 17, 19, 10, 22, 7, 21, 16, 4, 13, 12, 24,
    14, 25, 8, 1, 2, 0,
  ],
];

// This is for decrypting.
// Bascily, for decrypting it needs to use inverted array and go backward to see the origianl letter
function invertPerm(p) {
  const inv = Array(26);
  for (let i = 0; i < 26; i++) inv[p[i]] = i;
  return inv;
}
const PERM_INV = PERM_ENC.map(invertPerm);

const X_BLOCK_0_80 = [P_A, P_H, P_D, P_G, P_B, P_F, P_C, P_I, P_E];
const Y_PATTERN_0_80 = [P_B, P_D, P_B, P_A, P_G, P_E, P_C, P_G, P_H];
const Z_PATTERN_0_80 = [P_C, P_E, P_F, P_D, P_F, P_D, P_A, P_B, P_I];

const Y_81_89 = [P_J2, P_J3, P_A, P_H, P_D, P_E, P_F, P_G, P_B];
const Z_81_89 = [P_J3, P_J2, P_I, P_C, P_B, P_H, P_A, P_D, P_E];

const Y_90_98 = [P_J1, P_I, P_J3, P_C, P_E, P_A, P_H, P_F, P_D];
const Z_90_98 = [P_B, P_J1, P_G, P_J3, P_H, P_C, P_E, P_A, P_I];

// Use last 2 digits(0-99) to change the cases
// HARDCODED
function getPermForCase(caseId, axis) {
  const c = caseId % 100;

  if (c <= 80) {
    const block = Math.floor(c / 9);
    const i = c % 9;
    if (axis === 0) return X_BLOCK_0_80[block];
    if (axis === 1) return Y_PATTERN_0_80[i];
    return Z_PATTERN_0_80[i];
  }

  if (c <= 89) {
    const i = c - 81;
    if (axis === 0) return P_J1;
    if (axis === 1) return Y_81_89[i];
    return Z_81_89[i];
  }

  if (c <= 98) {
    const i = c - 90;
    if (axis === 0) return P_J2;
    if (axis === 1) return Y_90_98[i];
    return Z_90_98[i];
  }

  if (axis === 0) return P_J3;
  if (axis === 1) return P_J1;
  return P_J2;
}

// Importing the variables in the machine(Enigima Machine)
function machineFromRecipe(recipe) {
  const r = String(recipe || RECIPE_DEFAULT)
    .padStart(8, "0")
    .slice(0, 8);

  const start1 = parse2(r, 0) % 26;
  const start2 = parse2(r, 2) % 26;
  const start3 = parse2(r, 4) % 26;

  const setIndex = parse2(r, 6) % 100;

  const pid1 = getPermForCase(setIndex, 0);
  const pid2 = getPermForCase(setIndex, 1);
  const pid3 = getPermForCase(setIndex, 2);

  const rotor1 = PERM_ENC[pid1];
  const rotor2 = PERM_ENC[pid2];
  const rotor3 = PERM_ENC[pid3];

  const inv1 = PERM_INV[pid1];
  const inv2 = PERM_INV[pid2];
  const inv3 = PERM_INV[pid3];

  return {
    setIndex,
    rotorF: [rotor1, rotor2, rotor3],
    rotorR: [inv1, inv2, inv3],
    reflector: REFLECTOR_B,
    startPos: [start1, start2, start3],
  };
}

// Pushing rotor number when it hits the max
function stepOdometer(pos) {
  let [p1, p2, p3] = pos;
  p1 = (p1 + 1) % 26;
  if (p1 === 0) {
    p2 = (p2 + 1) % 26;
    if (p2 === 0) {
      p3 = (p3 + 1) % 26;
    }
  }
  return [p1, p2, p3];
}

function advanceOdometerFast(startPos, n) {
  let [p1, p2, p3] = startPos;
  const total1 = p1 + n;
  const newP1 = ((total1 % 26) + 26) % 26;
  const carry1 = Math.floor(total1 / 26);

  const total2 = p2 + carry1;
  const newP2 = ((total2 % 26) + 26) % 26;
  const carry2 = Math.floor(total2 / 26);

  const newP3 = (((p3 + carry2) % 26) + 26) % 26;

  return [newP1, newP2, newP3];
}

function rotorForward(idx, wiring, pos) {
  const x = (idx + pos) % 26;
  const y = wiring[x];
  return (y - pos + 26) % 26;
}

function rotorBackward(idx, invWiring, pos) {
  const x = (idx + pos) % 26;
  const y = invWiring[x];
  return (y - pos + 26) % 26;
}

function enigmaTransformLetter(idx, machine, pos) {
  const [p1, p2, p3] = pos;
  const [r1, r2, r3] = machine.rotorF;
  const [i1, i2, i3] = machine.rotorR;

  let x = idx;
  x = rotorForward(x, r1, p1);
  x = rotorForward(x, r2, p2);
  x = rotorForward(x, r3, p3);

  x = machine.reflector[x];

  x = rotorBackward(x, i3, p3);
  x = rotorBackward(x, i2, p2);
  x = rotorBackward(x, i1, p1);

  return x;
}

function transformCharAndStep(ch, machine, pos) {
  let outCh = ch;

  if (ch && isAsciiLetter(ch)) {
    const isLower = ch >= "a" && ch <= "z";
    const idx = letterToIdx(ch);
    const nextIdx = enigmaTransformLetter(idx, machine, pos);
    outCh = idxToLetter(nextIdx, isLower);
  }

  const nextPos = stepOdometer(pos);
  return { outCh, nextPos };
}

// Use the encrypting recipe
function encryptWithHistory(plain, fixedRecipe, historyMessages) {
  if (!isValidRecipe(fixedRecipe)) return plain;

  const machine = machineFromRecipe(fixedRecipe);

  const totalChars = (historyMessages || []).reduce((sum, m) => {
    const t = m?.cipherText ?? m?.text ?? "";
    return sum + String(t).length;
  }, 0);

  let pos = advanceOdometerFast(machine.startPos, totalChars);

  let out = "";
  for (const ch of String(plain)) {
    const r = transformCharAndStep(ch, machine, pos);
    out += r.outCh;
    pos = r.nextPos;
  }
  return out;
}
// Use React 'useEffect' and re-rendering to use the decrypted result
function decryptReplayAll(messages, recipeForView) {
  const machine = machineFromRecipe(recipeForView);
  let pos = machine.startPos;

  const out = [];
  for (const m of messages || []) {
    const cipher = String(m.cipherText ?? "");
    let plain = "";
    for (const ch of cipher) {
      const r = transformCharAndStep(ch, machine, pos);
      plain += r.outCh;
      pos = r.nextPos;
    }
    out.push({ ...m, plainText: plain });
  }
  return out;
}
//*************************************************************** */
//*************************************************************** */
// HTML parts
export function App() {
  const [clientId, setClientId] = useState("");
  const [userName, setUserNameState] = useState("");
  const [createdAtMs, setCreatedAtMs] = useState(null);

  const [nickInput, setNickInput] = useState("");
  const [savingNick, setSavingNick] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const [clientMap, setClientMap] = useState({});

  const [presenceAll, setPresenceAll] = useState({});
  const [presenceRoom, setPresenceRoom] = useState({});

  const [creatingRoom, setCreatingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);

  const [namingOpen, setNamingOpen] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [savingRoomName, setSavingRoomName] = useState(false);

  const [sendError, setSendError] = useState("");
  const warnTimerRef = useRef(null);

  const currentRoomRef = useRef(null);
  const messagesEndRef = useRef(null);

  const needsNickname = !!clientId && !userName;

  useEffect(() => {
    if (!sendError) return;
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    warnTimerRef.current = setTimeout(() => setSendError(""), 3500);
    return () => {
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    };
  }, [sendError]);

  // Clean up history (still the old variable setting remains)
  useEffect(() => {
    const FLAG = "rooms_schema_cleanup_v2_done";
    if (localStorage.getItem(FLAG) === "1") return;

    (async () => {
      const snap = await getDocs(collection(db, "rooms"));
      if (snap.empty) {
        localStorage.setItem(FLAG, "1");
        return;
      }

      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.update(d.ref, {
          createdByName: deleteField(),
          description: deleteField(),
          recipeOwners: deleteField(),
          recipesLockedAt: deleteField(),
          roomNamedAtMs: deleteField(),
          recipeFirstId: deleteField(),
        });
      });

      await batch.commit();
      localStorage.setItem(FLAG, "1");
    })().catch((e) => console.error("rooms cleanup failed:", e));
  }, []);

  // Client Client!
  useEffect(() => {
    (async () => {
      const c = await initClientIdentity();
      setClientId(c.id);
      setUserNameState(c.userName || "");
      setNickInput(c.userName || "");
    })().catch((e) => {
      console.error(e);
      alert(e?.message || "Failed to initialize client");
    });
  }, []);

  // From example
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      const map = {};
      let myCreated = null;

      snap.docs.forEach((d) => {
        const data = d.data() || {};
        const id = data.id ?? d.id;
        const name = data.userName ?? "";
        if (id && name) map[id] = name;

        if (id === clientId) {
          myCreated =
            typeof data.createdAtMs === "number"
              ? data.createdAtMs
              : data.createdAt?.toMillis?.() ?? null;
        }
      });

      setClientMap(map);
      setCreatedAtMs(myCreated);
    });

    return () => unsub();
  }, [clientId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rooms"), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          roomName: data.roomName ?? d.id,
          createdAt: toDateFromMs(data.createdAt),
          maxOccupants: data.maxOccupants ?? MAX_OCCUPANTS,
          createdById: data.createdById ?? null,
          recipes: data.recipes ?? RECIPE_DEFAULT,
          recipesLocked: data.recipesLocked === true,
          roomNameLocked: data.roomNameLocked === true,
        };
      });

      list.sort((a, b) => a.id.localeCompare(b.id));
      setRooms(list);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const rootRef = ref(rtdb, "presence");
    const unsub = onValue(rootRef, (snap) => {
      setPresenceAll(snap.val() || {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedRoom) {
      setPresenceRoom({});
      return;
    }
    const roomRef = ref(rtdb, `presence/${selectedRoom}`);
    const unsub = onValue(roomRef, (snap) => {
      setPresenceRoom(snap.val() || {});
    });
    return () => unsub();
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "rooms", selectedRoom, "messages"),
      orderBy("sentAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          senderId: data.senderId ?? "????",
          sentAt: typeof data.sentAt === "number" ? data.sentAt : Date.now(),
          cipherText: data.text ?? "",
          senderName: data.senderName ?? null,
        };
      });
      setMessages(list);
    });

    return () => unsub();
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, selectedRoom]);

  useEffect(() => {
    if (!clientId) return;

    const doLeave = () => {
      if (currentRoomRef.current) {
        leavePresence(currentRoomRef.current, clientId);
      }
    };

    const onBeforeUnload = () => doLeave();
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      doLeave();
    };
  }, [clientId]);

  // First tyiem sueing useMemo
  // Figured out it uses for optimization
  const selectedRoomObj = useMemo(
    () => rooms.find((r) => r.id === selectedRoom) || null,
    [rooms, selectedRoom]
  );

  const occInSelectedRoom = useMemo(
    () => Object.keys(presenceRoom || {}).length,
    [presenceRoom]
  );

  const fixedRecipe = useMemo(() => {
    const r = selectedRoomObj?.recipes;
    return isValidRecipe(r) ? r : null;
  }, [selectedRoomObj]);

  const viewRecipe = useMemo(() => {
    const creatorId = selectedRoomObj?.createdById ?? null;
    return buildRecipeFromCurrentParticipants(presenceRoom, creatorId);
  }, [presenceRoom, selectedRoomObj]);

  const renderedMessages = useMemo(() => {
    if (!selectedRoomObj) return [];
    return decryptReplayAll(messages, viewRecipe);
  }, [messages, viewRecipe, selectedRoomObj]);

  const canSend =
    !!selectedRoomObj &&
    !needsNickname &&
    selectedRoomObj.recipesLocked === true &&
    isValidRecipe(selectedRoomObj.recipes) &&
    occInSelectedRoom === 2;

    // Setting up User name
    // Use try catch to prevent kick back
  async function saveNickname() {
    try {
      setSavingNick(true);
      const updated = await setClientUserName(clientId, nickInput);
      setUserNameState(updated.userName);
    } catch (e) {
      alert(e?.message || "Failed to save nickname");
    } finally {
      setSavingNick(false);
    }
  }
// Room control functions --------------------------
  async function handleSelectRoom(roomId) {
    if (!clientId) return;
    if (needsNickname) {
      alert("Please set your nickname first.");
      return;
    }
    if (selectedRoom === roomId) return;

    try {
      await joinPresence(roomId, clientId, userName);
      await lockRecipeIfNeeded(roomId, clientId);

      if (currentRoomRef.current) {
        await leavePresence(currentRoomRef.current, clientId);
      }

      currentRoomRef.current = roomId;
      setSelectedRoom(roomId);
    } catch (e) {
      if (e?.message === "ROOM_FULL") {
        alert("This room is full (2 people already).");
        return;
      }
      console.error(e);
      alert(e?.message || "Failed to enter room");
    }
  }

  async function handleLeaveRoom() {
    if (!clientId || !selectedRoom) return;

    setLeavingRoom(true);
    try {
      await leavePresence(selectedRoom, clientId);
    } finally {
      currentRoomRef.current = null;
      setSelectedRoom(null);
      setMessages([]);
      setLeavingRoom(false);
    }
  }

  async function handleCreateRoom() {
    if (!clientId) return;
    if (needsNickname) {
      alert("Please set your nickname first.");
      return;
    }
    if (creatingRoom) return;

    setCreatingRoom(true);
    try {
      const roomId = makeRoomId();
      const nextNumber = rooms.length + 1;
      const fallbackName = makeRoomNameFallback(nextNumber);

      await setDoc(doc(db, "rooms", roomId), {
        createdAt: Date.now(),
        createdById: clientId,
        maxOccupants: 2,
        recipes: RECIPE_DEFAULT,
        recipesLocked: false,
        roomName: fallbackName,
        roomNameLocked: false,
      });

      await joinPresence(roomId, clientId, userName);
      await lockRecipeIfNeeded(roomId, clientId);

      if (currentRoomRef.current) {
        await leavePresence(currentRoomRef.current, clientId);
      }

      currentRoomRef.current = roomId;
      setSelectedRoom(roomId);

      setRoomNameInput("");
      setNamingOpen(true);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to create room");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function handleDeleteRoom() {
    if (!clientId) return;
    if (!selectedRoomObj) return;
    if (selectedRoomObj.createdById !== clientId) return;

    const ok = window.confirm(
      "Delete the chatroom? (Messages will also be deleted)"
    );
    if (!ok) return;

    setDeletingRoom(true);
    try {
      await leavePresence(selectedRoomObj.id, clientId);
      await deleteRoomCascade(selectedRoomObj.id);

      currentRoomRef.current = null;
      setSelectedRoom(null);
      setMessages([]);
      setNamingOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to delete room");
    } finally {
      setDeletingRoom(false);
    }
  }

  async function handleSaveRoomName() {
    if (!clientId || !selectedRoomObj) return;
    if (selectedRoomObj.createdById !== clientId) return;
    if (selectedRoomObj.roomNameLocked) return;

    const nextName = sanitizeRoomName(roomNameInput);
    if (!nextName) {
      alert("Please enter a room name.");
      return;
    }

    setSavingRoomName(true);
    try {
      await setRoomNameOnce(selectedRoomObj.id, clientId, nextName);
      setNamingOpen(false);
      setRoomNameInput("");
    } catch (e) {
      if (e?.message === "NAME_LOCKED") {
        alert("Room name is already locked. You can set it only once.");
      } else if (e?.message === "NOT_CREATOR") {
        alert("Only the room creator can name this room.");
      } else {
        alert(e?.message || "Failed to set room name");
      }
    } finally {
      setSavingRoomName(false);
    }
  }

  // --------------------------------------------------------------------------------
  const createdDateStr = useMemo(() => {
    if (!createdAtMs) return "—";
    try {
      return new Date(createdAtMs).toLocaleString();
    } catch {
      return "—";
    }
  }, [createdAtMs]);

  return (
    <>
    {/* Overlay parts, for setting up useranem, room name */}
      {needsNickname && (
        <div className="overlay">
          <div className="modal">
            <h3>Set your nickname</h3>

            <input
              className="input"
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              placeholder="Under 20 chars"
            />

            <div className="modalRow">
              <button
                className="btn"
                onClick={saveNickname}
                disabled={savingNick || !nickInput.trim()}
              >
                {savingNick ? "Saving..." : "Save"}
              </button>

              {/* <button
                className="btn"
                onClick={() => {
                  resetClientIdentity();
                  location.reload();
                }}
              >
                Reset ID
              </button> */}
            </div>
          </div>
        </div>
      )}

      {namingOpen &&
        selectedRoomObj &&
        selectedRoomObj.createdById === clientId &&
        !selectedRoomObj.roomNameLocked && (
          <div className="overlay overlaySecondary">
            <div className="modal modalWide">
              <h3>Set Room Name (one-time)</h3>

              <input
                className="input"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder="Under 30 chars"
              />

              <div className="modalRow">
                <button
                  className="btn"
                  type="button"
                  onClick={handleSaveRoomName}
                  disabled={savingRoomName || !sanitizeRoomName(roomNameInput)}
                >
                  {savingRoomName ? "Saving..." : "Save"}
                </button>
                {/* <button
                  className="btn"
                  type="button"
                  onClick={() => setNamingOpen(false)}
                >
                  Later
                </button> */}
              </div>
            </div>
          </div>
        )}

      {/* Structure, cover with 'totalDiv'
      -> Left and Right Div
      */}
      <div className="totalDiv">
        <div className="leftDiv">
          <div className="leftHeader">
            <div className="leftHeaderTitles">
              <div className="leftHeaderTitle">Enigma Chat</div>
            </div>

            {/* <button
              type="button"
              className="iconBtn"
              onClick={handleCreateRoom}
              disabled={creatingRoom || needsNickname}
              title="Create a new room"
            >
              {creatingRoom ? "…" : "+"}
            </button> */}
          </div>

          <div className="roomsList">
            {rooms.map((room) => {
              const occ = presenceAll?.[room.id]
                ? Object.keys(presenceAll[room.id]).length
                : 0;
              const max = room.maxOccupants ?? MAX_OCCUPANTS;
              const isFull = occ >= max;

              return (
                <button
                  type="button"
                  className={`roomCard${
                    selectedRoom === room.id ? " active" : ""
                  }`}
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  title={`${occ}/${max}`}
                >
                  <div className="roomTopRow">
                    <div className="roomTitle roomTitleFlex">
                      {room.roomName}
                    </div>
                    <span className={`badge${isFull ? " full" : ""}`}>
                      {occ}/{max}
                    </span>
                  </div>

                  <div className="roomDate">
                    {room.createdAt.toLocaleString()}
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              className="iconBtn"
              onClick={handleCreateRoom}
              disabled={creatingRoom || needsNickname}
              title="Create a new room"
            >
              {creatingRoom ? "…" : "+"}
            </button>
          </div>
        </div>

        <div className="rightDiv">
          <div className="chatHeader">
            <div className="headerTitle">
              {selectedRoomObj ? selectedRoomObj.roomName : "No room selected"}
            </div>

            <div className="headerActions">
              <button
                className="btn"
                type="button"
                onClick={handleLeaveRoom}
                disabled={!selectedRoomObj || leavingRoom}
                title="Leave this room"
              >
                {leavingRoom ? "Leaving…" : "Leave"}
              </button>

              {selectedRoomObj &&
                selectedRoomObj.createdById === clientId &&
                !selectedRoomObj.roomNameLocked && (
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      setRoomNameInput("");
                      setNamingOpen(true);
                    }}
                    title="Set room name (one-time)"
                  >
                    Set Name
                  </button>
                )}

              {selectedRoomObj && selectedRoomObj.createdById === clientId && (
                <button
                  className="btn btnDanger"
                  type="button"
                  onClick={handleDeleteRoom}
                  disabled={deletingRoom}
                  title="Delete this room (creator only)"
                >
                  {deletingRoom ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
          </div>

          <div className="chatBody">
            {!selectedRoomObj ? (
              <div className="placeholder">
                <p>
                  <strong>[Select a room to start the chat]</strong>
                </p>
                <p>Messages are automatically encrypted when sent</p>
                <p>
                  It can be decrypted correctly only when the two original users
                  are in the chat
                </p>
                <p>
                  Decryption is not guaranteed for anyone else or less than two
                  users
                </p>
              </div>
            ) : (
              <div className="messagesScroll">
                {renderedMessages.map((m) => {
                  return (
                    <Message
                      key={m.id}
                      senderLabel={
                        m.senderName || clientMap[m.senderId] || m.senderId
                      }
                      timeMs={m.sentAt}
                      content={m.plainText}
                      isLocal={clientId === m.senderId}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="bottomBar">
            <div className="panel infoPanel">
              <div className="infoTitle">Client Info</div>

              <div className="infoRow">
                <div className="infoKey">Name:</div>
                <div className="infoVal" title={userName || "—"}>
                  {userName || "—"}
                </div>
              </div>

              <div className="infoRow">
                <div className="infoKey">Created Date:</div>
                <div className="infoVal" title={createdDateStr}>
                  {createdDateStr}
                </div>
              </div>

              <div className="divider" />

              <button
                className="btn"
                type="button"
                onClick={() => {
                  resetClientIdentity();
                  location.reload();
                }}
                title="Reset local identity"
              >
                <p>Get new ID</p>
                <p>(** Won't be able to decrypt previous messages **)</p>
              </button>
            </div>

            <div className="panel composer">
              <div>
                <div className="infoTitle">Message</div>
                <div className="infoRow infoRowLeft">
                  <span>[Eng support only]</span>
                </div>
              </div>

              {sendError && <div className="warn">{sendError}</div>}

              {selectedRoomObj && !canSend && (
                <div className="warnSoft">
                  {occInSelectedRoom !== 2
                    ? "Need other user to start chat."
                    : "Initialize enigma..."}
                </div>
              )}

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!clientId || !selectedRoom) return;
                  if (needsNickname) return;
                  if (!canSend) return;

                  const plain = currentMessage.trim();
                  if (!plain) return;

                  const v = validateEnglishOnly(plain);
                  if (!v.ok) {
                    setSendError(
                      `English only. Non-English character detected: "${v.badChar}"`
                    );
                    return;
                  }

                  const cipher = encryptWithHistory(
                    plain,
                    fixedRecipe,
                    messages
                  );

                  setCurrentMessage("");

                  try {
                    await addDoc(
                      collection(db, "rooms", selectedRoom, "messages"),
                      {
                        senderId: clientId,
                        senderName: userName,
                        sentAt: Date.now(),
                        text: cipher,
                      }
                    );
                  } catch (e) {
                    console.error("send failed:", e);
                    setSendError(e?.message || "Failed to send message");
                  }
                }}
              >
                <div className="composerBox">
                  <input
                    className="input"
                    name="message"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    disabled={!selectedRoomObj || needsNickname || !canSend}
                    placeholder={
                      !selectedRoomObj
                        ? "Select a room first..."
                        : !canSend
                        ? "Need 2 clients (and locked recipe) to send..."
                        : "Type your message..."
                    }
                  />
                  <button
                    className="sendBtn"
                    type="submit"
                    disabled={!selectedRoomObj || needsNickname || !canSend}
                    title="Send"
                  >
                    Send
                  </button>
                </div>

                {/* <div className="composerHint">
                  Warning auto-clears in a few seconds.
                </div> */}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Chat message rendering
function Message({ senderLabel, timeMs, isLocal, content }) {
  const d = new Date(timeMs);
  return (
    <div className={`message${isLocal ? " local" : ""}`}>
      <div className="messageInfos">
        <div className="sender">{senderLabel}</div>
        <div className="time">- {d.toLocaleString()}</div>
      </div>
      <div className="divider" />
      <p>{content}</p>
    </div>
  );
}
