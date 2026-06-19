import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { LoginFormValues } from "../types";
import { FileText, Key, Mail, AlertTriangle } from "lucide-react";

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
      const target = from && from !== "/login" ? from : data.user.role === "ADMIN" ? "/admin" : "/app";
      navigate(target, { replace: true });
    },
  });

  useEffect(() => {
    if (token && user) {
      const target = from && from !== "/login" ? from : user.role === "ADMIN" ? "/admin" : "/app";
      navigate(target, { replace: true });
    }
  }, [navigate, token, user, from]);

  if (token && user) {
    const target = from && from !== "/login" ? from : user.role === "ADMIN" ? "/admin" : "/app";
    return <Navigate to={target} replace />;
  }

  return (
    <div className="center-page">
      <form 
        id="login-form"
        className="auth-card stack" 
        onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), var(--shadow-glowing)",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15, 22, 40, 0.8)",
          borderRadius: "24px"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "var(--accent-gradient)",
            marginBottom: 16,
            boxShadow: "0 8px 20px rgba(99, 102, 241, 0.4)"
          }}>
            <FileText size={28} color="#fff" />
          </div>
          <p className="eyebrow" style={{ fontSize: "0.85rem", letterSpacing: "0.15em" }}>PopForms Portal</p>
          <h1 style={{ margin: "4px 0 8px 0" }}>Sign In</h1>
          <p className="muted small">Use your corporate account credentials to access your dashboard.</p>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Mail size={14} className="muted" />
              Email Address
            </span>
            <input 
              id="login-email"
              type="email" 
              {...form.register("email")} 
              placeholder="admin@example.com" 
              style={{ paddingLeft: 14 }}
            />
            {form.formState.errors.email ? <span className="error">{form.formState.errors.email.message}</span> : null}
          </label>

          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Key size={14} className="muted" />
              Password
            </span>
            <input 
              id="login-password"
              type="password" 
              {...form.register("password")} 
              placeholder="••••••••" 
              style={{ paddingLeft: 14 }}
            />
            {form.formState.errors.password ? <span className="error">{form.formState.errors.password.message}</span> : null}
          </label>
        </div>

        {loginMutation.isError ? (
          <div 
            className="notice error-notice"
            style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span className="small">{(loginMutation.error as Error).message}</span>
          </div>
        ) : null}

        <button 
          id="login-submit-btn"
          type="submit" 
          disabled={loginMutation.isPending}
          style={{ width: "100%", marginTop: 12, padding: "0.85rem" }}
        >
          {loginMutation.isPending ? "Signing in..." : "Login to Workspace"}
        </button>
      </form>
    </div>
  );
}
