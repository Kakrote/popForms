import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authApi } from "../../lib/api";

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
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Admin tools</p>
          <h1>Create user</h1>
          <p className="muted">Create the account the user will use to sign in before submitting a shared form.</p>
        </div>
      </div>

      <form className="panel stack" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
        <div className="grid cols-2">
          <label className="stack small">
            Username
            <input {...form.register("username")} placeholder="Jane Doe" />
            {form.formState.errors.username ? <span className="error">{form.formState.errors.username.message}</span> : null}
          </label>

          <label className="stack small">
            Email
            <input type="email" {...form.register("email")} placeholder="jane@company.com" />
            {form.formState.errors.email ? <span className="error">{form.formState.errors.email.message}</span> : null}
          </label>
        </div>

        <div className="grid cols-2">
          <label className="stack small">
            Password
            <input type="password" {...form.register("password")} placeholder="Temporary password" />
            {form.formState.errors.password ? <span className="error">{form.formState.errors.password.message}</span> : null}
          </label>

          <label className="stack small" style={{ maxWidth: 220 }}>
            Role
            <select {...form.register("role")}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>

        {createMutation.isSuccess ? <div className="notice">User created successfully.</div> : null}
        {createMutation.isError ? <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>{(createMutation.error as Error).message}</div> : null}

        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create user"}
        </button>
      </form>
    </div>
  );
}