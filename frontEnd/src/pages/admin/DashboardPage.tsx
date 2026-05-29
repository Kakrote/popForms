import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formsApi, submissionsApi } from "../../lib/api";
import Modal from "../../components/Modal";

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forms"] }),
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
  const submissionSections = useMemo(() => {
    if (!submissionDetail) {
      return [];
    }

    const sections = submissionDetail.form?.sections ?? [];

    const valuesByFieldId = new Map(submissionDetail.submissionValue.map((value) => [value.fieldId, value]));

    if (sections.length === 0) {
      return [
        {
          id: "__no-sections",
          title: "Submission values",
          description: null,
          fields: submissionDetail.submissionValue.map((value) => ({
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
        label: field.label,
        value: valuesByFieldId.get(field.id)?.value ?? "No response",
      })),
    }));
  }, [submissionDetail]);

  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (!submissionDetail) return;
    // start with sections collapsed by default
    setExpandedSections([]);
  }, [submissionDetail?.id]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const deleteSubmissionMutation = useMutation({
    mutationFn: (id: string) => submissionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      setSelectedSubmissionId(null);
    },
  });

  const forms = formsQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const totalSubmissions = submissions.length;
  const openForms = forms.filter((form) => form.isOpen).length;
  const closedForms = forms.length - openForms;

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p className="muted">Monitor forms and submissions from the first demo-ready build.</p>
        </div>
        <Link to="/admin/forms/new">
          <button type="button">Create form</button>
        </Link>
      </div>

      <section className="stat-grid">
        <div className="stat">
          <span className="muted">Forms</span>
          <strong>{forms.length}</strong>
        </div>
        <div className="stat">
          <span className="muted">Open</span>
          <strong>{openForms}</strong>
        </div>
        <div className="stat">
          <span className="muted">Closed</span>
          <strong>{closedForms}</strong>
        </div>
        <div className="stat">
          <span className="muted">Submissions</span>
          <strong>{totalSubmissions}</strong>
        </div>
      </section>

      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2>All submissions</h2>
            <p className="muted">Admin view contains submitted records only.</p>
          </div>
          <span className="badge">Submitted only</span>
        </div>

        {submissionsQuery.isLoading ? <p className="muted">Loading submissions...</p> : null}
        {submissionsQuery.isError ? <p className="error">Unable to load submissions right now.</p> : null}
        {!submissionsQuery.isLoading && submissions.length === 0 ? <p className="muted">No submitted records yet.</p> : null}

        {submissions.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Preview</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted at</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.form?.title ?? submission.formId}</td>
                    <td>
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
                      <span className="badge">{submission.status}</span>
                    </td>
                    <td>{new Date(submission.submittedAt ?? submission.createdAt).toLocaleString()}</td>
                    <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" className="ghost-button" onClick={() => setSelectedSubmissionId(submission.id)}>
                              View values
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => {
                                if (window.confirm("Delete this submission? This cannot be undone.")) {
                                  deleteSubmissionMutation.mutate(submission.id);
                                }
                              }}
                            >
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

        <Modal open={Boolean(selectedSubmissionId)} onClose={() => setSelectedSubmissionId(null)} title={submissionDetail ? `Submission • ${submissionDetail.id}` : "Submission details"}>
          {submissionDetailQuery.isLoading ? <p className="muted">Loading submission details...</p> : null}
          {submissionDetailQuery.isError ? <p className="error">Unable to load this submission detail.</p> : null}

          {submissionDetail ? (
            <div>
              <div className="field-card" style={{ marginBottom: 14 }}>
                <strong>Submission summary</strong>
                <div className="muted small">Form: {submissionDetail.form?.title ?? submissionDetail.formId}</div>
                <div className="muted small">Submitted by: {submissionDetail.submittedBy?.username ?? submissionDetail.submittedById}</div>
                <div className="muted small">Department: {submissionDetail.department?.department_Name ?? submissionDetail.departmentId}</div>
                <div className="muted small">Status: {submissionDetail.status}</div>
                <div className="muted small">Submitted at: {submissionDetail.submittedAt ? new Date(submissionDetail.submittedAt).toLocaleString() : "-"}</div>
              </div>

              <div className="stack">
                {submissionSections.map((section) => (
                  <div key={section.id} className="field-card">
                    <div className="field-toolbar">
                      <div>
                        <strong>{section.title}</strong>
                        {section.description ? <p className="muted small">{section.description}</p> : null}
                      </div>
                      <div>
                        <button type="button" className="link-button" onClick={() => toggleSection(section.id)}>
                          {expandedSections.includes(section.id) ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {expandedSections.includes(section.id) ? (
                      <div className="stack" style={{ marginTop: 12 }}>
                        {section.fields.map((field) => (
                          <div key={`${section.id}-${field.id}`} className="field-group-box">
                            <div className="small muted">{field.label}</div>
                            <div>{field.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this submission? This cannot be undone.")) {
                      deleteSubmissionMutation.mutate(submissionDetail.id);
                    }
                  }}
                  className="ghost-button"
                >
                  Delete submission
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      </section>

      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2>Forms</h2>
            <p className="muted">Toggle availability, inspect submissions, or share the public form link.</p>
          </div>
          <span className="badge">Admin only</span>
        </div>

        {formsQuery.isLoading ? <p className="muted">Loading forms...</p> : null}
        {formsQuery.isError ? <p className="error">Unable to load forms right now.</p> : null}

        {!formsQuery.isLoading && forms.length === 0 ? <p className="muted">No forms have been created yet.</p> : null}

        {forms.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Fields</th>
                  <th>Submissions</th>
                  <th>Share link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => {
                  const shareLink = `${window.location.origin}/forms/${form.slug}`;
                  return (
                    <tr key={form.id}>
                      <td>
                        <strong>{form.title}</strong>
                        <div className="muted small">/{form.slug}</div>
                      </td>
                      <td>
                        <span className={`badge ${form.isOpen ? "open" : "closed"}`}>{form.isOpen ? "Open" : "Closed"}</span>
                      </td>
                      <td>{Array.isArray(form.sections) ? form.sections.reduce((count, section) => count + (section.fields?.length ?? 0), 0) : 0}</td>
                      <td>{Array.isArray(form.submissions) ? form.submissions.length : 0}</td>
                      <td>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => navigator.clipboard.writeText(shareLink)}
                        >
                          Copy link
                        </button>
                      </td>
                      <td>
                        <div className="stack" style={{ gap: 8 }}>
                          <button type="button" onClick={() => navigate(`/admin/forms/${form.slug}`)}>
                            Manage
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => toggleMutation.mutate({ slug: form.slug, isOpen: !form.isOpen })}
                            disabled={toggleMutation.isPending}
                          >
                            {form.isOpen ? "Close" : "Open"}
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => deleteMutation.mutate(form.slug)}
                            disabled={deleteMutation.isPending}
                          >
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
      </section>
    </div>
  );
}
