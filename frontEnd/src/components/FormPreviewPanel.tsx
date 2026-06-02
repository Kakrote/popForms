import type { FormBuilderValues } from "../types";
import { getFieldTypeLabel } from "./fieldTypeLabels";

type Props = {
  values: FormBuilderValues;
};

export function FormPreviewPanel({ values }: Props) {
  return (
    <section className="panel stack preview-panel">
      <div className="field-toolbar">
        <div>
          <p className="eyebrow">Live preview</p>
          <h2>{values.title || "Untitled form"}</h2>
          <p className="muted">This is how the final form will appear to users.</p>
        </div>
        <span className={`badge ${values.isOpen ? "open" : "closed"}`}>{values.isOpen ? "Open" : "Closed"}</span>
      </div>

      <div className="preview-description">{values.description || "No description provided."}</div>
      {values.deadline ? <div className="notice small">Deadline: {values.deadline}</div> : null}

      <div className="stack">
        {values.sections.map((section, sectionIndex) => (
          <div className="field-card stack" key={`${section.title || "section"}-${sectionIndex}`}>
            <div className="field-toolbar">
              <div>
                <strong>{section.title || `Section ${sectionIndex + 1}`}</strong>
                {section.description ? <p className="muted small">{section.description}</p> : null}
              </div>
              <span className="badge">{section.fields.length} fields</span>
            </div>

            <div className="stack">
              {section.fields.map((field, fieldIndex) => {
                const options = field.optionsText
                  .split(",")
                  .map((option) => option.trim())
                  .filter(Boolean);

                return (
                  <div className="field-group-box stack" key={`${field.label || "field"}-${fieldIndex}`}>
                    <div className="field-toolbar">
                      <div>
                        <strong>{field.label || `Field ${fieldIndex + 1}`}</strong>
                        <p className="muted small">{getFieldTypeLabel(field.type)}</p>
                      </div>
                      {field.required ? <span className="badge">Required</span> : <span className="badge">Optional</span>}
                    </div>

                    {renderFieldPreview(field.type, options)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderFieldPreview(type: FormBuilderValues["sections"][number]["fields"][number]["type"], options: string[]) {
  switch (type) {
    case "textarea":
      return <textarea disabled placeholder="Long answer preview" />;
    case "select":
      return (
        <select disabled defaultValue="">
          <option value="">Select an option</option>
          {options.length > 0 ? options.map((option) => <option key={option} value={option}>{option}</option>) : <option value="">No options yet</option>}
        </select>
      );
    case "radio":
      return (
        <div className="stack small">
          {options.length > 0 ? (
            options.map((option) => (
              <label key={option} className="preview-option">
                <input type="radio" disabled />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <div className="muted small">Add options to preview multiple choice answers.</div>
          )}
        </div>
      );
    case "checkbox":
      return (
        <label className="preview-option">
          <input type="checkbox" disabled />
          <span>Checkbox preview</span>
        </label>
      );
    case "number":
      return <input type="number" disabled placeholder="0" />;
    case "date":
      return <input type="date" disabled />;
    case "email":
      return <input type="email" disabled placeholder="name@example.com" />;
    default:
      return <input type="text" disabled placeholder="Short answer preview" />;
  }
}

export default FormPreviewPanel;