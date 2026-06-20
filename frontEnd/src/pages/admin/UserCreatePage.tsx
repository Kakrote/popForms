import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authApi } from "../../lib/api";
import { User, Mail, Key, Shield, UserPlus, CheckCircle2, AlertTriangle } from "lucide-react";

const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"]),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UserCreatePage() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "USER",
    },
  });

  const createMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      form.reset({
        username: "",
        email: "",
        password: "",
        role: "USER",
      });
    },
  });

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="topbar">
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <UserPlus size={14} />
            Provisioning
          </p>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Create User Account</h1>
          <p className="muted" style={{ marginTop: 4 }}>Provision new user credentials before assigning them to a department.</p>
        </div>
      </div>

      <form 
        id="create-user-form"
        className="panel stack" 
        onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", maxWidth: "800px" }}
      >
        <div className="grid cols-2" style={{ gap: 18 }}>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <User size={14} className="muted" />
              Username
            </span>
            <input 
              id="create-username"
              {...form.register("username")} 
              placeholder="Jane Doe" 
            />
            {form.formState.errors.username ? <span className="error">{form.formState.errors.username.message}</span> : null}
          </label>

          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Mail size={14} className="muted" />
              Email Address
            </span>
            <input 
              id="create-email"
              type="email" 
              {...form.register("email")} 
              placeholder="jane.doe@company.com" 
            />
            {form.formState.errors.email ? <span className="error">{form.formState.errors.email.message}</span> : null}
          </label>
        </div>

        <div className="grid cols-2" style={{ gap: 18 }}>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Key size={14} className="muted" />
              Temporary Password
            </span>
            <input 
              id="create-password"
              type="password" 
              {...form.register("password")} 
              placeholder="Minimum 6 characters" 
            />
            {form.formState.errors.password ? <span className="error">{form.formState.errors.password.message}</span> : null}
          </label>

          <label className="stack small" style={{ gap: 6, maxWidth: 220 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Shield size={14} className="muted" />
              Account Role
            </span>
            <select id="create-role" {...form.register("role")}>
              <option value="USER">User (Fill Forms)</option>
              <option value="ADMIN">Admin (Build & Manage)</option>
            </select>
          </label>
        </div>

        {createMutation.isSuccess ? (
          <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}>
            <CheckCircle2 size={16} />
            <span>User account provisioned successfully.</span>
          </div>
        ) : null}

        {createMutation.isError ? (
          <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} />
            <span className="small">{(createMutation.error as Error).message}</span>
          </div>
        ) : null}

        <button 
          id="create-user-submit-btn"
          type="submit" 
          disabled={createMutation.isPending}
          style={{ alignSelf: "flex-start", padding: "0.75rem 1.5rem" }}
        >
          {createMutation.isPending ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}