import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { formsApi } from "../../lib/api";
import type { FormBuilderValues } from "../../types";
import type { UseFormReturn } from "react-hook-form";

const fieldSchema = z.object({
  label: z.string().min(1, "Field label is required"),
  type: z.enum(["text", "textarea", "number", "email", "date", "select", "radio", "checkbox"]),
  required: z.boolean(),
  optionsText: z.string(),
  hasSubFields: z.boolean().optional(),
  subFields: z.array(
    z.object({
      label: z.string().min(1, "Sub-field label is required"),
      required: z.boolean(),
    })
  ).optional(),
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
          hasSubFields: false,
          subFields: [],
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
                hasSubFields: false,
                subFields: [],
              })
            }
          >
            Add field
          </button>
        </div>

        <div className="form-section">
          {fields.fields.map((field, index) => (
            <FieldEditor key={field.id} index={index} form={form} removeField={() => fields.remove(index)} canRemove={fields.fields.length > 1} />
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

function FieldEditor({
  index,
  form,
  removeField,
  canRemove,
}: {
  index: number;
  form: UseFormReturn<FormBuilderValues>;
  removeField: () => void;
  canRemove: boolean;
}) {
  const hasSubFields = form.watch(`fields.${index}.hasSubFields`) ?? false;
  const subFields = form.watch(`fields.${index}.subFields`) ?? [];

  const addSubField = () => {
    form.setValue(`fields.${index}.hasSubFields`, true, { shouldDirty: true });
    form.setValue(`fields.${index}.subFields`, [...subFields, { label: "", required: false }], { shouldDirty: true });
  };

  const updateSubField = (subIndex: number, nextValue: Partial<{ label: string; required: boolean }>) => {
    const nextSubFields = subFields.map((subField, currentIndex) =>
      currentIndex === subIndex ? { ...subField, ...nextValue } : subField
    );
    form.setValue(`fields.${index}.subFields`, nextSubFields, { shouldDirty: true });
  };

  const removeSubField = (subIndex: number) => {
    const nextSubFields = subFields.filter((_subField, currentIndex) => currentIndex !== subIndex);
    form.setValue(`fields.${index}.subFields`, nextSubFields, { shouldDirty: true });
    if (nextSubFields.length === 0) {
      form.setValue(`fields.${index}.hasSubFields`, false, { shouldDirty: true });
    }
  };

  return (
    <div className="field-card stack">
      <div className="field-toolbar">
        <strong>Field {index + 1}</strong>
        <button type="button" className="ghost-button" onClick={removeField} disabled={!canRemove}>
          Remove
        </button>
      </div>

      <div className="grid cols-2">
        <label className="stack small">
          Label
          <input {...form.register(`fields.${index}.label`)} placeholder="No of admission" />
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

      <label className="small" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          checked={hasSubFields}
          onChange={(event) => {
            const checked = event.target.checked;
            form.setValue(`fields.${index}.hasSubFields`, checked, { shouldDirty: true });
            if (checked && subFields.length === 0) {
              form.setValue(`fields.${index}.subFields`, [{ label: "", required: false }], { shouldDirty: true });
            }
            if (!checked) {
              form.setValue(`fields.${index}.subFields`, [], { shouldDirty: true });
            }
          }}
          style={{ width: 18, height: 18 }}
        />
        Add sub-fields under this field
      </label>

      {hasSubFields ? (
        <div className="stack field-group-box">
          <div className="field-toolbar">
            <div>
              <strong>Sub-fields</strong>
              <p className="muted small">Example: year 2019, year 2020, year 2021</p>
            </div>
            <button type="button" className="ghost-button" onClick={addSubField}>
              Add sub-field
            </button>
          </div>

          <div className="stack">
            {subFields.map((subField, subIndex) => (
              <div className="grid cols-2" key={`${index}-${subIndex}`}>
                <label className="stack small">
                  Sub-field label
                  <input
                    value={subField.label}
                    onChange={(event) => updateSubField(subIndex, { label: event.target.value })}
                    placeholder="year 2019"
                  />
                </label>
                <div className="stack small" style={{ alignSelf: "end" }}>
                  <label className="small" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={subField.required}
                      onChange={(event) => updateSubField(subIndex, { required: event.target.checked })}
                      style={{ width: 18, height: 18 }}
                    />
                    Required
                  </label>
                  <button type="button" className="ghost-button" onClick={() => removeSubField(subIndex)}>
                    Remove sub-field
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
