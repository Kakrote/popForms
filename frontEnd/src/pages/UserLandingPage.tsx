import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import universityLogo from "../public/university.png";
import logo from "../public/logo.png";
import { departmentApi, submissionsApi, formsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Modal from "../components/Modal";
import { SubmissionSectionsView, type SubmissionSectionView } from "../components/SubmissionSectionsView";
import { getFieldTypeLabel } from "../components/fieldTypeLabels";
import type { Submission } from "../types";
import { 
  User, 
  Building2, 
  LogOut, 
  History, 
  FileEdit, 
  Trash2, 
  Eye, 
  FileText,
  AlertCircle
} from "lucide-react";

export function UserLandingPage() {
  const currentUser = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  
  const departmentQuery = useQuery({
    queryKey: ["current-department"],
    queryFn: departmentApi.current,
    enabled: Boolean(currentUser),
  });

  const mySubmissionsQuery = useQuery({
    queryKey: ["my-submissions"],
    queryFn: submissionsApi.mine,
    enabled: Boolean(currentUser),
  });

  const myDraftsQuery = useQuery({
    queryKey: ["my-drafts"],
    queryFn: submissionsApi.mineDrafts,
    enabled: Boolean(currentUser),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => submissionsApi.delete(id),
    onSuccess: () => {
      myDraftsQuery.refetch();
      mySubmissionsQuery.refetch();
      setPendingDeleteDraftId(null);
    },
  });

  const submissions = mySubmissionsQuery.data ?? [];
  const drafts = myDraftsQuery.data ?? [];

  const formsQuery = useQuery({
    queryKey: ["available-forms"],
    queryFn: formsApi.list,
    enabled: Boolean(currentUser),
  });

  const availableForms = useMemo(() => {
    const allForms = formsQuery.data ?? [];
    const submittedFormIds = new Set(submissions.map((s) => s.formId));
    const draftFormIds = new Set(drafts.map((d) => d.formId));
    return allForms.filter((f) => !submittedFormIds.has(f.id) && !draftFormIds.has(f.id));
  }, [formsQuery.data, submissions, drafts]);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [pendingDeleteDraftId, setPendingDeleteDraftId] = useState<string | null>(null);

  const selectedSubmissionSections = useMemo(() => (selectedSubmission ? mapSubmissionSections(selectedSubmission) : []), [selectedSubmission]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="page">
      <div className="panel stack">
        <div className="topbar" style={{ alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                background: "#fff",
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow)",
                overflow: "hidden"
              }}>
                <img src={logo} alt="PRAGATI Icon" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <p className="eyebrow" style={{ margin: 0, fontWeight: 700 }}>PRAGATI Workspace</p>
                <p className="muted" style={{ fontSize: "0.65rem", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>From Data to Decisions</p>
              </div>
            </div>
            <h1>Welcome back, {currentUser?.username}</h1>
            <p className="muted">Track your submission records and complete drafts assigned by your administrator.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img 
              src={universityLogo} 
              alt="Uttaranchal University Logo" 
              style={{ maxHeight: "40px", objectFit: "contain" }} 
            />
            <button
              id="user-logout-btn"
              type="button"
              className="ghost-button"
              onClick={handleLogout}
              style={{ height: "fit-content" }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        <div className="grid cols-2" style={{ marginBottom: 12 }}>
          <div className="card stack" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(99, 102, 241, 0.1)", padding: 10, borderRadius: 10, color: "var(--accent)" }}>
                <User size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: 2 }}>Account Information</strong>
                <p className="muted small" style={{ margin: 0 }}>Role: {currentUser?.role}</p>
                <p className="muted small" style={{ margin: 0 }}>Email: {currentUser?.email}</p>
              </div>
            </div>
          </div>

          <div className="card stack">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                background: departmentQuery.isError ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", 
                padding: 10, 
                borderRadius: 10, 
                color: departmentQuery.isError ? "var(--danger)" : "var(--success)" 
              }}>
                <Building2 size={20} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: 2 }}>Department</strong>
                {departmentQuery.isLoading ? <p className="muted small" style={{ margin: 0 }}>Loading department...</p> : null}
                {departmentQuery.data ? <p className="muted small" style={{ margin: 0 }}>Assigned: <span style={{ color: "var(--text)", fontWeight: 600 }}>{departmentQuery.data.department_Name}</span></p> : null}
                {departmentQuery.isError ? <p className="error small" style={{ margin: 0 }}>This account is not attached to a department yet. Contact admin.</p> : null}
              </div>
            </div>
          </div>
        </div>

        {/* Available Forms Section */}
        <section className="panel stack" style={{ background: "var(--surface-strong)" }}>
          <div className="field-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: "var(--accent)" }}><FileText size={20} /></div>
              <div>
                <h2 style={{ margin: 0 }}>Available Forms</h2>
                <p className="muted small" style={{ margin: 0 }}>New questionnaires assigned to your department that you can start responding to.</p>
              </div>
            </div>
            <span className="badge open" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--accent)" }}>New</span>
          </div>

          {formsQuery.isLoading ? <p className="muted">Loading available forms...</p> : null}
          {!formsQuery.isLoading && !formsQuery.isError && availableForms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
              <AlertCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p className="small">No new forms available for your department.</p>
            </div>
          ) : null}

          {availableForms.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Form Title</th>
                    <th>Description</th>
                    <th>Deadline</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {availableForms.map((form) => {
                    const deadline = form.deadline ? new Date(form.deadline) : null;
                    return (
                      <tr key={form.id}>
                        <td style={{ fontWeight: 600, color: "var(--text)" }}>{form.title}</td>
                        <td className="small muted" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {form.description || "No description provided."}
                        </td>
                        <td>{deadline ? deadline.toLocaleDateString() : "No deadline"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button 
                              id={`start-form-${form.id}`}
                              type="button" 
                              className="small-btn"
                              onClick={() => navigate(`/forms/${form.slug}`)}
                              style={{ background: "var(--accent-gradient)" }}
                            >
                              <FileEdit size={14} />
                              Start Response
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {/* Drafts Section */}
        <section className="panel stack" style={{ background: "var(--surface-strong)" }}>
          <div className="field-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: "var(--accent)" }}><FileEdit size={20} /></div>
              <div>
                <h2 style={{ margin: 0 }}>Draft Submissions</h2>
                <p className="muted small" style={{ margin: 0 }}>Pick up where you left off before deadlines pass.</p>
              </div>
            </div>
            <span className="badge open">Editable</span>
          </div>

          {myDraftsQuery.isLoading ? <p className="muted">Loading drafts...</p> : null}
          {myDraftsQuery.isError ? <p className="error">Unable to load drafts right now.</p> : null}
          {!myDraftsQuery.isLoading && drafts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
              <AlertCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p className="small">No active drafts found.</p>
            </div>
          ) : null}

          {drafts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Last updated</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr key={draft.id}>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>{draft.form?.title ?? draft.formId}</td>
                      <td>{new Date(draft.updatedAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button 
                            id={`edit-draft-${draft.id}`}
                            type="button" 
                            className="small-btn"
                            onClick={() => navigate(`/forms/${draft.form?.slug}`)}
                          >
                            <FileEdit size={14} />
                            Resume
                          </button>
                          <button
                            id={`delete-draft-${draft.id}`}
                            type="button"
                            className="ghost-button small-btn danger-text"
                            onClick={() => setPendingDeleteDraftId(draft.id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {/* Submissions Section */}
        <section className="panel stack" style={{ background: "var(--surface-strong)" }}>
          <div className="field-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: "var(--success)" }}><History size={20} /></div>
              <div>
                <h2 style={{ margin: 0 }}>Submission History</h2>
                <p className="muted small" style={{ margin: 0 }}>Review receipts and fields you already answered.</p>
              </div>
            </div>
            <span className="badge">Read only</span>
          </div>

          {mySubmissionsQuery.isLoading ? <p className="muted">Loading submissions...</p> : null}
          {mySubmissionsQuery.isError ? <p className="error">Unable to load your submissions right now.</p> : null}
          {!mySubmissionsQuery.isLoading && submissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
              <AlertCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p className="small">You have not submitted any forms yet.</p>
            </div>
          ) : null}

          {submissions.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Status</th>
                    <th>Submitted at</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>{submission.form?.title ?? submission.formId}</td>
                      <td>
                        <span className="badge SUBMITTED">{submission.status}</span>
                      </td>
                      <td>{new Date(submission.submittedAt ?? submission.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            id={`view-submission-${submission.id}`}
                            type="button"
                            className="ghost-button small-btn"
                            onClick={async () => {
                              const detail = await submissionsApi.getMineByForm(submission.formId);
                              if (detail) setSelectedSubmission(detail);
                            }}
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {/* Modal for Submission Detail */}
        <Modal 
          open={Boolean(selectedSubmission)} 
          onClose={() => setSelectedSubmission(null)} 
          title={selectedSubmission ? `Submission Details` : "Details"}
        >
          {selectedSubmission ? (
            <div className="split" style={{ gridTemplateColumns: "1fr 1.5fr", gap: "24px", alignItems: "start" }}>
              <div className="field-card stack" style={{ background: "var(--surface-strong)", padding: 20, position: "sticky", top: 0 }}>
                <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: 10, color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>Receipt Summary</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="small">
                  <div className="muted">Form Name: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{selectedSubmission.form?.title ?? selectedSubmission.formId}</div></div>
                  <div className="muted">Submitted By: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{selectedSubmission.submittedBy?.username ?? selectedSubmission.submittedById}</div></div>
                  <div className="muted">Department: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{selectedSubmission.department?.department_Name ?? selectedSubmission.departmentId}</div></div>
                  <div className="muted">Status: <div style={{ marginTop: 4 }}><span className="badge SUBMITTED" style={{ padding: "3px 10px", fontSize: "0.75rem" }}>{selectedSubmission.status}</span></div></div>
                  <div className="muted">Submitted: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : "-"}</div></div>
                </div>
              </div>

              <div style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto", paddingRight: 6 }}>
                <SubmissionSectionsView sections={selectedSubmissionSections} emptyMessage="This submission does not contain any values." />
              </div>
            </div>
          ) : null}
        </Modal>

        {/* Delete Draft Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(pendingDeleteDraftId)}
          title="Delete draft"
          description="Are you sure you want to delete this draft? This cannot be undone."
          confirmLabel="Delete Draft"
          onCancel={() => setPendingDeleteDraftId(null)}
          onConfirm={() => {
            if (!pendingDeleteDraftId) return;
            deleteDraftMutation.mutate(pendingDeleteDraftId);
          }}
          busy={deleteDraftMutation.isPending}
          tone="danger"
        />
      </div>
    </div>
  );
}

function mapSubmissionSections(submission: Submission): SubmissionSectionView[] {
  const sections = submission.form?.sections ?? [];
  const valuesByFieldId = new Map(submission.submissionValue.map((value) => [value.fieldId, value.value]));

  if (sections.length === 0) {
    return [
      {
        id: "__no-sections",
        title: "Submission Values",
        description: null,
        fields: submission.submissionValue.map((value) => ({
          id: value.id,
          label: value.field?.label ?? value.fieldId,
          value: value.value,
        })),
      },
    ];
  }

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description ?? null,
    headerLabel: section.headerLabel ?? null,
    headerDescription: section.headerDescription ?? null,
    fields: section.fields.map((field) => ({
      id: field.id,
      label: `${field.label} • ${getFieldTypeLabel(field.fieldType)}`,
      value: valuesByFieldId.get(field.id) ?? "No response",
    })),
  }));
}
