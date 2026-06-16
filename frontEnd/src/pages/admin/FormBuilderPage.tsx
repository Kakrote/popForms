import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import FormPreviewPanel from "../../components/FormPreviewPanel";
import { FIELD_TYPE_OPTIONS } from "../../components/fieldTypeLabels";
import { formsApi } from "../../lib/api";
import type { Form, FormBuilderValues } from "../../types";
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Copy, 
  PlusCircle, 
  Plus, 
  Minus,
  Save, 
  FileText,
  AlertCircle
} from "lucide-react";

const fieldSchema = z.object({
  label: z.string().min(1, "Field label is required"),
  type: z.enum(["text", "textarea", "number", "email", "date", "select", "radio", "checkbox"]),
  required: z.boolean(),
  optionsText: z.string(),
});

const sectionSchema = z.object({
  headerLabel: z.string().optional(),
  headerDescription: z.string().optional(),
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

const QUESTION_COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#a855f7", "#ec4899"];

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
    if (!isEditMode || !formQuery.data) return;
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
      await queryClient.invalidateQueries({ queryKey: ["public-form", createdForm.slug] });
      navigate(`/admin/forms/${createdForm.slug}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormBuilderValues) => formsApi.update(slug as string, payload),
    onSuccess: async (updatedForm) => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      await queryClient.invalidateQueries({ queryKey: ["form", slug] });
      await queryClient.invalidateQueries({ queryKey: ["public-form", slug] });
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
  const heading = isEditMode ? "Edit Form" : "Create Form";
  const actionLabel = isEditMode ? "Save Changes" : "Create Form";

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Builder</p>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>{heading}</h1>
          <p className="muted" style={{ marginTop: 4 }}>Build the form structure on the left, and review live layout rendering on the right.</p>
        </div>
      </div>

      <div className="split">
        <form
          id="form-builder-form"
          className="panel stack"
          onSubmit={form.handleSubmit((values) => {
            if (isEditMode) {
              updateMutation.mutate(values);
              return;
            }
            createMutation.mutate(values);
          })}
          style={{ background: "rgba(15, 22, 40, 0.8)", border: "1px solid var(--border)" }}
        >
          {/* Basic Form Details */}
          <div className="grid cols-2">
            <label className="stack small" style={{ gap: 6 }}>
              Title
              <input 
                id="builder-form-title"
                {...form.register("title")} 
                placeholder="Employee Onboarding Survey" 
              />
              {form.formState.errors.title ? <span className="error">{form.formState.errors.title.message}</span> : null}
            </label>
            <label className="stack small" style={{ gap: 6 }}>
              Deadline
              <input 
                id="builder-form-deadline"
                type="date" 
                {...form.register("deadline")} 
              />
            </label>
          </div>

          <label className="stack small" style={{ gap: 6 }}>
            Description
            <textarea 
              id="builder-form-description"
              {...form.register("description")} 
              placeholder="Provide context or instructions for your users..." 
            />
          </label>

          <label className="stack small" style={{ maxWidth: 220, gap: 6 }}>
            <span>Form Status</span>
            <select 
              id="builder-form-status"
              {...form.register("isOpen", { setValueAs: (value) => value === "true" })}
            >
              <option value="true">Open (Accepting Submissions)</option>
              <option value="false">Closed (Draft / Inactive)</option>
            </select>
          </label>

          {isEditMode ? (
            <div className="notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span className="small">
                Updating this form will overwrite the structure. Note: Adding, renaming, or removing questions may impact existing response values.
              </span>
            </div>
          ) : null}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Questions & Sections</h2>
            <p className="muted small" style={{ margin: "4px 0 0 0" }}>Create sections (cards) and populate them with inputs (fields).</p>
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
            id="builder-add-question-btn"
            type="button"
            className="ghost-button"
            style={{ width: "100%", padding: "1rem", borderStyle: "dashed", color: "var(--accent)", display: "flex", justifyContent: "center", gap: 8 }}
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
            <PlusCircle size={18} />
            Add Question Section
          </button>

          {form.formState.errors.sections ? <span className="error">{form.formState.errors.sections.message as string}</span> : null}
          
          {createMutation.isError ? (
            <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AlertCircle size={18} />
              <span className="small">{(createMutation.error as Error).message}</span>
            </div>
          ) : null}
          {updateMutation.isError ? (
            <div className="notice error-notice" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AlertCircle size={18} />
              <span className="small">{(updateMutation.error as Error).message}</span>
            </div>
          ) : null}

          <button 
            id="builder-submit-form-btn"
            type="submit" 
            disabled={isBusy}
            style={{ padding: "0.85rem 1.5rem" }}
          >
            <Save size={18} />
            {isBusy ? (isEditMode ? "Saving Changes..." : "Creating Form...") : actionLabel}
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

  const headerLabel = useWatch({ control: form.control, name: `sections.${index}.headerLabel` });
  const headerDescription = useWatch({ control: form.control, name: `sections.${index}.headerDescription` });
  
  const [showSeparator, setShowSeparator] = useState(!!(headerLabel || headerDescription));

  useEffect(() => {
    if (headerLabel || headerDescription) {
      setShowSeparator(true);
    }
  }, [headerLabel, headerDescription]);

  return (
    <div 
      className="field-card stack" 
      style={{ 
        borderLeft: `5px solid ${questionColor}`, 
        background: "rgba(255, 255, 255, 0.01)",
        gap: 16
      }}
    >
      <div className="field-toolbar" style={{ margin: 0, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <strong style={{ color: questionColor, fontSize: "1.05rem" }}>Question Section {index + 1}</strong>
        <div className="actions-row">
          <button 
            id={`section-${index}-move-up`}
            type="button" 
            className="ghost-button small-btn" 
            onClick={moveSectionUp} 
            disabled={!canMoveUp}
            style={{ padding: 6 }}
          >
            <ArrowUp size={14} />
          </button>
          <button 
            id={`section-${index}-move-down`}
            type="button" 
            className="ghost-button small-btn" 
            onClick={moveSectionDown} 
            disabled={!canMoveDown}
            style={{ padding: 6 }}
          >
            <ArrowDown size={14} />
          </button>
          <button 
            id={`section-${index}-duplicate`}
            type="button" 
            className="ghost-button small-btn" 
            onClick={duplicateSection}
            style={{ padding: "6px 10px", gap: 4 }}
          >
            <Copy size={13} />
            <span className="small">Copy</span>
          </button>
          <button 
            id={`section-${index}-remove`}
            type="button" 
            className="ghost-button small-btn danger-text" 
            onClick={removeSection} 
            disabled={!canRemove}
            style={{ padding: "6px 10px", gap: 4 }}
          >
            <Trash2 size={13} />
            <span className="small">Delete</span>
          </button>
        </div>
      </div>

      {/* Separator Section Toggle */}
      {!showSeparator ? (
        <button
          id={`section-${index}-add-header`}
          type="button"
          className="ghost-button small-btn"
          style={{ alignSelf: "flex-start", color: "var(--accent)", gap: 4 }}
          onClick={() => setShowSeparator(true)}
        >
          <Plus size={14} />
          Add Section Header Separator
        </button>
      ) : (
        <div className="stack" style={{ background: "rgba(255,255,255,0.015)", padding: 14, borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)", gap: 12 }}>
          <div className="field-toolbar" style={{ margin: 0 }}>
            <span className="small" style={{ fontWeight: 600, color: "#fff" }}>Header Separator (Optional)</span>
            <button
              id={`section-${index}-remove-header`}
              type="button"
              className="ghost-button small-btn danger-text"
              onClick={() => {
                form.setValue(`sections.${index}.headerLabel`, "");
                form.setValue(`sections.${index}.headerDescription`, "");
                setShowSeparator(false);
              }}
              style={{ padding: "4px 8px", gap: 4 }}
            >
              <Minus size={12} />
              Remove
            </button>
          </div>
          <div className="grid cols-2" style={{ gap: 12 }}>
            <label className="stack small" style={{ gap: 4 }}>
              Title
              <input 
                id={`section-${index}-header-label`}
                {...form.register(`sections.${index}.headerLabel`)} 
                placeholder="e.g., Personal Details" 
              />
            </label>
            <label className="stack small" style={{ gap: 4 }}>
              Description
              <input 
                id={`section-${index}-header-desc`}
                {...form.register(`sections.${index}.headerDescription`)} 
                placeholder="e.g., Tell us about yourself" 
              />
            </label>
          </div>
        </div>
      )}

      {/* Title & Description of Section */}
      <div className="grid cols-2" style={{ gap: 12 }}>
        <label className="stack small" style={{ gap: 4 }}>
          Section Title
          <input 
            id={`section-${index}-title`}
            {...form.register(`sections.${index}.title`)} 
            placeholder="Contact Information" 
          />
        </label>
        <label className="stack small" style={{ gap: 4 }}>
          Section Description
          <input 
            id={`section-${index}-description`}
            {...form.register(`sections.${index}.description`)} 
            placeholder="Provide contact details below..." 
          />
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 14, marginTop: 4 }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Form Fields</span>
      </div>

      {/* Fields List */}
      <div className="stack" style={{ gap: 12 }}>
        {fields.fields.map((field, fieldIndex) => (
          <div className="field-group-box stack" key={field.id} style={{ gap: 12, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="field-toolbar" style={{ margin: 0 }}>
              <strong style={{ fontSize: "0.85rem", color: "#fff" }}>Field Option {fieldIndex + 1}</strong>
              <div className="actions-row">
                <button 
                  id={`section-${index}-field-${fieldIndex}-move-up`}
                  type="button" 
                  className="ghost-button small-btn" 
                  onClick={() => fields.move(fieldIndex, fieldIndex - 1)} 
                  disabled={fieldIndex === 0}
                  style={{ padding: 4 }}
                >
                  <ArrowUp size={12} />
                </button>
                <button 
                  id={`section-${index}-field-${fieldIndex}-move-down`}
                  type="button" 
                  className="ghost-button small-btn" 
                  onClick={() => fields.move(fieldIndex, fieldIndex + 1)} 
                  disabled={fieldIndex === fields.fields.length - 1}
                  style={{ padding: 4 }}
                >
                  <ArrowDown size={12} />
                </button>
                <button 
                  id={`section-${index}-field-${fieldIndex}-remove`}
                  type="button" 
                  className="ghost-button small-btn danger-text" 
                  onClick={() => fields.remove(fieldIndex)} 
                  disabled={fields.fields.length === 1}
                  style={{ padding: 4 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="grid cols-2" style={{ gap: 12 }}>
              <label className="stack small" style={{ gap: 4 }}>
                Field Label
                <input 
                  id={`section-${index}-field-${fieldIndex}-label`}
                  {...form.register(`sections.${index}.fields.${fieldIndex}.label`)} 
                  placeholder="e.g., Full Name" 
                />
              </label>
              <label className="stack small" style={{ gap: 4 }}>
                Input Type
                <select 
                  id={`section-${index}-field-${fieldIndex}-type`}
                  {...form.register(`sections.${index}.fields.${fieldIndex}.type`)}
                >
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="stack small" style={{ gap: 4 }}>
              Options (Dropdowns/Radio/Checkboxes)
              <input 
                id={`section-${index}-field-${fieldIndex}-options`}
                {...form.register(`sections.${index}.fields.${fieldIndex}.optionsText`)} 
                placeholder="Option A, Option B, Option C (comma-separated)" 
              />
            </label>

            <label className="small" style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
              <input 
                id={`section-${index}-field-${fieldIndex}-required`}
                type="checkbox" 
                {...form.register(`sections.${index}.fields.${fieldIndex}.required`)} 
                style={{ width: 16, height: 16 }} 
              />
              <span style={{ color: "var(--text)" }}>Mark as Required field</span>
            </label>
          </div>
        ))}

        <button
          id={`section-${index}-add-field-btn`}
          type="button"
          className="ghost-button"
          style={{ width: "100%", padding: "0.6rem", borderStyle: "dashed", fontSize: "0.825rem", color: "var(--accent)", display: "flex", justifyContent: "center", gap: 6 }}
          onClick={() =>
            fields.append({
              label: "",
              type: "text",
              required: true,
              optionsText: "",
            })
          }
        >
          <PlusCircle size={14} />
          Add Field Input
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
        headerLabel: "",
        headerDescription: "",
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
          headerLabel: section.headerLabel ?? "",
          headerDescription: section.headerDescription ?? "",
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
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
