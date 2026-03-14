// src/lib/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { auth, db, recordLoginEvent } from "./firebase";

const AuthContext = createContext(null);

async function readWithRetry(docRef, maxAttempts = 5, delayMs = 600) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await getDoc(docRef);
    } catch (err) {
      console.warn(`Read attempt ${attempt}/${maxAttempts} failed:`, err.message);
      if (attempt === maxAttempts) throw err;
      await new Promise((res) => setTimeout(res, delayMs * attempt));
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [whitelistData, setWhitelistData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setWhitelistData(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const whitelistSnap = await readWithRetry(
          doc(db, "whitelist", firebaseUser.email)
        );
        const wlData = whitelistSnap.exists() ? whitelistSnap.data() : null;
        setWhitelistData(wlData);

        if (!wlData || wlData.approved !== true) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile({
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL:    firebaseUser.photoURL,
          role:        wlData.role    || "student",
          program:     wlData.program || null,
          blocked:     false,
        });

      } catch (err) {
        console.warn("Auth read error:", err.message);
        setProfile({
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL:    firebaseUser.photoURL,
          role:        "student",
          program:     null,
          blocked:     false,
        });
      }

      setLoading(false);

      // Record login event in background — deduplicated to once per 5 minutes
      setTimeout(() => {
        recordLoginEvent(firebaseUser.uid);
      }, 1000);
    });

    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await readWithRetry(doc(db, "whitelist", user.email));
      const wlData = snap.exists() ? snap.data() : null;
      setWhitelistData(wlData);
      setProfile((prev) => prev ? {
        ...prev,
        role:    wlData?.role    || prev.role,
        program: wlData?.program || prev.program,
      } : null);
    } catch (err) {
      console.warn("refreshProfile error:", err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, whitelistData, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
