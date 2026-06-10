import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import { SubmissionSectionsView, type SubmissionSectionView } from "../../components/SubmissionSectionsView";
import { getFieldTypeLabel } from "../../components/fieldTypeLabels";
import { formsApi } from "../../lib/api";
import type { Submission } from "../../types";

export function FormDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  if (formQuery.isLoading) {
    return <p className="muted">Loading form...</p>;
  }

  if (formQuery.isError || !form) {
    return <p className="error">Unable to load this form.</p>;
  }

  const shareLink = `${window.location.origin}/forms/${form.slug}`;

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Form details</p>
          <h1>{form.title}</h1>
          <p className="muted">/{form.slug}</p>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <button type="button" className="ghost-button" onClick={() => navigator.clipboard.writeText(shareLink)}>
            Copy share link
          </button>
          <button type="button" className="ghost-button" onClick={() => toggleMutation.mutate(!form.isOpen)}>
            {form.isOpen ? "Close form" : "Open form"}
          </button>
          <Link to={`/admin/forms/${form.slug}/edit`} className="ghost-button" style={{ display: "inline-flex", justifyContent: "center" }}>
            Edit form
          </Link>
          <button type="button" className="ghost-button" onClick={() => setShowDeleteConfirm(true)}>
            Delete form
          </button>
        </div>
      </div>

      <div className="grid cols-2">
        <section className="panel stack">
          <div className="field-toolbar">
            <div>
              <h2>Form overview</h2>
              <p className="muted">Share this link with users once the form is live.</p>
            </div>
            <span className={`badge ${form.isOpen ? "open" : "closed"}`}>{form.isOpen ? "Open" : "Closed"}</span>
          </div>

          <p>{form.description || "No description provided."}</p>
          <p className="muted">Questions: {sections.length}</p>
          <p className="muted">Submissions: {submissions.length}</p>
          <div className="notice">
            <strong>Share link</strong>
            <div className="small">{shareLink}</div>
          </div>
        </section>

        <section className="panel stack">
          <h2>Questions</h2>
          {sections.length === 0 ? <p className="muted">This form does not have any questions yet.</p> : null}
          <div className="stack">
            {sections.map((section) => (
              <div className="card stack" key={section.id}>
                <div className="field-toolbar">
                  <div>
                    <strong>{section.title}</strong>
                    {section.description ? <p className="muted small">{section.description}</p> : null}
                  </div>
                  <span className="badge">{section.fields.length} options</span>
                </div>

                <div className="stack">
                  {section.fields.map((field) => (
                    <div className="field-card" key={field.id}>
                      <strong>{field.label}</strong>
                      <p className="muted small">{getFieldTypeLabel(field.fieldType)}</p>
                      {field.options.length > 0 ? <p className="small">Choices: {field.options.map((option) => option.label).join(", ")}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel stack">
        <div className="field-toolbar">
          <div>
            <h2>Submissions</h2>
            <p className="muted">Pick a submission to inspect every submitted field value.</p>
          </div>
        </div>

        <div className="split">
          <div className="stack">
            {submissions.length === 0 ? <p className="muted">No submissions yet.</p> : null}
            {submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                className="card"
                onClick={() => setSelectedSubmissionId(submission.id)}
                style={{ textAlign: "left", background: selectedSubmission?.id === submission.id ? "#eef3f8" : undefined }}
              >
                <strong>{submission.submittedBy?.username ?? "Unknown user"}</strong>
                <div className="muted small">{submission.department?.department_Name ?? "Unknown department"}</div>
                <div className="muted small">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date(submission.createdAt).toLocaleString()}</div>
              </button>
            ))}
          </div>

          <div className="card stack">
            {selectedSubmission ? (
              <>
                <div className="field-toolbar">
                  <div>
                    <h3>Submission detail</h3>
                    <p className="muted small">ID: {selectedSubmission.id}</p>
                  </div>
                  <span className="badge">{selectedSubmission.status}</span>
                </div>

                <div className="stack">
                  <p className="muted small">Submitted by: {selectedSubmission.submittedBy?.username ?? selectedSubmission.submittedById}</p>
                  <p className="muted small">Department: {selectedSubmission.department?.department_Name ?? selectedSubmission.departmentId}</p>

                  <SubmissionSectionsView sections={submissionSections} emptyMessage="This submission does not contain any values." />
                </div>
              </>
            ) : (
              <p className="muted">Select a submission to inspect it.</p>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete form"
        description={`Delete ${form.title}? This cannot be undone.`}
        confirmLabel="Delete form"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        busy={deleteMutation.isPending}
        tone="danger"
      />

      <Link to="/admin" className="muted small">
        Back to dashboard
      </Link>
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
        title: "Submission values",
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
      label: `${field.label} · ${getFieldTypeLabel(field.fieldType)}`,
      value: valuesByFieldId.get(field.id) ?? "No response",
    })),
  }));
}
