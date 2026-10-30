import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AuthPanel({ mode, onModeChange, onSuccess }) {
  const { setSession } = useAuth();
  const isRegister = mode === "register";
  const {
    register, handleSubmit, resetField, clearErrors, setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", email: "", password: "" },
    shouldUnregister: true,
  });
  const authMutation = useMutation({
    mutationFn: ({ path, body }) => apiRequest(path, { method: "POST", body }),
  });
  const submitting = isSubmitting || authMutation.isPending;

  let buttonLabel = "Log in";
  if (isRegister) {
    buttonLabel = "Create account";
  }
  if (submitting) {
    buttonLabel = "Please wait…";
  }

  function switchMode() {
    clearErrors();
    authMutation.reset();
    if (isRegister) {
      onModeChange("login");
    } else {
      onModeChange("register");
    }
  }

  async function submitForm(values) {
    clearErrors("root.server");
    let path = "/api/auth/login";
    let message = "Welcome back. You are signed in.";
    const body = { email: values.email, password: values.password };
    if (isRegister) {
      path = "/api/auth/register";
      message = "Account created. You are signed in.";
      body.name = values.name;
    }

    try {
      const data = await authMutation.mutateAsync({ path, body });
      setSession(data);
      resetField("password");
      onSuccess(message);
    } catch (error) {
      setError("root.server", { message: error.message });
    }
  }

  return (
    <section className="auth-panel panel">
      <p className="eyebrow">YOUR SHOPLITE ACCOUNT</p>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{isRegister ? "Create an account to save your orders." : "Log in to place an order and view your history."}</p>

      <form className="stack-form" onSubmit={handleSubmit(submitForm)} noValidate>
        {isRegister && (
          <div>
            <label htmlFor="auth-name">Full name</label>
            <input
              id="auth-name"
              autoComplete="name"
              maxLength={80}
              disabled={authMutation.isPending}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name", {
                required: "Name is required.",
                validate: (value) => Boolean(value.trim()) || "Name is required.",
                maxLength: { value: 80, message: "Name must be 80 characters or fewer." },
              })}
            />
            {errors.name && <p id="name-error" className="field-help danger-text" role="alert">{errors.name.message}</p>}
          </div>
        )}
        <div>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            disabled={authMutation.isPending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              required: "Email is required.",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "A valid email is required." },
            })}
          />
          {errors.email && <p id="email-error" className="field-help danger-text" role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            disabled={authMutation.isPending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : isRegister ? "password-help" : undefined}
            {...register("password", {
              required: "Password is required.",
              minLength: { value: 8, message: "Password must be at least 8 characters." },
            })}
          />
          {isRegister && <span id="password-help" className="field-help">Use at least 8 characters.</span>}
          {errors.password && <p id="password-error" className="field-help danger-text" role="alert">{errors.password.message}</p>}
        </div>

        {errors.root?.server && <p className="alert alert-error" role="alert">{errors.root.server.message}</p>}
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>
          {buttonLabel}
        </button>
      </form>

      <p className="form-switch">
        {isRegister ? "Already have an account?" : "New to ShopLite?"}{" "}
        <button className="text-button" type="button" onClick={switchMode} disabled={submitting}>
          {isRegister ? "Log in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}
