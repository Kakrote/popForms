import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import ConfirmDialog from "../components/ConfirmDialog";
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
    <div className="page" style={{ maxWidth: "800px" }}>
      <div className="stack" style={{ gap: 24 }}>
        
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

        {/* Form Meta Panel */}
        <div className="panel stack" style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)" }}>
          <div className="topbar" style={{ margin: 0 }}>
            <div>
              <p className="eyebrow">Shared Questionnaire</p>
              <h1 style={{ fontSize: "1.75rem", margin: "4px 0" }}>{formQuery.data.title}</h1>
              <p className="muted small" style={{ margin: 0 }}>
                {formQuery.data.description || "Please answer all sections below before finalizing."}
              </p>
            </div>
            
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              {deadlineDate ? (
                <span className="badge" style={{ gap: 6 }}>
                  <Calendar size={12} />
                  Deadline: {deadlineDate.toLocaleDateString()}
                </span>
              ) : null}
              <span className={`badge ${formQuery.data.isOpen ? "open" : "closed"}`}>
                {formQuery.data.isOpen ? "Accepting Responses" : "Closed"}
              </span>
            </div>
          </div>

          {!token && (
            <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, borderColor: "rgba(99, 102, 241, 0.2)", background: "rgba(99, 102, 241, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Info size={18} style={{ color: "var(--accent)" }} />
                <span>You are viewing this form in preview mode. Sign in to start responding.</span>
              </div>
              <button 
                id="top-login-trigger-btn"
                type="button" 
                className="ghost-button small-btn" 
                onClick={() => setShowLoginModal(true)}
              >
                Sign In
              </button>
            </div>
          )}

          {token && departmentQuery.isError ? (
            <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={18} />
              <span className="small">You need an active department assignment before responding. Please ask an Admin.</span>
            </div>
          ) : token && departmentQuery.data ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: 8 }} className="small muted">
              <Building2 size={14} className="muted" />
              Responding on behalf of: <span style={{ color: "#fff", fontWeight: 600 }}>{departmentQuery.data.department_Name}</span>
            </div>
          ) : null}
        </div>

        {/* Form Body */}
        <form
          className="stack"
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
          style={{ gap: 24 }}
        >
          {existingStatus === "DRAFT" ? (
            <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Info size={16} />
              <span>Draft submission found. You can resume editing and submit when ready.</span>
            </div>
          ) : null}

          {isAlreadySubmitted ? (
            <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}>
              <Check size={16} />
              <span>You have already submitted this form. It is now read-only.</span>
            </div>
          ) : null}

          {/* Render Sections */}
          <div className="form-section">
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
                        background: "rgba(255, 255, 255, 0.02)", 
                        borderRadius: "12px",
                        borderLeft: `4px solid ${questionColor}`
                      }}
                    >
                      {section.headerLabel && <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#ffffff" }}>{section.headerLabel}</h2>}
                      {section.headerDescription && <p className="muted small" style={{ margin: "4px 0 0 0" }}>{section.headerDescription}</p>}
                    </div>
                  )}

                  {/* Section Card */}
                  <div
                    className="field-card stack"
                    style={{ 
                      borderLeft: `5px solid ${questionColor}`, 
                      background: "rgba(15, 22, 40, 0.5)",
                      gap: 20
                    }}
                  >
                    <div className="field-toolbar" style={{ margin: 0, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
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

          {/* Form Actions */}
          {!isAlreadySubmitted && !isClosed && (
            token ? (
              <div className="panel stack" style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)", gap: 14 }}>
                <div>
                  <p className="muted small" style={{ margin: 0 }}>
                    You can save a temporary draft to complete this questionnaire later, or finalize it now. Final submit locks response values.
                  </p>
                </div>

                <div className="actions-row">
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
            ) : (
              <div className="panel stack" style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)", gap: 14, alignItems: "center", textAlign: "center" }}>
                <div>
                  <p className="muted small" style={{ margin: 0, marginBottom: 8 }}>
                    You must be logged in to submit this questionnaire.
                  </p>
                </div>
                <button
                  id="form-login-trigger-btn"
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  style={{ padding: "0.75rem 2rem" }}
                >
                  Sign In to Respond
                </button>
              </div>
            )
          )}

          {isClosed && !isAlreadySubmitted && (
            <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={18} />
              <span>This form is closed and no longer accepting response entries.</span>
            </div>
          )}
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
    <span style={{ fontWeight: 500, color: "#fff", display: "inline-flex", alignItems: "center", gap: 4 }}>
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
        <div className="stack small field-card" style={{ gap: 12, background: "rgba(255,255,255,0.01)" }}>
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
            <label className="stack small field-card" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.01)", cursor: disabled ? "default" : "pointer" }}>
              <input
                id={`field-input-${field.id}`}
                type="checkbox"
                checked={controllerField.value === "true"}
                onChange={(event) => controllerField.onChange(event.target.checked ? "true" : "false")}
                style={{ width: 18, height: 18 }}
                disabled={disabled}
              />
              <span style={{ fontWeight: 500, color: "#fff" }}>{field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}</span>
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
