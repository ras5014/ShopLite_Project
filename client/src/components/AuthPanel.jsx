import { useState } from "react";
import { apiRequest } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AuthPanel({ mode, onModeChange, onSuccess }) {
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: { ...(isRegister ? { name } : {}), email, password },
      });
      setSession(data);
      setPassword("");
      onSuccess(isRegister ? "Account created. You are signed in." : "Welcome back. You are signed in.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-panel panel">
      <p className="eyebrow">YOUR SHOPLITE ACCOUNT</p>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{isRegister ? "Create an account to save your orders." : "Log in to place an order and view your history."}</p>

      <form className="stack-form" onSubmit={handleSubmit}>
        {isRegister && (
          <label>
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} name="name" autoComplete="name" maxLength={80} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} name="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} required />
          {isRegister && <span className="field-help">Use at least 8 characters.</span>}
        </label>

        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="form-switch">
        {isRegister ? "Already have an account?" : "New to ShopLite?"}{" "}
        <button className="text-button" type="button" onClick={() => { setError(""); onModeChange(isRegister ? "login" : "register"); }}>
          {isRegister ? "Log in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}
