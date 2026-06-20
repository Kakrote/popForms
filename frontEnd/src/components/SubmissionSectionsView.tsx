import { useEffect, useMemo, useState } from "react";

export type SubmissionFieldView = {
  id: string;
  label: string;
  value: string;
};

export type SubmissionSectionView = {
  id: string;
  title: string;
  description?: string | null;
  headerLabel?: string | null;
  headerDescription?: string | null;
  fields: SubmissionFieldView[];
};

type SubmissionSectionsViewProps = {
  sections: SubmissionSectionView[];
  emptyMessage?: string;
};

const QUESTION_COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#a855f7", "#ec4899"];

export function SubmissionSectionsView({ sections, emptyMessage = "No submission values available." }: SubmissionSectionsViewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    // Collapsed by default
    setExpandedSections([]);
  }, [sections]);

  const visibleSections = useMemo(() => sections ?? [], [sections]);

  if (visibleSections.length === 0) {
    return <p className="muted">{emptyMessage}</p>;
  }

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev.filter((sectionId) => sectionId !== id) : [...prev, id]));
  };

  return (
    <div className="stack" style={{ gap: 20 }}>
      {visibleSections.map((section, sectionIndex) => {
        const questionColor = QUESTION_COLORS[sectionIndex % QUESTION_COLORS.length];
        return (
          <div key={section.id} className="stack" style={{ gap: 12 }}>
            {(section.headerLabel || section.headerDescription) && (
              <div 
                className="section-separator stack" 
                style={{ 
                  marginTop: sectionIndex === 0 ? 0 : 12, 
                  marginBottom: 0, 
                  padding: "12px 16px", 
                  background: "rgba(0, 0, 0, 0.02)", 
                  borderRadius: "10px",
                  borderLeft: `4px solid ${questionColor}`
                }}
              >
                {section.headerLabel && <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)" }}>{section.headerLabel}</h3>}
                {section.headerDescription && <p className="muted small" style={{ margin: "2px 0 0 0" }}>{section.headerDescription}</p>}
              </div>
            )}
            <div className="field-card stack" style={{ padding: 20, background: "var(--surface)", borderLeft: `5px solid ${questionColor}` }}>
              <div className="field-toolbar" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 4 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)" }}>{section.title}</h3>
                  {section.description ? <p className="muted small" style={{ margin: "2px 0 0 0" }}>{section.description}</p> : null}
                </div>
                <button 
                  type="button" 
                  className="ghost-button small-btn" 
                  onClick={() => toggleSection(section.id)}
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  {expandedSections.includes(section.id) ? "Collapse" : "Expand"}
                </button>
              </div>

              {expandedSections.includes(section.id) ? (
                <div className="stack" style={{ gap: 12, marginTop: 8 }}>
                  {section.fields.map((field) => (
                    <div 
                      key={field.id} 
                      className="stack" 
                      style={{ 
                        gap: 6, 
                        padding: "12px 16px", 
                        background: "var(--surface-strong)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "10px" 
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9rem" }}>
                        {field.label}
                      </div>
                      <div 
                        className="submission-value" 
                        style={{ 
                          padding: "8px 12px", 
                          background: "var(--surface)", 
                          border: "1px solid var(--border)", 
                          borderRadius: "6px", 
                          fontSize: "0.875rem",
                          lineHeight: "1.5",
                          color: "var(--text)",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {field.value || <span className="muted" style={{ fontStyle: "italic" }}>No response provided</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SubmissionSectionsView;