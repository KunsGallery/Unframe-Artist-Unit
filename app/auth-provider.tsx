"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser && db) {
        const userRef = doc(db, "users", nextUser.uid);
        void runTransaction(db, async (transaction) => {
          const existing = await transaction.get(userRef);
          if (!existing.exists()) {
            transaction.set(userRef, {
              email: nextUser.email ?? "",
              displayName: nextUser.displayName ?? "",
              accessStatus: "open",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else if (existing.data().email !== (nextUser.email ?? "") || !existing.data().displayName) {
            transaction.update(userRef, {
              email: nextUser.email ?? "",
              displayName: existing.data().displayName || nextUser.displayName || "",
              updatedAt: serverTimestamp(),
            });
          }
        }).catch(() => undefined);
      }
    });
  }, []);

  async function logout() {
    if (auth) await signOut(auth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
