import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import FormPreviewPanel from "../../components/FormPreviewPanel";
import { FIELD_TYPE_OPTIONS } from "../../components/fieldTypeLabels";
import { formsApi } from "../../lib/api";
import type { Form, FormBuilderValues } from "../../types";

const fieldSchema = z.object({
  label: z.string().min(1, "Field label is required"),
  type: z.enum(["text", "textarea", "number", "email", "date", "select", "radio", "checkbox"]),
  required: z.boolean(),
  optionsText: z.string(),
});

const sectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  description: z.string(),
  fields: z.array(fieldSchema).min(1, "Add at least one field to the section"),
});

const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  deadline: z.string(),
  isOpen: z.boolean(),
  sections: z.array(sectionSchema).min(1, "Add at least one section"),
}) as z.ZodType<FormBuilderValues>;

const QUESTION_COLORS = ["#1c6dd0", "#0f7a4a", "#b42318", "#d97706", "#7c3aed", "#db2777"];

export function FormBuilderPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isEditMode = Boolean(slug);

  const formQuery = useQuery({
    queryKey: ["form", slug],
    queryFn: () => formsApi.getBySlug(slug as string),
    enabled: isEditMode,
  });

  const defaultValues = useMemo<FormBuilderValues>(() => {
    if (formQuery.data) {
      return mapFormToBuilderValues(formQuery.data);
    }

    return createBlankBuilderValues();
  }, [formQuery.data]);

  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(createFormSchema as any) as any,
    defaultValues,
  });

  useEffect(() => {
    if (!isEditMode || !formQuery.data) {
      return;
    }

    form.reset(defaultValues);
  }, [defaultValues, form, formQuery.data, isEditMode]);

  const sections = useFieldArray({
    control: form.control,
    name: "sections",
  });

  const previewValues = useWatch({ control: form.control }) as FormBuilderValues | undefined;
  const currentPreviewValues = previewValues ?? defaultValues;

  const createMutation = useMutation({
    mutationFn: formsApi.create,
    onSuccess: async (createdForm) => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate(`/admin/forms/${createdForm.slug}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormBuilderValues) => formsApi.update(slug as string, payload),
    onSuccess: async (updatedForm) => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      await queryClient.invalidateQueries({ queryKey: ["form", slug] });
      navigate(`/admin/forms/${updatedForm.slug}`);
    },
  });

  if (isEditMode && formQuery.isLoading) {
    return <p className="muted">Loading form editor...</p>;
  }

  if (isEditMode && formQuery.isError) {
    return <p className="error">Unable to load this form for editing.</p>;
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const heading = isEditMode ? "Edit form" : "Create form";
  const actionLabel = isEditMode ? "Save changes" : "Create form";

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Builder</p>
          <h1>{heading}</h1>
          <p className="muted">Build the form on the left and review the final layout in the live preview on the right.</p>
        </div>
      </div>

      <div className="split">
        <form
          className="panel stack"
          onSubmit={form.handleSubmit((values) => {
            if (isEditMode) {
              updateMutation.mutate(values);
              return;
            }

            createMutation.mutate(values);
          })}
        >
          <div className="grid cols-2">
            <label className="stack small">
              Title
              <input {...form.register("title")} placeholder="Employee onboarding" />
              {form.formState.errors.title ? <span className="error">{form.formState.errors.title.message}</span> : null}
            </label>
            <label className="stack small">
              Deadline
              <input type="date" {...form.register("deadline")} />
            </label>
          </div>

          <label className="stack small">
            Description
            <textarea {...form.register("description")} placeholder="Short description for users" />
          </label>

          <label className="stack small" style={{ maxWidth: 220 }}>
            <span>Form status</span>
            <select {...form.register("isOpen", { setValueAs: (value) => value === "true" })}>
              <option value="true">Open</option>
              <option value="false">Closed</option>
            </select>
          </label>

          {isEditMode ? (
            <div className="notice">
              Editing this form will rebuild its question and option structure. That is useful for adding or moving options, but it can affect previous submission data.
            </div>
          ) : null}

          <div className="field-toolbar">
            <div>
              <h2>Questions</h2>
              <p className="muted">Each form can have multiple questions and each question can contain multiple options.</p>
            </div>
          </div>

          <div className="form-section">
            {sections.fields.map((section, index) => (
              <SectionEditor
                key={section.id}
                index={index}
                form={form}
                moveSectionUp={() => sections.move(index, index - 1)}
                moveSectionDown={() => sections.move(index, index + 1)}
                removeSection={() => sections.remove(index)}
                duplicateSection={() => {
                  const values = form.getValues(`sections.${index}`);
                  sections.insert(index + 1, {
                    ...values,
                    fields: values.fields.map(f => ({ ...f }))
                  });
                }}
                canMoveUp={index > 0}
                canMoveDown={index < sections.fields.length - 1}
                canRemove={sections.fields.length > 1}
              />
            ))}
          </div>

          <button
            type="button"
            className="ghost-button"
            style={{ width: "100%", padding: "1rem", borderStyle: "dashed", color: "var(--accent)" }}
            onClick={() =>
              sections.append({
                title: "",
                description: "",
                fields: [
                  {
                    label: "",
                    type: "text",
                    required: true,
                    optionsText: "",
                  },
                ],
              })
            }
          >
            + Add question
          </button>

          {form.formState.errors.sections ? <span className="error">{form.formState.errors.sections.message as string}</span> : null}
          {createMutation.isError ? (
            <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>
              {(createMutation.error as Error).message}
            </div>
          ) : null}
          {updateMutation.isError ? (
            <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>
              {(updateMutation.error as Error).message}
            </div>
          ) : null}

          <button type="submit" disabled={isBusy}>
            {isBusy ? (isEditMode ? "Saving..." : "Creating...") : actionLabel}
          </button>
        </form>

        <FormPreviewPanel values={currentPreviewValues} />
      </div>
    </div>
  );
}

function SectionEditor({
  index,
  form,
  moveSectionUp,
  moveSectionDown,
  removeSection,
  duplicateSection,
  canMoveUp,
  canMoveDown,
  canRemove,
}: {
  index: number;
  form: UseFormReturn<FormBuilderValues>;
  moveSectionUp: () => void;
  moveSectionDown: () => void;
  removeSection: () => void;
  duplicateSection: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
}) {
  const fields = useFieldArray({
    control: form.control,
    name: `sections.${index}.fields` as const,
  });

  const questionColor = QUESTION_COLORS[index % QUESTION_COLORS.length];

  return (
    <div className="field-card stack" style={{ borderLeft: `6px solid ${questionColor}` }}>
      <div className="field-toolbar">
        <strong style={{ color: questionColor }}>Question {index + 1}</strong>
        <div className="actions-row">
          <button type="button" className="ghost-button small-btn" onClick={moveSectionUp} disabled={!canMoveUp}>
            Move up
          </button>
          <button type="button" className="ghost-button small-btn" onClick={moveSectionDown} disabled={!canMoveDown}>
            Move down
          </button>
          <button type="button" className="ghost-button small-btn" onClick={duplicateSection}>
            Duplicate
          </button>
          <button type="button" className="ghost-button small-btn danger-text" onClick={removeSection} disabled={!canRemove}>
            Remove
          </button>
        </div>
      </div>

      <label className="stack small">
        Question title
        <input {...form.register(`sections.${index}.title`)} placeholder="Admission details" />
      </label>

      <label className="stack small">
        Question description
        <textarea {...form.register(`sections.${index}.description`)} placeholder="Use this question to capture yearly admission data" />
      </label>

      <div className="field-toolbar">
        <strong>Options</strong>
      </div>

      <div className="stack">
        {fields.fields.map((field, fieldIndex) => (
          <div className="field-group-box stack" key={field.id}>
            <div className="field-toolbar">
              <strong>Option {fieldIndex + 1}</strong>
              <div className="actions-row">
                <button type="button" className="ghost-button small-btn" onClick={() => fields.move(fieldIndex, fieldIndex - 1)} disabled={fieldIndex === 0}>
                  Move up
                </button>
                <button type="button" className="ghost-button small-btn" onClick={() => fields.move(fieldIndex, fieldIndex + 1)} disabled={fieldIndex === fields.fields.length - 1}>
                  Move down
                </button>
                <button type="button" className="ghost-button small-btn danger-text" onClick={() => fields.remove(fieldIndex)} disabled={fields.fields.length === 1}>
                  Remove
                </button>
              </div>
            </div>

            <div className="grid cols-2">
              <label className="stack small">
                Option Label
                <input {...form.register(`sections.${index}.fields.${fieldIndex}.label`)} placeholder="Year 2019" />
              </label>
              <label className="stack small">
                Option type
                <select {...form.register(`sections.${index}.fields.${fieldIndex}.type`)}>
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="stack small">
              Choices
              <input {...form.register(`sections.${index}.fields.${fieldIndex}.optionsText`)} placeholder="Comma-separated choices for dropdowns and multiple choice options" />
            </label>

            <label className="small" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" {...form.register(`sections.${index}.fields.${fieldIndex}.required`)} style={{ width: 18, height: 18 }} />
              Required
            </label>
          </div>
        ))}

        <button
          type="button"
          className="ghost-button"
          style={{ width: "100%", padding: "0.6rem", borderStyle: "dashed", fontSize: "0.85rem", color: "var(--accent)" }}
          onClick={() =>
            fields.append({
              label: "",
              type: "text",
              required: true,
              optionsText: "",
            })
          }
        >
          + Add option
        </button>
      </div>
    </div>
  );
}

function createBlankBuilderValues(): FormBuilderValues {
  return {
    title: "",
    description: "",
    deadline: "",
    isOpen: true,
    sections: [
      {
        title: "",
        description: "",
        fields: [
          {
            label: "",
            type: "text",
            required: true,
            optionsText: "",
          },
        ],
      },
    ],
  };
}

function mapFormToBuilderValues(form: Form): FormBuilderValues {
  return {
    title: form.title,
    description: form.description ?? "",
    deadline: formatDateInput(form.deadline),
    isOpen: form.isOpen,
    sections: form.sections.length > 0
      ? form.sections.map((section) => ({
          title: section.title,
          description: section.description ?? "",
          fields: section.fields.map((field) => ({
            label: field.label,
            type: field.fieldType.toLowerCase() as FormBuilderValues["sections"][number]["fields"][number]["type"],
            required: field.required,
            optionsText: field.options.map((option) => option.label).join(", "),
          })),
        }))
      : createBlankBuilderValues().sections,
  };
}

function formatDateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}
