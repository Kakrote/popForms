import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import ConfirmDialog from "../components/ConfirmDialog";
import { departmentApi, formsApi, submissionsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { FormField } from "../types";

type SubmissionValues = Record<string, string>;

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
  const user = useAuthStore((state) => state.user);
  const [pendingFinalSubmission, setPendingFinalSubmission] = useState<{
    formId: string;
    departmentId: string;
    values: Array<{ fieldId: string; value: string }>;
  } | null>(null);

  const formQuery = useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => formsApi.getBySlug(slug as string),
    enabled: Boolean(slug && token),
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
    },
  });

  if (!token || !user) {
    return (
      <div className="center-page">
        <div className="auth-card stack">
          <p className="eyebrow">Form access</p>
          <h1>Sign in first</h1>
          <p className="muted">This demo uses authenticated submissions. Log in, then open the shared form link again.</p>
          <Link to="/login" className="ghost-button" style={{ display: "inline-block", padding: "0.85rem 1rem", borderRadius: 12 }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (formQuery.isLoading) {
    return <div className="page"><p className="muted">Loading form...</p></div>;
  }

  if (formQuery.isError || !formQuery.data) {
    return <div className="page"><p className="error">Unable to load the form.</p></div>;
  }

  const existingStatus = existingSubmissionQuery.data?.status;
  const isAlreadySubmitted = existingStatus === "SUBMITTED";

  return (
    <div className="page">
      <div className="panel stack">
        <div className="topbar">
          <div>
            <p className="eyebrow">Shared form</p>
            <h1>{formQuery.data.title}</h1>
            <p className="muted">{formQuery.data.description || "Please complete this form and submit it once."}</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link to="/app" className="ghost-button" style={{ padding: "0.6rem 0.85rem" }}>
              Go to dashboard
            </Link>
            <span className={`badge ${formQuery.data.isOpen ? "open" : "closed"}`}>{formQuery.data.isOpen ? "Open" : "Closed"}</span>
          </div>
        </div>

        {departmentQuery.isError ? <p className="error">You need a department assigned before submitting this form.</p> : null}

        <form
          className="stack"
          onSubmit={form.handleSubmit((values) => {
            if (!departmentQuery.data) {
              return;
            }

            setPendingFinalSubmission({
              formId: formQuery.data.id,
              departmentId: departmentQuery.data.id,
              values: fields.map((field) => ({
                fieldId: field.id,
                value: values[field.id] ?? "",
              })),
            });
          })}
        >
          {existingStatus === "DRAFT" ? <div className="notice">Draft found. You can edit and submit when ready.</div> : null}
          {isAlreadySubmitted ? <div className="notice">This form is already submitted. It is now read-only.</div> : null}

          <div className="form-section">
            {sections.map((section) => (
              <div className="field-card stack" key={section.id}>
                <div className="field-toolbar">
                  <div>
                    <strong>{section.title}</strong>
                    {section.description ? <p className="muted small">{section.description}</p> : null}
                  </div>
                  <span className="badge">{section.fields.length} fields</span>
                </div>

                <div className="stack">
                  {section.fields.map((field) => (
                    <FieldInput key={field.id} field={field} control={form.control} register={form.register} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {submitMutation.isError ? <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>{(submitMutation.error as Error).message}</div> : null}
          {draftMutation.isError ? <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>{(draftMutation.error as Error).message}</div> : null}

          <div style={{ marginBottom: 8 }}>
            <p className="muted small">Choose one: save a draft to continue later, or submit final to complete your response.</p>
          </div>

          <div className="actions-row">
            <button
              type="button"
              disabled={draftMutation.isPending || submitMutation.isPending || departmentQuery.isLoading || departmentQuery.isError || !formQuery.data.isOpen || isAlreadySubmitted}
              onClick={() => {
                if (!departmentQuery.data) {
                  return;
                }

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
              {draftMutation.isPending ? "Saving draft..." : "Save draft"}
            </button>

            <button type="submit" disabled={submitMutation.isPending || draftMutation.isPending || departmentQuery.isLoading || departmentQuery.isError || !formQuery.data.isOpen || isAlreadySubmitted}>
              {submitMutation.isPending ? "Submitting..." : "Final submit"}
            </button>
          </div>
        </form>

        <ConfirmDialog
          open={Boolean(pendingFinalSubmission)}
          title="Confirm final submission"
          description="Review your answers one last time. Final submit will lock this response and replace any draft for this form."
          confirmLabel="Submit now"
          onCancel={() => setPendingFinalSubmission(null)}
          onConfirm={() => {
            if (!pendingFinalSubmission) return;
            submitMutation.mutate(pendingFinalSubmission);
          }}
          busy={submitMutation.isPending}
          tone="danger"
        />
      </div>
    </div>
  );
}

function FieldInput({
  field,
  control,
  register,
}: {
  field: FormField;
  control: ReturnType<typeof useForm<SubmissionValues>>["control"];
  register: ReturnType<typeof useForm<SubmissionValues>>["register"];
}) {
  const baseProps = register(field.id);

  switch (field.fieldType) {
    case "TEXTAREA":
      return (
        <label className="stack small">
          {field.label}
          <textarea {...baseProps} placeholder={field.placeholder ?? "Type your answer"} />
        </label>
      );
    case "SELECT":
      return (
        <label className="stack small">
          {field.label}
          <select {...baseProps} defaultValue="">
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
        <div className="stack small field-card">
          <strong>{field.label}</strong>
          <div className="stack">
            {field.options.length > 0 ? (
              field.options.map((option) => (
                <label key={option.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="radio" value={option.value} {...baseProps} style={{ width: 18, height: 18 }} />
                  {option.label}
                </label>
              ))
            ) : (
              <input {...baseProps} placeholder={field.placeholder ?? "Type your answer"} />
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
            <label className="stack small field-card" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
              <input
                type="checkbox"
                checked={controllerField.value === "true"}
                onChange={(event) => controllerField.onChange(event.target.checked ? "true" : "false")}
                style={{ width: 18, height: 18 }}
              />
              <span>{field.label}</span>
            </label>
          )}
        />
      );
    default:
      return (
        <label className="stack small">
          {field.label}
          <input type={field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : field.fieldType === "EMAIL" ? "email" : "text"} {...baseProps} placeholder={field.placeholder ?? "Type your answer"} />
        </label>
      );
  }
}
