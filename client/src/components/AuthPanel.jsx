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
  let buttonLabel = "Log in";
  if (isRegister) {
    buttonLabel = "Create account";
  }
  if (submitting) {
    buttonLabel = "Please wait…";
  }

  function switchMode() {
    setError("");
    if (isRegister) {
      onModeChange("login");
    } else {
      onModeChange("register");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    let path = "/api/auth/login";
    let message = "Welcome back. You are signed in.";
    const body = { email, password };
    if (isRegister) {
      path = "/api/auth/register";
      message = "Account created. You are signed in.";
      body.name = name;
    }

    try {
      const data = await apiRequest(path, {
        method: "POST",
        body,
      });
      setSession(data);
      setPassword("");
      onSuccess(message);
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
          {buttonLabel}
        </button>
      </form>

      <p className="form-switch">
        {isRegister ? "Already have an account?" : "New to ShopLite?"}{" "}
        <button className="text-button" type="button" onClick={switchMode}>
          {isRegister ? "Log in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}
