import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { departmentApi, submissionsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Modal from "../components/Modal";
import { SubmissionSectionsView, type SubmissionSectionView } from "../components/SubmissionSectionsView";
import { getFieldTypeLabel } from "../components/fieldTypeLabels";
import type { Submission } from "../types";

export function UserLandingPage() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const departmentQuery = useQuery({
    queryKey: ["current-department"],
    queryFn: departmentApi.current,
    enabled: Boolean(user),
  });

  const mySubmissionsQuery = useQuery({
    queryKey: ["my-submissions"],
    queryFn: submissionsApi.mine,
    enabled: Boolean(user),
  });

  const myDraftsQuery = useQuery({
    queryKey: ["my-drafts"],
    queryFn: submissionsApi.mineDrafts,
    enabled: Boolean(user),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => submissionsApi.delete(id),
    onSuccess: () => {
      // refresh both lists
      myDraftsQuery.refetch();
      mySubmissionsQuery.refetch();
      setPendingDeleteDraftId(null);
    },
  });

  const submissions = mySubmissionsQuery.data ?? [];

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [pendingDeleteDraftId, setPendingDeleteDraftId] = useState<string | null>(null);

  const selectedSubmissionSections = useMemo(() => (selectedSubmission ? mapSubmissionSections(selectedSubmission) : []), [selectedSubmission]);

  return (
    <div className="page">
      <div className="panel stack">
        <div className="topbar">
          <div>
            <p className="eyebrow">User home</p>
            <h1>Welcome, {user?.username}</h1>
            <p className="muted">Open the shared form link from your admin to submit a response.</p>
          </div>
          <div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                clearSession();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid cols-2">
          <div className="card stack">
            <strong>Account</strong>
            <p className="muted">Role: {user?.role}</p>
            <p className="muted">Email: {user?.email}</p>
          </div>
          <div className="card stack">
            <strong>Department</strong>
            {departmentQuery.isLoading ? <p className="muted">Loading department...</p> : null}
            {departmentQuery.data ? <p className="muted">{departmentQuery.data.department_Name}</p> : null}
            {departmentQuery.isError ? <p className="error">This account is not attached to a department yet.</p> : null}
          </div>
        </div>

        <section className="panel stack">
          <div className="field-toolbar">
            <div>
              <h2>My submissions</h2>
              <p className="muted">Read-only history of the forms you submitted.</p>
            </div>
            <span className="badge">Read only</span>
          </div>

          {mySubmissionsQuery.isLoading ? <p className="muted">Loading your submissions...</p> : null}
          {mySubmissionsQuery.isError ? <p className="error">Unable to load your submissions right now.</p> : null}
          {!mySubmissionsQuery.isLoading && submissions.length === 0 ? <p className="muted">You have not submitted any forms yet.</p> : null}

          {submissions.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Status</th>
                    <th>Submitted at</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>{submission.form?.title ?? submission.formId}</td>
                      <td>
                        {submission.submissionValue && submission.submissionValue.length > 0
                          ? submission.submissionValue.slice(0, 2).map((v) => `${v.field?.label ?? v.fieldId}: ${v.value}`).join(" — ")
                          : "—"}
                      </td>
                      <td>
                        <span className="badge">{submission.status}</span>
                      </td>
                      <td>{new Date(submission.submittedAt ?? submission.createdAt).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={async () => {
                            const detail = await submissionsApi.getMineByForm(submission.formId);
                            if (detail) setSelectedSubmission(detail);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <Modal open={Boolean(selectedSubmission)} onClose={() => setSelectedSubmission(null)} title={selectedSubmission ? `Submission • ${selectedSubmission.id}` : "Submission details"}>
          {selectedSubmission ? (
            <div>
              <div className="field-card" style={{ marginBottom: 14 }}>
                <strong>Submission summary</strong>
                <div className="muted small">Form: {selectedSubmission.form?.title ?? selectedSubmission.formId}</div>
                <div className="muted small">Submitted by: {selectedSubmission.submittedBy?.username ?? selectedSubmission.submittedById} ({selectedSubmission.submittedBy?.email ?? "no-email"})</div>
                <div className="muted small">Department: {selectedSubmission.department?.department_Name ?? selectedSubmission.departmentId}</div>
                <div className="muted small">Status: {selectedSubmission.status}</div>
                <div className="muted small">Submitted at: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : "-"}</div>
              </div>

              <SubmissionSectionsView sections={selectedSubmissionSections} emptyMessage="This submission does not contain any values." />
            </div>
          ) : null}
        </Modal>

        <ConfirmDialog
          open={Boolean(pendingDeleteDraftId)}
          title="Delete draft"
          description="Delete this draft? This cannot be undone and you will need to recreate it from scratch."
          confirmLabel="Delete draft"
          onCancel={() => setPendingDeleteDraftId(null)}
          onConfirm={() => {
            if (!pendingDeleteDraftId) return;
            deleteDraftMutation.mutate(pendingDeleteDraftId);
          }}
          busy={deleteDraftMutation.isPending}
          tone="danger"
        />

        <section className="panel stack">
          <div className="field-toolbar">
            <div>
              <h2>Drafts</h2>
              <p className="muted">Draft submissions you can edit or delete.</p>
            </div>
            <span className="badge">Editable</span>
          </div>

          {myDraftsQuery.isLoading ? <p className="muted">Loading drafts...</p> : null}
          {myDraftsQuery.isError ? <p className="error">Unable to load drafts right now.</p> : null}
          {!myDraftsQuery.isLoading && (myDraftsQuery.data ?? []).length === 0 ? <p className="muted">No drafts at the moment.</p> : null}

          {(myDraftsQuery.data ?? []).length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Last updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(myDraftsQuery.data ?? []).map((draft) => (
                    <tr key={draft.id}>
                      <td>{draft.form?.title ?? draft.formId}</td>
                      <td>{new Date(draft.updatedAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" onClick={() => (window.location.href = `/forms/${draft.form?.slug}`)}>Edit</button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setPendingDeleteDraftId(draft.id)}
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
        </section>
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
