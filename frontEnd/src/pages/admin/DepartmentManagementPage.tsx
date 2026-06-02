import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { departmentApi, usersApi } from "../../lib/api";

export function DepartmentManagementPage() {
  const queryClient = useQueryClient();
  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: departmentApi.list,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const [departmentName, setDepartmentName] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [pendingDeleteDepartment, setPendingDeleteDepartment] = useState<{ id: string; name: string } | null>(null);

  const departments = departmentsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const availableUsers = useMemo(() => {
    return users.filter((user) => !departments.some((department) => department.userId === user.id));
  }, [departments, users]);

  const createMutation = useMutation({
    mutationFn: () => departmentApi.create({ department_Name: departmentName.trim(), userId: assignedUserId }),
    onSuccess: async () => {
      setDepartmentName("");
      setAssignedUserId("");
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { department_Name?: string; userId?: string } }) =>
      departmentApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setPendingDeleteDepartment(null);
    },
  });

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Admin tools</p>
          <h1>Departments</h1>
          <p className="muted">Create departments, rename them, assign users, and delete unused departments.</p>
        </div>
      </div>

      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2>Create department</h2>
            <p className="muted">Create a new department and assign an unassigned user to it.</p>
          </div>
        </div>

        <div className="grid cols-2">
          <label className="stack small">
            Department name
            <input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} />
          </label>
          <label className="stack small">
            Assign user
            <select value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)}>
              <option value="">Select user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={createMutation.isPending || !departmentName.trim() || !assignedUserId}
          onClick={() => {
            if (!departmentName.trim() || !assignedUserId) return;
            createMutation.mutate();
          }}
        >
          {createMutation.isPending ? "Creating..." : "Create department"}
        </button>

        {createMutation.isError ? <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>{(createMutation.error as Error).message}</div> : null}
        {createMutation.isSuccess ? <div className="notice">Department created successfully.</div> : null}
      </section>

      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2>Manage departments</h2>
            <p className="muted">Edit names, reassign users, or delete departments.</p>
          </div>
          <span className="badge">{departments.length} total</span>
        </div>

        {departmentsQuery.isLoading ? <p className="muted">Loading departments...</p> : null}
        {departmentsQuery.isError ? <p className="error">Unable to load departments.</p> : null}

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>User</th>
                <th>User ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <DepartmentRow
                  key={department.id}
                  department={department}
                  users={users}
                  onSave={(payload) => updateMutation.mutate({ id: department.id, payload })}
                  onDelete={() => {
                    setPendingDeleteDepartment({ id: department.id, name: department.department_Name });
                  }}
                  saving={updateMutation.isPending}
                  deleting={deleteMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDeleteDepartment)}
        title="Delete department"
        description={`Delete ${pendingDeleteDepartment?.name ?? "this department"}? This cannot be undone.`}
        confirmLabel="Delete department"
        onCancel={() => setPendingDeleteDepartment(null)}
        onConfirm={() => {
          if (!pendingDeleteDepartment) return;
          deleteMutation.mutate(pendingDeleteDepartment.id);
        }}
        busy={deleteMutation.isPending}
        tone="danger"
      />
    </div>
  );
}

function DepartmentRow({
  department,
  users,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  department: { id: string; department_Name: string; userId: string; user?: { id: string; username: string; email: string } };
  users: Array<{ id: string; username: string; email: string }>;
  onSave: (payload: { department_Name?: string; userId?: string }) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  const [name, setName] = useState(department.department_Name);
  const [userId, setUserId] = useState(department.userId);

  return (
    <tr>
      <td>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </td>
      <td>
        <select value={userId} onChange={(event) => setUserId(event.target.value)}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
      </td>
      <td>{department.userId}</td>
      <td>
        <div className="actions-row">
          <button type="button" className="ghost-button" disabled={saving} onClick={() => onSave({ department_Name: name, userId })}>
            Save
          </button>
          <button type="button" className="ghost-button" disabled={deleting} onClick={onDelete}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
