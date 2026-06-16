import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { departmentApi, usersApi } from "../../lib/api";
import { 
  Building2, 
  User, 
  PlusCircle, 
  Save, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  FolderOpen
} from "lucide-react";

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
    return users.filter((user) => !departments.some((dept) => dept.userId === user.id));
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
      alert("Department updated successfully.");
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
    <div className="stack" style={{ gap: 24 }}>
      <div className="topbar">
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={14} />
            Administration
          </p>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Departments</h1>
          <p className="muted" style={{ marginTop: 4 }}>Create departments, rename them, assign managers, and clear out stale records.</p>
        </div>
      </div>

      {/* Create Department Form Panel */}
      <section className="panel stack" style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)", maxWidth: "800px" }}>
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Create Department</h2>
            <p className="muted small" style={{ margin: 0 }}>Define a new department entity and assign an unassigned manager user.</p>
          </div>
        </div>

        <div className="grid cols-2" style={{ gap: 18 }}>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <Building2 size={14} className="muted" />
              Department Name
            </span>
            <input 
              id="create-dept-name"
              value={departmentName} 
              onChange={(e) => setDepartmentName(e.target.value)} 
              placeholder="Engineering / Sales"
            />
          </label>
          <label className="stack small" style={{ gap: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
              <User size={14} className="muted" />
              Assign User Manager
            </span>
            <select 
              id="create-dept-user"
              value={assignedUserId} 
              onChange={(e) => setAssignedUserId(e.target.value)}
            >
              <option value="">Choose unassigned user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          id="create-dept-submit-btn"
          type="button"
          disabled={createMutation.isPending || !departmentName.trim() || !assignedUserId}
          onClick={() => {
            if (!departmentName.trim() || !assignedUserId) return;
            createMutation.mutate();
          }}
          style={{ alignSelf: "flex-start", padding: "0.75rem 1.5rem" }}
        >
          <PlusCircle size={16} />
          {createMutation.isPending ? "Creating..." : "Create Department"}
        </button>

        {createMutation.isSuccess ? (
          <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}>
            <CheckCircle2 size={16} />
            <span>Department created successfully.</span>
          </div>
        ) : null}

        {createMutation.isError ? (
          <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} />
            <span className="small">{(createMutation.error as Error).message}</span>
          </div>
        ) : null}
      </section>

      {/* Manage Departments Panel */}
      <section className="panel stack" style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)" }}>
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Manage Departments</h2>
            <p className="muted small" style={{ margin: 0 }}>Edit department titles, reassign user accounts, or prune departments.</p>
          </div>
          <span className="badge" style={{ gap: 6 }}>
            <FolderOpen size={12} />
            {departments.length} total
          </span>
        </div>

        {departmentsQuery.isLoading ? <p className="muted">Loading departments...</p> : null}
        {departmentsQuery.isError ? <p className="error">Unable to load departments.</p> : null}

        {departments.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Department Title</th>
                  <th style={{ width: "40%" }}>Assigned User Manager</th>
                  <th style={{ width: "20%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <DepartmentRow
                    key={dept.id}
                    department={dept}
                    users={users}
                    onSave={(payload) => updateMutation.mutate({ id: dept.id, payload })}
                    onDelete={() => {
                      setPendingDeleteDepartment({ id: dept.id, name: dept.department_Name });
                    }}
                    saving={updateMutation.isPending}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(pendingDeleteDepartment)}
        title="Delete department"
        description={`Are you sure you want to delete "${pendingDeleteDepartment?.name ?? "this department"}"? This action is permanent.`}
        confirmLabel="Delete Department"
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
        <input 
          id={`dept-name-input-${department.id}`}
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          style={{ padding: "6px 12px", background: "rgba(255,255,255,0.02)" }}
        />
      </td>
      <td>
        <select 
          id={`dept-user-select-${department.id}`}
          value={userId} 
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: "6px 12px", background: "rgba(255,255,255,0.02)" }}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="actions-row" style={{ justifyContent: "flex-end" }}>
          <button 
            id={`dept-save-btn-${department.id}`}
            type="button" 
            className="ghost-button small-btn" 
            disabled={saving} 
            onClick={() => onSave({ department_Name: name, userId })}
          >
            <Save size={12} />
            Save
          </button>
          <button 
            id={`dept-delete-btn-${department.id}`}
            type="button" 
            className="ghost-button small-btn danger-text" 
            disabled={deleting} 
            onClick={onDelete}
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
