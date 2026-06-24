import type { FormBuilderValues } from "../types";
import { getFieldTypeLabel } from "./fieldTypeLabels";
import { Eye, Calendar } from "lucide-react";
import universityLogo from "../public/university.png";
import logo from "../public/logo.png";

type Props = {
  values: FormBuilderValues;
};

const QUESTION_COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#a855f7", "#ec4899"];

export function FormPreviewPanel({ values }: Props) {
  return (
    <section className="panel stack preview-panel" style={{ background: "var(--surface-strong)", border: "1px dashed var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 16, borderBottom: "1px dashed var(--border)", marginBottom: 4 }}>
        <img 
          src={universityLogo} 
          alt="Uttaranchal University Logo" 
          style={{ maxWidth: "100%", maxHeight: "42px", objectFit: "contain" }} 
        />
      </div>
      <div className="field-toolbar" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            <p className="eyebrow" style={{ margin: 0 }}>PRAGATI Preview</p>
          </div>
          <h2 style={{ fontSize: "1.35rem", margin: "4px 0 0 0" }}>{values.title || "Untitled Questionnaire"}</h2>
          <p className="muted small" style={{ margin: 0 }}>This is how the final form will appear to users.</p>
        </div>
        <span className={`badge ${values.isOpen ? "open" : "closed"}`}>{values.isOpen ? "Active" : "Draft"}</span>
      </div>

      <div className="preview-description" style={{ background: "rgba(0, 0, 0, 0.02)" }}>
        {values.description || "No description provided."}
      </div>
      
      {values.deadline ? (
        <div className="notice small" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, background: "rgba(0, 0, 0, 0.02)" }}>
          <Calendar size={12} />
          <span>Deadline: {new Date(values.deadline).toLocaleDateString()}</span>
        </div>
      ) : null}

      <div className="stack" style={{ gap: 16 }}>
        {values.sections.map((section, sectionIndex) => {
          const questionColor = QUESTION_COLORS[sectionIndex % QUESTION_COLORS.length];
          return (
            <div key={`${section.title || "section"}-${sectionIndex}`} className="stack" style={{ gap: 12 }}>
              {(section.headerLabel || section.headerDescription) && (
                <div className="section-separator stack" style={{ 
                  marginTop: sectionIndex === 0 ? 0 : 16, 
                  marginBottom: 0, 
                  padding: "12px 16px", 
                  background: "rgba(0, 0, 0, 0.02)", 
                  borderRadius: "10px",
                  borderLeft: `4px solid ${questionColor}`
                }}>
                  {section.headerLabel && <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)" }}>{section.headerLabel}</h3>}
                  {section.headerDescription && <p className="muted small" style={{ margin: "2px 0 0 0" }}>{section.headerDescription}</p>}
                </div>
              )}
              <div
                className="field-card stack"
                style={{ 
                  borderLeft: `5px solid ${questionColor}`, 
                  background: "var(--surface)",
                  padding: 20
                }}
              >
                <div className="field-toolbar" style={{ margin: 0, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <strong style={{ color: questionColor, fontSize: "1rem" }}>{section.title || `Question ${sectionIndex + 1}`}</strong>
                    {section.description ? <p className="muted small" style={{ margin: "4px 0 0 0" }}>{section.description}</p> : null}
                  </div>
                  <span className="badge small">{section.fields.length} {section.fields.length === 1 ? "field" : "fields"}</span>
                </div>

                <div className="stack" style={{ gap: 14 }}>
                  {section.fields.map((field, fieldIndex) => {
                    const options = field.optionsText
                      .split(",")
                      .map((option) => option.trim())
                      .filter(Boolean);

                    return (
                      <div className="field-group-box stack" key={`${field.label || "field"}-${fieldIndex}`} style={{ padding: 14, background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border)" }}>
                        <div className="field-toolbar" style={{ margin: 0, marginBottom: 8 }}>
                          <div>
                            <strong style={{ fontSize: "0.9rem", color: "var(--text)" }}>{field.label || `Field ${fieldIndex + 1}`}</strong>
                            <p className="muted small" style={{ margin: 0, fontSize: "0.75rem" }}>{getFieldTypeLabel(field.type)}</p>
                          </div>
                          {field.required ? (
                            <span className="badge" style={{ fontSize: "0.7rem", color: "var(--danger)", borderColor: "var(--danger-border)" }}>Required</span>
                          ) : (
                            <span className="badge" style={{ fontSize: "0.7rem" }}>Optional</span>
                          )}
                        </div>

                        {renderFieldPreview(field.type, options)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function renderFieldPreview(type: FormBuilderValues["sections"][number]["fields"][number]["type"], options: string[]) {
  switch (type) {
    case "textarea":
      return <textarea disabled placeholder="Long answer preview..." style={{ fontSize: "0.85rem", padding: "8px 12px" }} />;
    case "select":
      return (
        <select disabled defaultValue="" style={{ fontSize: "0.85rem", padding: "8px 12px" }}>
          <option value="">Select an option</option>
          {options.length > 0 ? options.map((option) => <option key={option} value={option}>{option}</option>) : <option value="">No options configured yet</option>}
        </select>
      );
    case "radio":
      return (
        <div className="stack small" style={{ gap: 8 }}>
          {options.length > 0 ? (
            options.map((option) => (
              <label key={option} className="preview-option" style={{ color: "var(--muted)" }}>
                <input type="radio" disabled style={{ width: 14, height: 14 }} />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <div className="muted small" style={{ fontSize: "0.8rem", fontStyle: "italic" }}>Add comma-separated choices above.</div>
          )}
        </div>
      );
    case "checkbox":
      return (
        <label className="preview-option" style={{ color: "var(--muted)" }}>
          <input type="checkbox" disabled style={{ width: 14, height: 14 }} />
          <span>Checkbox response</span>
        </label>
      );
    case "number":
      return <input type="number" disabled placeholder="0" style={{ fontSize: "0.85rem", padding: "8px 12px" }} />;
    case "date":
      return <input type="date" disabled style={{ fontSize: "0.85rem", padding: "8px 12px" }} />;
    case "email":
      return <input type="email" disabled placeholder="username@example.com" style={{ fontSize: "0.85rem", padding: "8px 12px" }} />;
    default:
      return <input type="text" disabled placeholder="Short answer preview..." style={{ fontSize: "0.85rem", padding: "8px 12px" }} />;
  }
}

export default FormPreviewPanel;