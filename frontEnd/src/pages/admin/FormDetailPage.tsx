import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { SubmissionSectionsView, type SubmissionSectionView } from "../../components/SubmissionSectionsView";
import { getFieldTypeLabel } from "../../components/fieldTypeLabels";
import { formsApi, submissionsApi } from "../../lib/api";
import { copyToClipboard } from "../../lib/clipboard";
import type { Submission } from "../../types";
import { generateSubmissionPDF } from "../../lib/pdf";
import { 
  ArrowLeft, 
  BarChart3,
  Copy, 
  Check, 
  Trash2, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Clock,
  Layers,
  Inbox,
  AlertCircle,
  Save,
  X,
  Download
} from "lucide-react";

export function FormDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const editSubmissionMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Array<{ fieldId: string; value: string }> }) =>
      submissionsApi.update(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["form", slug] });
      setIsEditingSubmission(false);
      alert("Submission updated successfully.");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update submission");
    }
  });

  const formQuery = useQuery({
    queryKey: ["form", slug],
    queryFn: () => formsApi.getBySlug(slug as string),
    enabled: Boolean(slug),
  });

  const toggleMutation = useMutation({
    mutationFn: (isOpen: boolean) => formsApi.toggleStatus(slug as string, isOpen),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["form", slug] });
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => formsApi.remove(slug as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      setShowDeleteConfirm(false);
      navigate("/admin");
    },
  });

  const form = formQuery.data;
  const submissions = (form?.submissions as Submission[] | undefined) ?? [];
  const sections = form?.sections ?? [];

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? submissions[0],
    [selectedSubmissionId, submissions]
  );

  const submissionSections = useMemo(() => mapSubmissionSections(selectedSubmission), [selectedSubmission]);

  useEffect(() => {
    setIsEditingSubmission(false);
    setEditValues({});
  }, [selectedSubmissionId]);

  const handleCopyLink = () => {
    if (!form) return;
    const shareLink = `${window.location.origin}/forms/${form.slug}`;
    copyToClipboard(shareLink).then((success) => {
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  };

  if (formQuery.isLoading) {
    return <p className="muted">Loading form details...</p>;
  }

  if (formQuery.isError || !form) {
    return <p className="error">Unable to load this form.</p>;
  }

  const shareLink = `${window.location.origin}/forms/${form.slug}`;

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* Top Navigation */}
      <div>
        <button 
          id="detail-back-btn"
          type="button" 
          className="ghost-button small-btn" 
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>

      {/* Title Area */}
      <div className="topbar" style={{ margin: 0 }}>
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} />
            Questionnaire Details
          </p>
          <h1 style={{ fontSize: "2rem", margin: "4px 0 0 0" }}>{form.title}</h1>
          <p className="muted small" style={{ fontFamily: "monospace", marginTop: 4 }}>/{form.slug}</p>
        </div>
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/admin/analytics")}
          >
            <BarChart3 size={16} />
            Form Analytics
          </button>

          <button 
            id="detail-copy-link-btn"
            type="button" 
            className="ghost-button" 
            onClick={handleCopyLink}
            style={{ minWidth: "115px" }}
          >
            {copiedLink ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            {copiedLink ? "Copied!" : "Copy Link"}
          </button>
          
          <button 
            id="detail-toggle-btn"
            type="button" 
            className="ghost-button" 
            onClick={() => toggleMutation.mutate(!form.isOpen)}
          >
            {form.isOpen ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {form.isOpen ? "Close Form" : "Open Form"}
          </button>
          
          <button
            id="detail-edit-btn"
            type="button"
            className="ghost-button"
            onClick={() => navigate(`/admin/forms/${form.slug}/edit`)}
          >
            <Settings size={16} />
            Edit Structure
          </button>
          
          <button 
            id="detail-delete-btn"
            type="button" 
            className="danger-button" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} />
            Delete Form
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid cols-2">
        {/* Left Column: Form Summary */}
        <section className="panel stack" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="field-toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Form Status Summary</h2>
              <p className="muted small" style={{ margin: 0 }}>Overview of questionnaire settings and public links.</p>
            </div>
            <span className={`badge ${form.isOpen ? "open" : "closed"}`}>
              {form.isOpen ? "Accepting Responses" : "Inactive"}
            </span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.015)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
            <p style={{ margin: 0, color: "var(--text)" }}>{form.description || "No description provided for this form."}</p>
          </div>

          <div className="grid cols-2" style={{ gap: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(99,102,241,0.1)", padding: 8, borderRadius: 8, color: "var(--accent)" }}>
                <Layers size={18} />
              </div>
              <div>
                <span className="muted small" style={{ display: "block" }}>Total Questions</span>
                <strong style={{ color: "var(--text)" }}>{sections.length} sections</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(16,185,129,0.1)", padding: 8, borderRadius: 8, color: "var(--success)" }}>
                <Inbox size={18} />
              </div>
              <div>
                <span className="muted small" style={{ display: "block" }}>Submissions</span>
                <strong style={{ color: "var(--text)" }}>{submissions.length} receipts</strong>
              </div>
            </div>
          </div>

          <div className="notice" style={{ background: "rgba(0,0,0,0.02)", borderColor: "var(--border)", gap: 6 }}>
            <strong style={{ color: "var(--text)" }}>Public Web Link</strong>
            <span className="small" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{shareLink}</span>
          </div>
        </section>

        {/* Right Column: Schema/Fields List */}
        <section className="panel stack" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0 }}>Questionnaire Schema</h2>
          <p className="muted small">List of all fields configured inside sections.</p>
          
          {sections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <AlertCircle size={24} className="muted" style={{ opacity: 0.5, marginBottom: 8 }} />
              <p className="muted small">No questions configured yet.</p>
            </div>
          ) : null}

          <div className="stack" style={{ gap: 12, maxHeight: "350px", overflowY: "auto", paddingRight: 6 }}>
            {sections.map((section, idx) => (
              <div className="card stack" key={section.id} style={{ background: "var(--surface-strong)", border: "1px solid var(--border)", padding: 16, gap: 10 }}>
                <div className="field-toolbar" style={{ margin: 0 }}>
                  <div>
                    <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{idx + 1}. {section.title}</strong>
                    {section.description ? <p className="muted small" style={{ margin: "2px 0 0 0", fontSize: "0.8rem" }}>{section.description}</p> : null}
                  </div>
                  <span className="badge small">{section.fields.length} {section.fields.length === 1 ? "field" : "fields"}</span>
                </div>

                <div className="stack" style={{ gap: 8 }}>
                  {section.fields.map((field) => (
                    <div className="field-card" key={field.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 10, borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{field.label}</span>
                        <span className="badge" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>{getFieldTypeLabel(field.fieldType)}</span>
                      </div>
                      {field.options.length > 0 ? (
                        <p className="small muted" style={{ margin: "4px 0 0 0", fontSize: "0.75rem" }}>
                          Options: {field.options.map((opt) => opt.label).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Submissions Section */}
      <section className="panel stack" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="field-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Submission Receipts</h2>
            <p className="muted small" style={{ margin: 0 }}>Select a submitted receipt from the left to view response data on the right.</p>
          </div>
        </div>

        <div className="stack" style={{ gap: 24 }}>
          {/* Submissions List Grid */}
          <div className="grid cols-3" style={{ gap: 12, maxHeight: "250px", overflowY: "auto", paddingRight: 6 }}>
            {submissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", gridColumn: "span 3" }}>
                <AlertCircle size={28} className="muted" style={{ opacity: 0.5, marginBottom: 8 }} />
                <p className="muted small">No submissions received yet.</p>
              </div>
            ) : null}

            {submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                className="card"
                onClick={() => setSelectedSubmissionId(submission.id)}
                style={{ 
                  textAlign: "left", 
                  background: selectedSubmission?.id === submission.id ? "rgba(99, 102, 241, 0.08)" : "rgba(0, 0, 0, 0.01)",
                  borderColor: selectedSubmission?.id === submission.id ? "var(--accent)" : "var(--border)",
                  padding: 16,
                  display: "block",
                  width: "100%",
                  cursor: "pointer",
                  borderRadius: 12,
                  boxShadow: "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <User size={13} className="muted" />
                    {submission.submittedBy?.username ?? "Unknown User"}
                  </span>
                  <span className="badge SUBMITTED" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>{submission.status}</span>
                </div>
                <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <Building2 size={12} />
                  {submission.department?.department_Name ?? "Unknown Department"}
                </div>
                <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} />
                  {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date(submission.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          {/* Submissions Detail View */}
          <div className="card stack" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            {selectedSubmission ? (
              <div className="stack" style={{ gap: 16 }}>
                <div className="field-toolbar" style={{ margin: 0, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Submission Detail</h3>
                    <p className="muted small" style={{ margin: 0, fontFamily: "monospace" }}>ID: {selectedSubmission.id}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="badge SUBMITTED">{selectedSubmission.status}</span>
                    <button
                      type="button"
                      className="ghost-button small-btn"
                      onClick={() => generateSubmissionPDF(selectedSubmission)}
                    >
                      <Download size={12} />
                      Download PDF
                    </button>
                    {!isEditingSubmission ? (
                      <button
                        type="button"
                        className="ghost-button small-btn"
                        onClick={() => {
                          setIsEditingSubmission(true);
                          const vals: Record<string, string> = {};
                          selectedSubmission.submissionValue.forEach((v) => {
                            vals[v.fieldId] = v.value;
                          });
                          setEditValues(vals);
                        }}
                      >
                        <Settings size={12} />
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ghost-button small-btn danger-text"
                        onClick={() => setIsEditingSubmission(false)}
                      >
                        <X size={12} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="small muted">
                  <div>User Name: <span style={{ color: "var(--text)", fontWeight: 600 }}>{selectedSubmission.submittedBy?.username ?? selectedSubmission.submittedById}</span></div>
                  <div>Department: <span style={{ color: "var(--text)", fontWeight: 600 }}>{selectedSubmission.department?.department_Name ?? selectedSubmission.departmentId}</span></div>
                  <div style={{ gridColumn: "span 2" }}>Submitted: <span style={{ color: "var(--text)" }}>{selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : "-"}</span></div>
                </div>

                {isEditingSubmission ? (
                  <div className="stack" style={{ gap: 16 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                      <button
                        type="button"
                        disabled={editSubmissionMutation.isPending}
                        onClick={() => {
                          const payloadValues = Object.entries(editValues).map(([fieldId, value]) => ({
                            fieldId,
                            value,
                          }));
                          editSubmissionMutation.mutate({ id: selectedSubmission.id, values: payloadValues });
                        }}
                      >
                        <Save size={16} />
                        {editSubmissionMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setIsEditingSubmission(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    {sections.map((section) => (
                      <div key={section.id} className="stack" style={{ gap: 12, background: "rgba(0,0,0,0.01)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text)" }}>{section.title}</h4>
                        {section.fields.map((field) => {
                          const val = editValues[field.id] ?? "";
                          return (
                            <label key={field.id} className="stack small" style={{ gap: 6 }}>
                              <span style={{ fontWeight: 500, color: "var(--text)" }}>{field.label}</span>
                              {field.fieldType === "TEXTAREA" ? (
                                <textarea
                                  value={val}
                                  onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                                />
                              ) : field.fieldType === "SELECT" ? (
                                <select
                                  value={val}
                                  onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                                >
                                  <option value="">Select option...</option>
                                  {field.options.map((opt) => (
                                    <option key={opt.id} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : "text"}
                                  value={val}
                                  onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    <SubmissionSectionsView sections={submissionSections} emptyMessage="This submission does not contain any values." />
                  </div>
                )}

                {/* Edit History logs */}
                {!isEditingSubmission && selectedSubmission.editHistories && selectedSubmission.editHistories.length > 0 ? (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 16 }} className="stack">
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>
                      <Clock size={14} className="muted" />
                      Admin Edit History
                    </h4>
                    <div className="stack" style={{ gap: 10 }}>
                      {selectedSubmission.editHistories.map((history) => {
                        let changesList: Array<{ fieldLabel: string; oldValue: string; newValue: string }> = [];
                        try {
                          changesList = JSON.parse(history.changedValues);
                        } catch (e) {}

                        return (
                          <div key={history.id} style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border)", padding: 12, borderRadius: 8 }} className="small">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontWeight: 600 }}>Edited by: {history.editedBy?.username || "Admin"}</span>
                              <span className="muted">{new Date(history.editedAt).toLocaleString()}</span>
                            </div>
                            <div className="stack" style={{ gap: 4 }}>
                              {changesList.map((ch, idx) => (
                                <div key={idx} className="muted">
                                  <strong>{ch.fieldLabel}:</strong> <span style={{ textDecoration: "line-through" }}>"{ch.oldValue}"</span> &rarr; <span style={{ color: "var(--text)" }}>"{ch.newValue}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }} className="muted">
                <AlertCircle size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p className="small">Select a submission receipt from the left sidebar to inspect response values.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Delete Form Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete form"
        description={`Are you sure you want to delete form "${form.title}"? This action is permanent and deletes all associated user submissions.`}
        confirmLabel="Delete Form"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        busy={deleteMutation.isPending}
        tone="danger"
      />
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
      label: `${field.label} • ${getFieldTypeLabel(field.fieldType)}`,
      value: valuesByFieldId.get(field.id) ?? "No response",
    })),
  }));
}
