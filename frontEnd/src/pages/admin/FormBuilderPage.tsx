import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
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

const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  deadline: z.string(),
  isOpen: z.boolean(),
  fields: z.array(fieldSchema).min(1, "Add at least one field"),
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
      fields: [
        {
          label: "",
          type: "text",
          required: true,
          optionsText: "",
        },
      ],
    },
  });

  const fields = useFieldArray({
    control: form.control,
    name: "fields",
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
          <p className="muted">Keep it simple, but ready for real data from day one.</p>
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
            <h2>Fields</h2>
            <p className="muted">Use one line per field and comma separate any options.</p>
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

        <div className="form-section">
          {fields.fields.map((field, index) => (
            <div className="field-card stack" key={field.id}>
              <div className="field-toolbar">
                <strong>Field {index + 1}</strong>
                <button type="button" className="ghost-button" onClick={() => fields.remove(index)} disabled={fields.fields.length === 1}>
                  Remove
                </button>
              </div>

              <div className="grid cols-2">
                <label className="stack small">
                  Label
                  <input {...form.register(`fields.${index}.label`)} placeholder="Full name" />
                </label>
                <label className="stack small">
                  Type
                  <select {...form.register(`fields.${index}.type`)}>
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
                <input {...form.register(`fields.${index}.optionsText`)} placeholder="Option A, Option B, Option C" />
              </label>

              <label className="small" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" {...form.register(`fields.${index}.required`)} style={{ width: 18, height: 18 }} />
                Required
              </label>
            </div>
          ))}
        </div>

        {form.formState.errors.fields ? <span className="error">{form.formState.errors.fields.message}</span> : null}
        {createMutation.isError ? <div className="notice" style={{ borderColor: "rgba(180,35,24,0.2)", background: "rgba(180,35,24,0.06)", color: "#8e1d14" }}>{(createMutation.error as Error).message}</div> : null}

        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create form"}
        </button>
      </form>
    </div>
  );
}
