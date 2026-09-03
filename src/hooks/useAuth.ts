import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next);
    setStatus(next ? "signedIn" : "signedOut");
  }), []);

  const login = useCallback((email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => undefined), []);

  return { user, status, login };
}
