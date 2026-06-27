import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import ConfirmDialog from "../components/ConfirmDialog";
import universityLogo from "../public/university.png";
import logo from "../public/logo.png";
import { authApi, departmentApi, formsApi, submissionsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { FormField, LoginFormValues } from "../types";
import Modal from "../components/Modal";
import { 
  ArrowLeft, 
  Bookmark, 
  Send, 
  Calendar, 
  ShieldAlert, 
  Info, 
  Check,
  Building2,
  AlertTriangle,
  Mail,
  Key
} from "lucide-react";

type SubmissionValues = Record<string, string>;

const QUESTION_COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#a855f7", "#ec4899"];

function buildSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.id] = field.required
      ? z.string().min(1, `${field.label} is required`)
      : z.string();
  }

  return z.object(shape) as z.ZodType<SubmissionValues>;
}

export function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingFinalSubmission, setPendingFinalSubmission] = useState<{
    formId: string;
    departmentId: string;
    values: Array<{ fieldId: string; value: string }>;
  } | null>(null);

  const formQuery = useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => formsApi.getBySlug(slug as string),
    enabled: Boolean(slug),
  });

  const existingSubmissionQuery = useQuery({
    queryKey: ["my-submission-by-form", formQuery.data?.id],
    queryFn: () => submissionsApi.getMineByForm(formQuery.data!.id),
    enabled: Boolean(formQuery.data?.id && token),
  });

  const departmentQuery = useQuery({
    queryKey: ["current-department"],
    queryFn: departmentApi.current,
    enabled: Boolean(token),
  });

  const sections = formQuery.data?.sections ?? [];
  const fields = useMemo(() => sections.flatMap((section) => section.fields), [sections]);
  const submissionSchema = useMemo(() => buildSchema(fields), [fields]);
  
  const existingValuesMap = useMemo(() => {
    const values = existingSubmissionQuery.data?.submissionValue ?? [];
    return values.reduce<Record<string, string>>((accumulator, value) => {
      accumulator[value.fieldId] = value.value;
      return accumulator;
    }, {});
  }, [existingSubmissionQuery.data]);

  const defaultValues = useMemo(() => {
    return fields.reduce<SubmissionValues>((accumulator, field) => {
      accumulator[field.id] = existingValuesMap[field.id] ?? "";
      return accumulator;
    }, {});
  }, [existingValuesMap, fields]);

  const form = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema as any) as any,
    defaultValues,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: `/forms/${slug}` } });
    }
  }, [token, navigate, slug]);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const submitMutation = useMutation({
    mutationFn: submissionsApi.create,
    onSuccess: async () => {
      setPendingFinalSubmission(null);
      await queryClient.invalidateQueries({ queryKey: ["public-form", slug] });
      await queryClient.invalidateQueries({ queryKey: ["my-submission-by-form", formQuery.data?.id] });
      navigate("/thank-you", { replace: true });
    },
  });

  const draftMutation = useMutation({
    mutationFn: submissionsApi.saveDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-submission-by-form", formQuery.data?.id] });
      alert("Draft saved successfully.");
    },
  });



  if (formQuery.isLoading) {
    return <div className="page"><p className="muted">Loading form details...</p></div>;
  }

  if (formQuery.isError || !formQuery.data) {
    return <div className="page"><p className="error">Unable to load the form.</p></div>;
  }

  const existingStatus = existingSubmissionQuery.data?.status;
  const isAlreadySubmitted = existingStatus === "SUBMITTED";
  const deadlineDate = formQuery.data.deadline ? new Date(formQuery.data.deadline) : null;
  const isClosed = !formQuery.data.isOpen || Boolean(deadlineDate && deadlineDate < new Date());

  return (
    <div className="page" style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ flex: 1 }} className="stack">
        
        {/* Back Link */}
        <div>
          <button 
            type="button" 
            className="ghost-button small-btn" 
            onClick={() => navigate("/dashboard")}
            id="back-dashboard-btn"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        </div>

        {/* Form Container split layout */}
        <form
          onSubmit={form.handleSubmit((values) => {
            if (!departmentQuery.data) return;

            setPendingFinalSubmission({
              formId: formQuery.data.id,
              departmentId: departmentQuery.data.id,
              values: fields.map((field) => ({
                fieldId: field.id,
                value: values[field.id] ?? "",
              })),
            });
          })}
          className="split"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}
        >
          {/* LEFT COLUMN: META & STATUS & ACTIONS (STICKY) */}
          <div style={{ position: "sticky", top: "24px" }} className="stack">
            <div className="panel stack" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <img 
                  src={universityLogo} 
                  alt="Uttaranchal University Logo" 
                  style={{ maxWidth: "100%", maxHeight: "48px", objectFit: "contain" }} 
                />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{
                    background: "#fff",
                    borderRadius: "4px",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow)",
                    overflow: "hidden"
                  }}>
                    <img src={logo} alt="PRAGATI Icon" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 1 }} />
                  </div>
                  <p className="eyebrow" style={{ margin: 0 }}>PRAGATI Shared Questionnaire</p>
                </div>
                <h1 style={{ fontSize: "1.6rem", margin: "4px 0 8px 0" }}>{formQuery.data.title}</h1>
                <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
                  {formQuery.data.description || "Please answer all sections to complete this form."}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {deadlineDate ? (
                  <span className="badge" style={{ gap: 6, fontSize: "0.75rem" }}>
                    <Calendar size={12} />
                    Deadline: {deadlineDate.toLocaleDateString()}
                  </span>
                ) : null}
                <span className={`badge ${formQuery.data.isOpen ? "open" : "closed"}`} style={{ fontSize: "0.75rem" }}>
                  {formQuery.data.isOpen ? "Accepting Responses" : "Closed"}
                </span>
              </div>

              {token && departmentQuery.data && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.02)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }} className="small muted">
                  <Building2 size={14} className="muted" />
                  Responding on behalf of: <div style={{ color: "var(--text)", fontWeight: 600, marginTop: 2 }}>{departmentQuery.data.department_Name}</div>
                </div>
              )}

              {/* Status Notices */}
              {existingStatus === "DRAFT" ? (
                <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span className="small">Draft submission loaded. You can update and submit when ready.</span>
                </div>
              ) : null}

              {isAlreadySubmitted ? (
                <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)", padding: 12 }}>
                  <Check size={16} style={{ flexShrink: 0 }} />
                  <span className="small">You have already submitted this form. It is now read-only.</span>
                </div>
              ) : null}

              {isClosed && !isAlreadySubmitted && (
                <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span className="small">This form is closed and no longer accepting submissions.</span>
                </div>
              )}

              {token && departmentQuery.isError && (
                <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span className="small">Active department assignment required. Please contact an Admin.</span>
                </div>
              )}

              {!token && (
                <div className="notice" style={{ display: "flex", flexDirection: "column", gap: 10, borderColor: "rgba(99, 102, 241, 0.2)", background: "rgba(99, 102, 241, 0.05)", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Info size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <span className="small">Viewing in preview mode. Sign in to submit responses.</span>
                  </div>
                  <button 
                    id="top-login-trigger-btn"
                    type="button" 
                    className="ghost-button small-btn" 
                    onClick={() => setShowLoginModal(true)}
                    style={{ width: "100%" }}
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Form Actions (Sticky inside Meta Panel) */}
              {!isAlreadySubmitted && !isClosed && token && (
                <div className="form-actions-wrapper stack">
                  <p className="muted small form-actions-tip" style={{ margin: 0, lineHeight: 1.4 }}>
                    Save drafts as you fill out questions, and execute Final Submit when finished.
                  </p>
                  
                  <div className="form-actions-buttons">
                    <button
                      id="draft-submit-btn"
                      type="button"
                      className="ghost-button"
                      disabled={draftMutation.isPending || submitMutation.isPending || departmentQuery.isLoading || departmentQuery.isError}
                      onClick={() => {
                        if (!departmentQuery.data) return;

                        const values = form.getValues();

                        draftMutation.mutate({
                          formId: formQuery.data.id,
                          departmentId: departmentQuery.data.id,
                          values: fields.map((field) => ({
                            fieldId: field.id,
                            value: values[field.id] ?? "",
                          })),
                        });
                      }}
                    >
                      <Bookmark size={16} />
                      {draftMutation.isPending ? "Saving Draft..." : "Save Draft"}
                    </button>

                    <button 
                      id="final-submit-btn"
                      type="submit" 
                      disabled={submitMutation.isPending || draftMutation.isPending || departmentQuery.isLoading || departmentQuery.isError}
                    >
                      <Send size={16} />
                      {submitMutation.isPending ? "Submitting..." : "Final Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: QUESTIONS & SECTIONS */}
          <div className="stack" style={{ gap: 24 }}>
            {sections.map((section, sectionIndex) => {
              const questionColor = QUESTION_COLORS[sectionIndex % QUESTION_COLORS.length];
              return (
                <div key={section.id} className="stack" style={{ gap: 14 }}>
                  
                  {/* Section Headers */}
                  {(section.headerLabel || section.headerDescription) && (
                    <div 
                      className="section-separator stack" 
                      style={{ 
                        marginTop: sectionIndex === 0 ? 0 : 20, 
                        marginBottom: 4, 
                        padding: "16px 20px", 
                        background: "rgba(0, 0, 0, 0.02)", 
                        borderRadius: "12px",
                        borderLeft: `4px solid ${questionColor}`
                      }}
                    >
                      {section.headerLabel && <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text)" }}>{section.headerLabel}</h2>}
                      {section.headerDescription && <p className="muted small" style={{ margin: "4px 0 0 0" }}>{section.headerDescription}</p>}
                    </div>
                  )}

                  {/* Section Card */}
                  <div
                    className="field-card stack"
                    style={{ 
                      borderLeft: `5px solid ${questionColor}`, 
                      background: "var(--surface)",
                      gap: 20
                    }}
                  >
                    <div className="field-toolbar" style={{ margin: 0, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <strong style={{ color: questionColor, fontSize: "1.05rem" }}>{section.title}</strong>
                        {section.description ? <p className="muted small" style={{ margin: "4px 0 0 0" }}>{section.description}</p> : null}
                      </div>
                      <span className="badge small">{section.fields.length} {section.fields.length === 1 ? "field" : "fields"}</span>
                    </div>

                    <div className="stack" style={{ gap: 18 }}>
                      {section.fields.map((field) => (
                        <FieldInput 
                          key={field.id} 
                          field={field} 
                          control={form.control} 
                          register={form.register} 
                          disabled={isAlreadySubmitted || isClosed || !token}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(pendingFinalSubmission)}
          title="Confirm final submission"
          description="Are you sure you want to finalize your answers? This locks your response receipt and replaces any previously saved draft."
          confirmLabel="Submit Response"
          onCancel={() => setPendingFinalSubmission(null)}
          onConfirm={() => {
            if (!pendingFinalSubmission) return;
            submitMutation.mutate(pendingFinalSubmission);
          }}
          busy={submitMutation.isPending}
          tone="danger"
        />

        {/* Login Modal */}
        <Modal 
          open={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          title="Sign In to Respond"
        >
          <LoginModalContent 
            onSuccess={async (data) => {
              setSession(data);
              await queryClient.invalidateQueries({ queryKey: ["public-form", slug] });
              await queryClient.invalidateQueries({ queryKey: ["my-submission-by-form", formQuery.data?.id] });
              await queryClient.invalidateQueries({ queryKey: ["current-department"] });
              setShowLoginModal(false);
            }} 
          />
        </Modal>
      </div>
      <footer style={{ 
        textAlign: "center", 
        padding: "20px 0", 
        fontSize: "0.8rem",
        color: "var(--text)",
        opacity: 0.6,
        width: "100%",
        borderTop: "1px solid var(--border)",
        marginTop: "40px"
      }}>
        &copy; Uttaranchal University developed by IQAC
      </footer>
    </div>
  );
}

function FieldInput({
  field,
  control,
  register,
  disabled,
}: {
  field: FormField;
  control: ReturnType<typeof useForm<SubmissionValues>>["control"];
  register: ReturnType<typeof useForm<SubmissionValues>>["register"];
  disabled?: boolean;
}) {
  const baseProps = register(field.id);

  const labelElement = (
    <span style={{ fontWeight: 500, color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {field.label}
      {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
    </span>
  );

  switch (field.fieldType) {
    case "TEXTAREA":
      return (
        <label className="stack small" style={{ gap: 6 }}>
          {labelElement}
          <textarea 
            id={`field-input-${field.id}`}
            {...baseProps} 
            placeholder={field.placeholder ?? "Type your response here"} 
            disabled={disabled}
          />
        </label>
      );
    case "SELECT":
      return (
        <label className="stack small" style={{ gap: 6 }}>
          {labelElement}
          <select 
            id={`field-input-${field.id}`}
            {...baseProps} 
            defaultValue=""
            disabled={disabled}
          >
            <option value="">Select an option</option>
            {field.options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "RADIO":
      return (
        <div className="stack small field-card" style={{ gap: 12, background: "rgba(0,0,0,0.01)" }}>
          <strong>{field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}</strong>
          <div className="stack" style={{ gap: 10 }}>
            {field.options.length > 0 ? (
              field.options.map((option) => (
                <label key={option.id} className="preview-option" style={{ cursor: disabled ? "default" : "pointer" }}>
                  <input 
                    id={`field-input-${field.id}-${option.id}`}
                    type="radio" 
                    value={option.value} 
                    {...baseProps} 
                    style={{ width: 16, height: 16 }}
                    disabled={disabled}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            ) : (
              <input 
                id={`field-input-${field.id}`}
                {...baseProps} 
                placeholder={field.placeholder ?? "Type your response here"} 
                disabled={disabled}
              />
            )}
          </div>
        </div>
      );
    case "CHECKBOX":
      return (
        <Controller
          control={control}
          name={field.id}
          render={({ field: controllerField }) => (
            <label className="stack small field-card" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.01)", cursor: disabled ? "default" : "pointer" }}>
              <input
                id={`field-input-${field.id}`}
                type="checkbox"
                checked={controllerField.value === "true"}
                onChange={(event) => controllerField.onChange(event.target.checked ? "true" : "false")}
                style={{ width: 18, height: 18 }}
                disabled={disabled}
              />
              <span style={{ fontWeight: 500, color: "var(--text)" }}>{field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}</span>
            </label>
          )}
        />
      );
    default:
      return (
        <label className="stack small" style={{ gap: 6 }}>
          {labelElement}
          <input 
            id={`field-input-${field.id}`}
            type={field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : field.fieldType === "EMAIL" ? "email" : "text"} 
            {...baseProps} 
            placeholder={field.placeholder ?? "Type your response here"} 
            disabled={disabled}
          />
        </label>
      );
  }
}

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginModalContent({ onSuccess }: { onSuccess: (data: any) => void }) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      onSuccess(data);
    },
  });

  return (
    <form 
      id="modal-login-form"
      className="stack" 
      onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
      style={{ gap: 14 }}
    >
      <p className="muted small" style={{ margin: 0, marginBottom: 4 }}>
        Use your credentials to sign in and begin filling out this questionnaire.
      </p>

      <div className="stack" style={{ gap: 14 }}>
        <label className="stack small" style={{ gap: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
            <Mail size={14} className="muted" />
            Email Address
          </span>
          <input 
            id="modal-login-email"
            type="email" 
            {...form.register("email")} 
            placeholder="user@example.com" 
            style={{ paddingLeft: 14 }}
          />
          {form.formState.errors.email ? <span className="error">{form.formState.errors.email.message}</span> : null}
        </label>

        <label className="stack small" style={{ gap: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--text)" }}>
            <Key size={14} className="muted" />
            Password
          </span>
          <input 
            id="modal-login-password"
            type="password" 
            {...form.register("password")} 
            placeholder="••••••••" 
            style={{ paddingLeft: 14 }}
          />
          {form.formState.errors.password ? <span className="error">{form.formState.errors.password.message}</span> : null}
        </label>
      </div>

      {loginMutation.isError ? (
        <div 
          className="notice error-notice"
          style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span className="small">{(loginMutation.error as Error).message}</span>
        </div>
      ) : null}

      <button 
        id="modal-login-submit-btn"
        type="submit" 
        disabled={loginMutation.isPending}
        style={{ width: "100%", marginTop: 12, padding: "0.85rem" }}
      >
        {loginMutation.isPending ? "Signing in..." : "Login & Continue"}
      </button>
    </form>
  );
}
