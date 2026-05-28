import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { usersApi } from "../../lib/api";
import { departmentApi } from "../../lib/api";

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
  const [newDeptName, setNewDeptName] = useState("");

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
    const selectedUser = users.find((user) => user.id === selectedUserId);

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
      } catch (err) {
        setUserDepartment(null);
      }
    };

    loadDepartment();
  }, [selectedUserId]);

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Admin tools</p>
          <h1>Manage users</h1>
          <p className="muted">Review users and update their basic account details or role.</p>
        </div>
      </div>

      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2>Users</h2>
            <p className="muted">Click a user to load their details into the editor below.</p>
          </div>
        </div>

        {usersQuery.isLoading ? <p className="muted">Loading users...</p> : null}
        {usersQuery.isError ? <p className="error">Unable to load users.</p> : null}

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge">{user.role}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form
        className="panel stack"
        onSubmit={form.handleSubmit((values) => {
          const activeUser = users.find((user) => user.id === selectedUserId);
          if (!activeUser) {
            return;
          }

          updateMutation.mutate({ id: activeUser.id, payload: values });
        })}
      >
        <div className="field-toolbar">
          <div>
            <h2>Edit user</h2>
            <p className="muted">Make changes to the selected user and save them.</p>
          </div>
        </div>

        <div className="grid cols-2">
          <label className="stack small">
            Username
            <input {...form.register("username")} />
          </label>
          <label className="stack small">
            Email
            <input type="email" {...form.register("email")} />
          </label>
        </div>

        <label className="stack small" style={{ maxWidth: 220 }}>
          Role
          <select {...form.register("role")}>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <div style={{ marginTop: 8 }}>
          <strong>Department</strong>
          <div className="muted small" style={{ marginTop: 6 }}>
            {userDepartment ? userDepartment.department_Name : "Not assigned"}
          </div>
        </div>

        {!userDepartment ? (
          <div className="stack" style={{ marginTop: 12, maxWidth: 420 }}>
            <label className="stack small">
              New department name
              <input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
            </label>
            <button
              type="button"
              onClick={async () => {
                if (!selectedUserId) return;
                if (!newDeptName.trim()) return alert("Department name is required");
                try {
                  await departmentApi.create({ department_Name: newDeptName.trim(), userId: selectedUserId });
                  setNewDeptName("");
                  queryClient.invalidateQueries({ queryKey: ["users"] });
                  const dept = await departmentApi.getByUser(selectedUserId);
                  setUserDepartment(dept ?? null);
                } catch (err) {
                  alert((err as Error).message || "Unable to create department");
                }
              }}
            >
              Create and assign department
            </button>
          </div>
        ) : null}

        {updateMutation.isSuccess ? <div className="notice">User updated successfully.</div> : null}
        {updateMutation.isError ? <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>{(updateMutation.error as Error).message}</div> : null}

        <button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}