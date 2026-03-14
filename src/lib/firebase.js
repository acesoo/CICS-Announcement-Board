// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: "neu.edu.ph", prompt: "select_account" });

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  console.log("✅ Signed in as:", user.email);

  if (!user.email.endsWith("@neu.edu.ph")) {
    await signOut(auth);
    throw new Error("ACCESS_DENIED");
  }

  // Check whitelist — READ ONLY
  const whitelistRef = doc(db, "whitelist", user.email);
  const whitelistSnap = await getDoc(whitelistRef);

  if (whitelistSnap.exists()) {
    const data = whitelistSnap.data();
    console.log("📄 Whitelist data:", data);
    if (data.approved !== true) {
      await signOut(auth);
      throw new Error("NOT_WHITELISTED");
    }
    return { user, whitelistData: data };
  }

  // Not in whitelist at all
  await signOut(auth);
  throw new Error("NOT_REGISTERED");
}

export async function logOut() {
  await signOut(auth);
}

// ─── LOGIN EVENT (deduplicated) ───────────────────────────────────────────────

/**
 * Records a login event only if one hasn't been recorded in the last 5 minutes
 * for this user. Prevents duplicate entries from AuthContext re-renders.
 */
export async function recordLoginEvent(uid) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSnap = await getDocs(
      query(
        collection(db, "loginEvents"),
        where("uid", "==", uid),
        where("timestamp", ">=", Timestamp.fromDate(fiveMinutesAgo)),
        orderBy("timestamp", "desc")
      )
    );
    if (!recentSnap.empty) {
      console.log("Login already recorded recently, skipping duplicate.");
      return;
    }
    await addDoc(collection(db, "loginEvents"), {
      uid,
      timestamp: serverTimestamp(),
    });
    console.log("✅ Login event recorded.");
  } catch (err) {
    console.warn("recordLoginEvent non-fatal:", err.message);
  }
}

// ─── WHITELIST ────────────────────────────────────────────────────────────────

export async function getWhitelistEntry(email) {
  const snap = await getDoc(doc(db, "whitelist", email));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllWhitelistEntries() {
  const snap = await getDocs(query(collection(db, "whitelist"), orderBy("addedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addToWhitelist(email, role = "student", program = null) {
  await setDoc(doc(db, "whitelist", email), {
    email, role, approved: true,
    program:  role === "admin" ? null : program,
    pending:  role === "student" && !program,
    addedAt:  serverTimestamp(),
  });
}

export async function updateWhitelistRole(email, role) {
  await updateDoc(doc(db, "whitelist", email), { role });
}

export async function setWhitelistApproved(email, approved) {
  await updateDoc(doc(db, "whitelist", email), { approved });
}

export async function removeFromWhitelist(email) {
  await deleteDoc(doc(db, "whitelist", email));
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function upsertUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setUserBlocked(uid, blocked, reason = "") {
  await updateDoc(doc(db, "users", uid), {
    blocked,
    blockReason: blocked ? reason : "",
    blockedAt:   blocked ? serverTimestamp() : null,
  });
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export async function getDocuments({ program, category, year } = {}) {
  const constraints = [orderBy("createdAt", "desc")];
  if (program && program !== "All") constraints.push(where("programs", "array-contains", program));
  if (category) constraints.push(where("category", "==", category));
  if (year)     constraints.push(where("year", "==", year));
  const snap = await getDocs(query(collection(db, "documents"), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function recordDownload(docId, uid) {
  try {
    await addDoc(collection(db, "downloadEvents"), {
      docId,
      uid,
      timestamp: serverTimestamp(),
    });
    // Also increment counter on the document
    await updateDoc(doc(db, "documents", docId), { downloads: increment(1) });
  } catch (err) {
    console.warn("recordDownload non-fatal:", err.message);
  }
}

export async function recordView(docId, uid) {
  try {
    await addDoc(collection(db, "viewEvents"), {
      docId,
      uid,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("recordView non-fatal:", err.message);
  }
}

export async function getTopDocuments(limit = 5) {
  const snap = await getDocs(query(collection(db, "documents"), orderBy("downloads", "desc")));
  return snap.docs.slice(0, limit).map((d) => ({ id: d.id, ...d.data() }));
}

export async function toggleDocumentVisibility(docId, hidden) {
  await updateDoc(doc(db, "documents", docId), { hidden });
}

export async function deleteDocument(docId) {
  await deleteDoc(doc(db, "documents", docId));
}
