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

import universityLogo from "../public/university.png";
import logo from "../public/logo.png";

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
    <div className="center-page" style={{ 
      position: "relative", 
      minHeight: "100vh", 
      width: "100%", 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "space-between", 
      boxSizing: "border-box",
      // backgroundImage: 'linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.88)), url("/login_background.jpeg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    }}>
      {/* Top Left: University Logo */}
      <div style={{ position: "absolute", top: "24px", left: "24px" }} className="hide-mobile">
        <img 
          src={universityLogo} 
          alt="Uttaranchal University Logo" 
          style={{ maxHeight: "50px", objectFit: "contain" }} 
        />
      </div>

      {/* Top Right: Name of the Portal */}
      <div style={{ position: "absolute", top: "24px", right: "24px", display: "flex", alignItems: "center", gap: 10 }} className="hide-mobile">
       
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--text)", letterSpacing: "0.05em" }}>PRAGATI PORTAL</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "40px 0" }}>
        <form 
          id="login-form"
          className="auth-card stack" 
          onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
          style={{
            boxShadow: "var(--shadow)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "24px",
            zIndex: 10
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            {/* Circular big logo */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20
            }}>
              <div style={{
                // background: "#fff",
                // borderRadius: "50%",
                width: "290px",
                height: "290px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // boxShadow: "0 8px 24px rgba(99, 102, 241, 0.12)",
                // border: "3px solid var(--accent)",
                overflow: "hidden",
                // padding: "10px"
              }}>
                <img 
                  src={logo} 
                  alt="PRAGATI Portal" 
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                />
              </div>
            </div>

            <h1 style={{ margin: "4px 0 8px 0" }}>Sign In</h1>
            <p className="muted small">Use your credentials to access your dashboard.</p>
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
      <footer style={{ 
        textAlign: "center", 
        padding: "20px 0", 
        fontSize: "0.8rem",
        color: "var(--text)",
        opacity: 0.6,
        width: "100%",
        borderTop: "1px solid var(--border)",
        zIndex: 5
      }}>
        &copy; Developed by IQAC, Uttaranchal University
      </footer>
    </div>
  );
}
