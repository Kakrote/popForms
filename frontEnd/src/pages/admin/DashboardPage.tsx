import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { SubmissionSectionsView, type SubmissionSectionView } from "../../components/SubmissionSectionsView";
import { getFieldTypeLabel } from "../../components/fieldTypeLabels";
import { formsApi, submissionsApi } from "../../lib/api";
import { copyToClipboard } from "../../lib/clipboard";
import type { Submission } from "../../types";
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Inbox, 
  Eye, 
  Trash2, 
  Copy, 
  Check, 
  Settings, 
  Plus, 
  AlertCircle
} from "lucide-react";

type PendingDelete =
  | { kind: "submission"; id: string; label: string }
  | { kind: "form"; slug: string; label: string }
  | null;

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);

  const formsQuery = useQuery({
    queryKey: ["forms"],
    queryFn: formsApi.list,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ slug, isOpen }: { slug: string; isOpen: boolean }) => formsApi.toggleStatus(slug, isOpen),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forms"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: formsApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      setPendingDelete(null);
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ["submissions"],
    queryFn: submissionsApi.list,
  });

  const submissionDetailQuery = useQuery({
    queryKey: ["submission-detail", selectedSubmissionId],
    queryFn: () => submissionsApi.getById(selectedSubmissionId as string),
    enabled: Boolean(selectedSubmissionId),
  });

  const submissionDetail = submissionDetailQuery.data;
  const submissionSections = useMemo(() => mapSubmissionSections(submissionDetail), [submissionDetail]);

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id: string) => submissionsApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["submissions"] });
      setSelectedSubmissionId(null);
      setPendingDelete(null);
    },
  });

  const forms = formsQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const totalSubmissions = submissions.length;
  const openForms = forms.filter((form) => form.isOpen).length;
  const closedForms = forms.length - openForms;

  const handleCopyLink = (formId: string, slug: string) => {
    const shareLink = `${window.location.origin}/forms/${slug}`;
    copyToClipboard(shareLink).then((success) => {
      if (success) {
        setCopiedFormId(formId);
        setTimeout(() => setCopiedFormId(null), 2000);
      }
    });
  };

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Dashboard</h1>
          <p className="muted" style={{ marginTop: 4 }}>Monitor forms and submissions from the first demo-ready build.</p>
        </div>
        <Link to="/admin/forms/new">
          <button type="button" id="admin-create-form-btn">
            <Plus size={18} />
            Create form
          </button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <section className="stat-grid">
        <div className="stat">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Total Forms</span>
            <div style={{ color: "var(--accent)" }}><ClipboardList size={20} /></div>
          </div>
          <strong>{forms.length}</strong>
        </div>
        
        <div className="stat">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Active Forms</span>
            <div style={{ color: "var(--success)" }}><CheckCircle2 size={20} /></div>
          </div>
          <strong>{openForms}</strong>
        </div>

        <div className="stat">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Closed Forms</span>
            <div style={{ color: "var(--danger)" }}><XCircle size={20} /></div>
          </div>
          <strong>{closedForms}</strong>
        </div>

        <div className="stat">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Submissions</span>
            <div style={{ color: "#a855f7" }}><Inbox size={20} /></div>
          </div>
          <strong>{totalSubmissions}</strong>
        </div>
      </section>

      {/* Submissions Section */}
      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Recent Submissions</h2>
            <p className="muted small" style={{ margin: 0 }}>Admin view contains submitted records only.</p>
          </div>
          <span className="badge SUBMITTED">Submitted only</span>
        </div>

        {submissionsQuery.isLoading ? <p className="muted">Loading submissions...</p> : null}
        {submissionsQuery.isError ? <p className="error">Unable to load submissions right now.</p> : null}
        {!submissionsQuery.isLoading && submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No submitted records yet.</p>
          </div>
        ) : null}

        {submissions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Preview</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted at</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>{submission.form?.title ?? submission.formId}</td>
                    <td className="small" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {submission.submissionValue && submission.submissionValue.length > 0
                        ? submission.submissionValue
                            .slice(0, 2)
                            .map((v) => `${v.field?.label ?? v.fieldId}: ${v.value}`)
                            .join(" — ")
                        : "—"}
                    </td>
                    <td>{submission.submittedBy?.username ?? submission.submittedById}</td>
                    <td>{submission.department?.department_Name ?? submission.departmentId}</td>
                    <td>
                      <span className="badge SUBMITTED">{submission.status}</span>
                    </td>
                    <td>{new Date(submission.submittedAt ?? submission.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button 
                          id={`view-sub-btn-${submission.id}`}
                          type="button" 
                          className="ghost-button small-btn" 
                          onClick={() => setSelectedSubmissionId(submission.id)}
                        >
                          <Eye size={14} />
                          View Values
                        </button>
                        <button
                          id={`delete-sub-btn-${submission.id}`}
                          type="button"
                          className="ghost-button small-btn danger-text"
                          onClick={() =>
                            setPendingDelete({
                              kind: "submission",
                              id: submission.id,
                              label: `${submission.form?.title ?? "this submission"} / ${submission.submittedBy?.username ?? submission.submittedById}`,
                            })
                          }
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

        {/* View Submission Modal */}
        <Modal open={Boolean(selectedSubmissionId)} onClose={() => setSelectedSubmissionId(null)} title={submissionDetail ? `Submission Details` : "Details"}>
          {submissionDetailQuery.isLoading ? <p className="muted">Loading submission details...</p> : null}
          {submissionDetailQuery.isError ? <p className="error">Unable to load this submission detail.</p> : null}

          {submissionDetail ? (
            <div className="stack">
              <div className="field-card" style={{ background: "var(--surface-strong)" }}>
                <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: 10, color: "var(--text)" }}>Receipt Summary</strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="small">
                  <div className="muted">Form Name: <span style={{ color: "var(--text)" }}>{submissionDetail.form?.title ?? submissionDetail.formId}</span></div>
                  <div className="muted">Submitted By: <span style={{ color: "var(--text)" }}>{submissionDetail.submittedBy?.username ?? submissionDetail.submittedById}</span></div>
                  <div className="muted">Department: <span style={{ color: "var(--text)" }}>{submissionDetail.department?.department_Name ?? submissionDetail.departmentId}</span></div>
                  <div className="muted">Status: <span className="badge SUBMITTED" style={{ padding: "1px 8px", fontSize: "0.7rem" }}>{submissionDetail.status}</span></div>
                  <div className="muted" style={{ gridColumn: "span 2" }}>Submitted: <span style={{ color: "var(--text)" }}>{submissionDetail.submittedAt ? new Date(submissionDetail.submittedAt).toLocaleString() : "-"}</span></div>
                </div>
              </div>

              <SubmissionSectionsView sections={submissionSections} emptyMessage="This submission does not contain any values." />

              <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                <button
                  id="modal-delete-sub-btn"
                  type="button"
                  onClick={() =>
                    setPendingDelete({
                      kind: "submission",
                      id: submissionDetail.id,
                      label: `${submissionDetail.form?.title ?? "this submission"} / ${submissionDetail.submittedBy?.username ?? submissionDetail.submittedById}`,
                    })
                  }
                  className="ghost-button danger-text"
                >
                  <Trash2 size={16} />
                  Delete submission
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      </section>

      {/* Forms Section */}
      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Forms Manager</h2>
            <p className="muted small" style={{ margin: 0 }}>Toggle availability, inspect submissions, or share public links.</p>
          </div>
          <span className="badge">Admin only</span>
        </div>

        {formsQuery.isLoading ? <p className="muted">Loading forms...</p> : null}
        {formsQuery.isError ? <p className="error">Unable to load forms right now.</p> : null}
        {!formsQuery.isLoading && forms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No forms have been created yet.</p>
          </div>
        ) : null}

        {forms.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Fields</th>
                  <th>Submissions</th>
                  <th>Share Link</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => {
                  const isCopied = copiedFormId === form.id;
                  return (
                    <tr key={form.id}>
                      <td>
                        <strong style={{ color: "var(--text)" }}>{form.title}</strong>
                        <div className="muted small" style={{ fontFamily: "monospace" }}>/{form.slug}</div>
                      </td>
                      <td>
                        <span className={`badge ${form.isOpen ? "open" : "closed"}`}>{form.isOpen ? "Open" : "Closed"}</span>
                      </td>
                      <td>{Array.isArray(form.sections) ? form.sections.reduce((count, section) => count + (section.fields?.length ?? 0), 0) : 0} fields</td>
                      <td>{Array.isArray(form.submissions) ? form.submissions.length : 0} entries</td>
                      <td>
                        <button
                          id={`copy-link-${form.id}`}
                          className="ghost-button small-btn"
                          type="button"
                          onClick={() => handleCopyLink(form.id, form.slug)}
                          style={{ minWidth: "105px" }}
                        >
                          {isCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                          {isCopied ? "Copied!" : "Copy Link"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button 
                            id={`manage-form-${form.id}`}
                            type="button" 
                            className="small-btn"
                            onClick={() => navigate(`/admin/forms/${form.slug}`)}
                          >
                            <Settings size={14} />
                            Manage
                          </button>
                          <button
                            id={`toggle-form-${form.id}`}
                            type="button"
                            className="ghost-button small-btn"
                            onClick={() => toggleMutation.mutate({ slug: form.slug, isOpen: !form.isOpen })}
                            disabled={toggleMutation.isPending}
                          >
                            {form.isOpen ? "Close" : "Open"}
                          </button>
                          <button
                            id={`delete-form-${form.id}`}
                            type="button"
                            className="ghost-button small-btn danger-text"
                            onClick={() => setPendingDelete({ kind: "form", slug: form.slug, label: form.title })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={14} />
                            Delete
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

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title={pendingDelete?.kind === "submission" ? "Delete Submission" : "Delete Form"}
          description={
            pendingDelete?.kind === "submission"
              ? `Are you sure you want to delete ${pendingDelete.label}? This cannot be undone and values will be permanently removed.`
              : `Are you sure you want to delete ${pendingDelete?.label ?? "this form"}? This will permanently close the form and delete all associated entries.`
          }
          confirmLabel="Delete permanently"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            if (!pendingDelete) return;

            if (pendingDelete.kind === "submission") {
              deleteSubmissionMutation.mutate(pendingDelete.id);
              return;
            }

            deleteMutation.mutate(pendingDelete.slug);
          }}
          busy={deleteSubmissionMutation.isPending || deleteMutation.isPending}
          tone="danger"
        />
      </section>
    </div>
  );
}

function mapSubmissionSections(submission: Submission | undefined): SubmissionSectionView[] {
  if (!submission) {
    return [];
  }

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
    fields: section.fields.map((field) => ({
      id: field.id,
      label: `${field.label}${field.fieldType ? ` • ${getFieldTypeLabel(field.fieldType)}` : ""}`,
      value: valuesByFieldId.get(field.id) ?? "No response",
    })),
  }));
}
