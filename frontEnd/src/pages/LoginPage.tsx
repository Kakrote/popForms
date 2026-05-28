import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { LoginFormValues } from "../types";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginPage() {
  const { token, user, setSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data);
      if (data.user.role === "ADMIN") {
        navigate(from && from !== "/login" ? from : "/admin", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    },
  });

  useEffect(() => {
    if (token && user) {
      navigate(user.role === "ADMIN" ? "/admin" : "/app", { replace: true });
    }
  }, [navigate, token, user]);

  if (token && user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/app"} replace />;
  }

  return (
    <div className="center-page">
      <form className="auth-card stack" onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}>
        <div>
          <p className="eyebrow">PopForms</p>
          <h1>Sign in</h1>
          <p className="muted">Use an admin or user account to access the demo flow.</p>
        </div>

        <div className="stack">
          <label className="stack small">
            Email
            <input type="email" {...form.register("email")} placeholder="admin@example.com" />
            {form.formState.errors.email ? <span className="error">{form.formState.errors.email.message}</span> : null}
          </label>

          <label className="stack small">
            Password
            <input type="password" {...form.register("password")} placeholder="••••••••" />
            {form.formState.errors.password ? <span className="error">{form.formState.errors.password.message}</span> : null}
          </label>
        </div>

        {loginMutation.isError ? (
          <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>
            {(loginMutation.error as Error).message}
          </div>
        ) : null}

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
