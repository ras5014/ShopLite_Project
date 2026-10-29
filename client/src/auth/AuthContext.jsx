import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "shoplite_session";

function readStoredSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.token && stored?.user) {
      return stored;
    }
  } catch (error) {
    console.warn("Could not read the saved session. Starting signed out.", error);
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  // Stage 3: share the same signed-in session with every component.
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

  const value = {
    token: session.token,
    user: session.user,
    setSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
