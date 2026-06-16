import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "react-router-dom";
import { departmentApi, usersApi } from "../../lib/api";
import { 
  Users, 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle,
  Link2
} from "lucide-react";

const editUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email("Enter a valid email address"),
  role: z.enum(["USER", "ADMIN"]),
});

type EditUserValues = z.infer<typeof editUserSchema>;

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: departmentApi.list,
  });

  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "USER",
    },
  });

  const users = usersQuery.data ?? [];

  const [userDepartment, setUserDepartment] = useState<{ id: string; department_Name: string } | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditUserValues }) => usersApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
      form.reset({
        username: users[0].username,
        email: users[0].email,
        role: users[0].role,
      });
    }
  }, [form, selectedUserId, users]);

  useEffect(() => {
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (selectedUser) {
      form.reset({
        username: selectedUser.username,
        email: selectedUser.email,
        role: selectedUser.role,
      });
    }
  }, [form, selectedUserId, users]);

  useEffect(() => {
    const loadDepartment = async () => {
      if (!selectedUserId) return setUserDepartment(null);
      try {
        const dept = await departmentApi.getByUser(selectedUserId);
        setUserDepartment(dept ?? null);
        setSelectedDepartmentId(dept?.id ?? "");
      } catch (err) {
        setUserDepartment(null);
        setSelectedDepartmentId("");
      }
    };
    loadDepartment();
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedDepartmentId && departmentsQuery.data?.length) {
      setSelectedDepartmentId(departmentsQuery.data[0].id);
    }
  }, [departmentsQuery.data, selectedDepartmentId]);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="topbar" style={{ margin: 0 }}>
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} />
            Administration
          </p>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Manage Users</h1>
          <p className="muted" style={{ marginTop: 4 }}>Review existing users, update basic account profiles, and assign department relationships.</p>
        </div>
        <Link to="/admin/departments" id="users-go-depts-btn" className="ghost-button">
          <Building2 size={16} />
          Create / Manage Departments
        </Link>
      </div>

      {/* Users Table Panel */}
      <section className="panel stack" style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)" }}>
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>System Users</h2>
            <p className="muted small" style={{ margin: 0 }}>Select a user row to edit their details and department mappings in the form below.</p>
          </div>
        </div>

        {usersQuery.isLoading ? <p className="muted">Loading users...</p> : null}
        {usersQuery.isError ? <p className="error">Unable to load users.</p> : null}

        {users.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      cursor: "pointer",
                      background: selectedUserId === user.id ? "rgba(99, 102, 241, 0.08)" : undefined 
                    }}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <td style={{ fontWeight: 600, color: "#fff" }}>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === "ADMIN" ? "open" : "closed"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        id={`user-edit-row-btn-${user.id}`}
                        type="button"
                        className="ghost-button small-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(user.id);
                        }}
                      >
                        <Edit2 size={12} />
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* Edit Form Panel */}
      <form
        id="user-edit-form"
        className="panel stack"
        onSubmit={form.handleSubmit((values) => {
          const activeUser = users.find((u) => u.id === selectedUserId);
          if (!activeUser) return;
          updateMutation.mutate({ id: activeUser.id, payload: values });
        })}
        style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)" }}
      >
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Edit User Details</h2>
            <p className="muted small" style={{ margin: 0 }}>Modify general configuration details for the selected user account.</p>
          </div>
        </div>

        <div className="grid cols-2" style={{ gap: 18 }}>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <User size={14} className="muted" />
              Username
            </span>
            <input id="edit-username" {...form.register("username")} />
            {form.formState.errors.username ? <span className="error">{form.formState.errors.username.message}</span> : null}
          </label>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Mail size={14} className="muted" />
              Email Address
            </span>
            <input id="edit-email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <span className="error">{form.formState.errors.email.message}</span> : null}
          </label>
        </div>

        <label className="stack small" style={{ gap: 6, maxWidth: 220 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
            <Shield size={14} className="muted" />
            Account Role
          </span>
          <select id="edit-role" {...form.register("role")}>
            <option value="USER">User (Fill Forms)</option>
            <option value="ADMIN">Admin (Build & Manage)</option>
          </select>
        </label>

        {/* Department Info */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 18, marginTop: 8 }}>
          <strong style={{ display: "block", color: "#fff", fontSize: "1rem", marginBottom: 6 }}>Department Assignment</strong>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="small muted">
            <Building2 size={14} />
            Assigned: <span style={{ color: "#fff", fontWeight: 600 }}>{userDepartment ? userDepartment.department_Name : "None / Unassigned"}</span>
          </div>
        </div>

        {/* Assign Department Action */}
        <div className="stack" style={{ marginTop: 12, maxWidth: 500, gap: 12 }}>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ fontWeight: 500, color: "var(--text)" }}>Assign Existing Department</span>
            <select 
              id="edit-assign-dept-select"
              value={selectedDepartmentId} 
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
            >
              <option value="">Choose department...</option>
              {(departmentsQuery.data ?? []).map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_Name} {dept.user?.username ? `(assigned to: ${dept.user.username})` : "(unassigned)"}
                </option>
              ))}
            </select>
          </label>
          
          <button
            id="edit-assign-dept-btn"
            type="button"
            className="ghost-button"
            style={{ alignSelf: "flex-start", gap: 6 }}
            onClick={async () => {
              if (!selectedUserId || !selectedDepartmentId) return;
              try {
                await departmentApi.update(selectedDepartmentId, { userId: selectedUserId });
                queryClient.invalidateQueries({ queryKey: ["users"] });
                queryClient.invalidateQueries({ queryKey: ["departments"] });
                const dept = await departmentApi.getByUser(selectedUserId);
                setUserDepartment(dept ?? null);
                alert("Department assigned successfully.");
              } catch (err) {
                alert((err as Error).message || "Unable to assign department");
              }
            }}
          >
            <Link2 size={16} />
            Assign Selected Department
          </button>
        </div>

        {updateMutation.isSuccess ? (
          <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}>
            <CheckCircle2 size={16} />
            <span>User profile updated successfully.</span>
          </div>
        ) : null}
        
        {updateMutation.isError ? (
          <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} />
            <span className="small">{(updateMutation.error as Error).message}</span>
          </div>
        ) : null}

        <button 
          id="user-edit-save-btn"
          type="submit" 
          disabled={updateMutation.isPending}
          style={{ alignSelf: "flex-start", padding: "0.75rem 1.5rem" }}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}