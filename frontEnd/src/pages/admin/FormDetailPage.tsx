import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formsApi } from "../../lib/api";
import type { Submission } from "../../types";

export function FormDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

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
      navigate("/admin");
    },
  });

  const form = formQuery.data;
  const submissions = (form?.submissions as Submission[] | undefined) ?? [];

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? submissions[0],
    [selectedSubmissionId, submissions]
  );

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
          <button type="button" className="ghost-button" onClick={() => deleteMutation.mutate()}>
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
          <p className="muted">Fields: {form.fields.length}</p>
          <p className="muted">Submissions: {submissions.length}</p>
          <div className="notice">
            <strong>Share link</strong>
            <div className="small">{shareLink}</div>
          </div>
        </section>

        <section className="panel stack">
          <h2>Fields</h2>
          {form.fields.length === 0 ? <p className="muted">This form does not have any fields yet.</p> : null}
          <div className="stack">
            {form.fields.map((field) => (
              <div className="card" key={field.id}>
                <strong>{field.label}</strong>
                <p className="muted small">{field.fieldType}</p>
                {field.options.length > 0 ? <p className="small">Options: {field.options.map((option) => option.label).join(", ")}</p> : null}
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
                  <div className="stack">
                    {selectedSubmission.submissionValue.map((value) => (
                      <div className="field-card" key={value.id}>
                        <strong>{value.field?.label ?? value.fieldId}</strong>
                        <p className="muted">{value.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="muted">Select a submission to inspect it.</p>
            )}
          </div>
        </div>
      </section>

      <Link to="/admin" className="muted small">
        Back to dashboard
      </Link>
    </div>
  );
}
