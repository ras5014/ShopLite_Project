import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "shoplite_session";

function readStoredSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.token && stored?.user) return stored;
  } catch {
    // If local storage is empty or malformed, begin signed out.
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(readStoredSession);

  function setSession(nextSession) {
    const safeSession = { token: nextSession.token, user: nextSession.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSession));
    setSessionState(safeSession);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSessionState({ token: null, user: null });
  }

  const value = useMemo(
    () => ({ ...session, setSession, logout }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
