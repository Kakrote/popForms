import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { formsApi } from "../../lib/api";
import type { Form } from "../../types";

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  const forms = formsQuery.data ?? [];
  const totalSubmissions = forms.reduce((sum, form) => sum + (Array.isArray(form.submissions) ? form.submissions.length : 0), 0);
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
                      <td>{Array.isArray(form.fields) ? form.fields.length : 0}</td>
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
