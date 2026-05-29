import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { formsApi } from "../../lib/api";
import type { FormBuilderValues } from "../../types";

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

export function FormBuilderPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(createFormSchema as any) as any,
    defaultValues: {
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
    },
  });

  const sections = useFieldArray({
    control: form.control,
    name: "sections",
  });

  const createMutation = useMutation({
    mutationFn: formsApi.create,
    onSuccess: async (createdForm) => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate(`/admin/forms/${createdForm.slug}`);
    },
  });

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <p className="eyebrow">Builder</p>
          <h1>Create form</h1>
          <p className="muted">Create sections first, then place the fields inside each section.</p>
        </div>
      </div>

      <form
        className="panel stack"
        onSubmit={form.handleSubmit((values) => {
          createMutation.mutate(values as unknown as FormBuilderValues);
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

        <div className="field-toolbar">
          <div>
            <h2>Sections</h2>
            <p className="muted">Each form can have multiple sections and each section can contain multiple fields.</p>
          </div>
          <button
            type="button"
            className="ghost-button"
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
            Add section
          </button>
        </div>

        <div className="form-section">
          {sections.fields.map((section, index) => (
            <SectionEditor
              key={section.id}
              index={index}
              form={form}
              removeSection={() => sections.remove(index)}
              canRemove={sections.fields.length > 1}
            />
          ))}
        </div>

        {form.formState.errors.sections ? <span className="error">{form.formState.errors.sections.message as string}</span> : null}
        {createMutation.isError ? (
          <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>
            {(createMutation.error as Error).message}
          </div>
        ) : null}

        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create form"}
        </button>
      </form>
    </div>
  );
}

function SectionEditor({
  index,
  form,
  removeSection,
  canRemove,
}: {
  index: number;
  form: UseFormReturn<FormBuilderValues>;
  removeSection: () => void;
  canRemove: boolean;
}) {
  const fields = useFieldArray({
    control: form.control,
    name: `sections.${index}.fields` as const,
  });

  return (
    <div className="field-card stack">
      <div className="field-toolbar">
        <strong>Section {index + 1}</strong>
        <button type="button" className="ghost-button" onClick={removeSection} disabled={!canRemove}>
          Remove section
        </button>
      </div>

      <label className="stack small">
        Section title
        <input {...form.register(`sections.${index}.title`)} placeholder="Admission details" />
      </label>

      <label className="stack small">
        Section description
        <textarea {...form.register(`sections.${index}.description`)} placeholder="Use this section to capture yearly admission data" />
      </label>

      <div className="field-toolbar">
        <div>
          <strong>Fields</strong>
          <p className="muted small">Add one or more fields inside this section.</p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() =>
            fields.append({
              label: "",
              type: "text",
              required: true,
              optionsText: "",
            })
          }
        >
          Add field
        </button>
      </div>

      <div className="stack">
        {fields.fields.map((field, fieldIndex) => (
          <div className="field-group-box stack" key={field.id}>
            <div className="field-toolbar">
              <strong>Field {fieldIndex + 1}</strong>
              <button type="button" className="ghost-button" onClick={() => fields.remove(fieldIndex)} disabled={fields.fields.length === 1}>
                Remove
              </button>
            </div>

            <div className="grid cols-2">
              <label className="stack small">
                Label
                <input {...form.register(`sections.${index}.fields.${fieldIndex}.label`)} placeholder="Year 2019" />
              </label>
              <label className="stack small">
                Type
                <select {...form.register(`sections.${index}.fields.${fieldIndex}.type`)}>
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </label>
            </div>

            <label className="stack small">
              Options
              <input {...form.register(`sections.${index}.fields.${fieldIndex}.optionsText`)} placeholder="Option A, Option B, Option C" />
            </label>

            <label className="small" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" {...form.register(`sections.${index}.fields.${fieldIndex}.required`)} style={{ width: 18, height: 18 }} />
              Required
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
