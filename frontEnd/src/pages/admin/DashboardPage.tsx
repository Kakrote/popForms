import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import universityLogo from "../../public/university.png";
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

  const [submissionsSearch, setSubmissionsSearch] = useState("");
  const [formsSearch, setFormsSearch] = useState("");

  const rawForms = formsQuery.data ?? [];
  const rawSubmissions = submissionsQuery.data ?? [];
  const totalSubmissions = rawSubmissions.length;
  const openForms = rawForms.filter((form) => form.isOpen).length;
  const closedForms = rawForms.length - openForms;

  const sortedSubmissions = useMemo(() => {
    const sorted = [...rawSubmissions].sort((a, b) => {
      const dateA = new Date(a.submittedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.submittedAt ?? b.createdAt).getTime();
      return dateB - dateA;
    });
    if (!submissionsSearch.trim()) return sorted;
    const query = submissionsSearch.toLowerCase();
    return sorted.filter((sub) => {
      const formTitle = (sub.form?.title ?? "").toLowerCase();
      const user = (sub.submittedBy?.username ?? "").toLowerCase();
      const dept = (sub.department?.department_Name ?? "").toLowerCase();
      return formTitle.includes(query) || user.includes(query) || dept.includes(query);
    });
  }, [rawSubmissions, submissionsSearch]);

  const filteredForms = useMemo(() => {
    if (!formsSearch.trim()) return rawForms;
    const query = formsSearch.toLowerCase();
    return rawForms.filter((form) => form.title.toLowerCase().includes(query) || form.slug.toLowerCase().includes(query));
  }, [rawForms, formsSearch]);

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
      <div className="topbar" style={{ alignItems: "flex-start" }}>
        <div>
          <p className="eyebrow">Overview</p>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Dashboard</h1>
          <p className="muted" style={{ marginTop: 4 }}>Monitor forms and submissions from the first demo-ready build.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
         
          <Link to="/admin/forms/new">
            <button type="button" id="admin-create-form-btn" style={{ height: "fit-content" }}>
              <Plus size={18} />
              Create form
            </button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <section className="stat-grid">
        <div className="stat">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Total Forms</span>
            <div style={{ color: "var(--accent)" }}><ClipboardList size={20} /></div>
          </div>
          <strong>{rawForms.length}</strong>
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

        {rawSubmissions.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <input
              id="search-submissions"
              type="text"
              placeholder="Filter submissions by form, user, or department..."
              value={submissionsSearch}
              onChange={(e) => setSubmissionsSearch(e.target.value)}
              style={{ maxWidth: "450px", fontSize: "0.875rem", padding: "8px 14px", background: "var(--surface)" }}
            />
          </div>
        )}

        {submissionsQuery.isLoading ? <p className="muted">Loading submissions...</p> : null}
        {submissionsQuery.isError ? <p className="error">Unable to load submissions right now.</p> : null}
        {!submissionsQuery.isLoading && rawSubmissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No submitted records yet.</p>
          </div>
        ) : null}
        {!submissionsQuery.isLoading && rawSubmissions.length > 0 && sortedSubmissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)" }}>
            <AlertCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p className="small">No submissions match your filter query.</p>
          </div>
        ) : null}

        {sortedSubmissions.length > 0 ? (
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
                {sortedSubmissions.map((submission) => (
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
            <div className="split" style={{ gridTemplateColumns: "1fr 1.5fr", gap: "24px", alignItems: "start" }}>
              <div className="field-card stack" style={{ background: "var(--surface-strong)", padding: 20, position: "sticky", top: 0 }}>
                <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: 10, color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>Receipt Summary</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="small">
                  <div className="muted">Form Name: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{submissionDetail.form?.title ?? submissionDetail.formId}</div></div>
                  <div className="muted">Submitted By: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{submissionDetail.submittedBy?.username ?? submissionDetail.submittedById}</div></div>
                  <div className="muted">Department: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{submissionDetail.department?.department_Name ?? submissionDetail.departmentId}</div></div>
                  <div className="muted">Status: <div style={{ marginTop: 4 }}><span className="badge SUBMITTED" style={{ padding: "3px 10px", fontSize: "0.75rem" }}>{submissionDetail.status}</span></div></div>
                  <div className="muted">Submitted: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{submissionDetail.submittedAt ? new Date(submissionDetail.submittedAt).toLocaleString() : "-"}</div></div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
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
                    style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    <Trash2 size={14} />
                    Delete submission
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: "calc(90vh - 180px)", overflowY: "auto", paddingRight: 6 }}>
                <SubmissionSectionsView sections={submissionSections} emptyMessage="This submission does not contain any values." />
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

        {rawForms.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <input
              id="search-forms"
              type="text"
              placeholder="Search forms by title or slug..."
              value={formsSearch}
              onChange={(e) => setFormsSearch(e.target.value)}
              style={{ maxWidth: "350px", fontSize: "0.875rem", padding: "8px 14px", background: "var(--surface)" }}
            />
          </div>
        )}

        {formsQuery.isLoading ? <p className="muted">Loading forms...</p> : null}
        {formsQuery.isError ? <p className="error">Unable to load forms right now.</p> : null}
        {!formsQuery.isLoading && rawForms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No forms have been created yet.</p>
          </div>
        ) : null}
        {!formsQuery.isLoading && rawForms.length > 0 && filteredForms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)" }}>
            <AlertCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p className="small">No forms match your search query.</p>
          </div>
        ) : null}

        {filteredForms.length > 0 ? (
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
                {filteredForms.map((form) => {
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
    headerLabel: section.headerLabel ?? null,
    headerDescription: section.headerDescription ?? null,
    fields: section.fields.map((field) => ({
      id: field.id,
      label: `${field.label}${field.fieldType ? ` • ${getFieldTypeLabel(field.fieldType)}` : ""}`,
      value: valuesByFieldId.get(field.id) ?? "No response",
    })),
  }));
}
