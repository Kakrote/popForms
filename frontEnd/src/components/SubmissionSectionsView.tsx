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
  fields: SubmissionFieldView[];
};

type SubmissionSectionsViewProps = {
  sections: SubmissionSectionView[];
  emptyMessage?: string;
};

export function SubmissionSectionsView({ sections, emptyMessage = "No submission values available." }: SubmissionSectionsViewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
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
    <div className="stack">
      {visibleSections.map((section) => (
        <div key={section.id} className="field-card stack">
          <div className="field-toolbar">
            <div>
              <strong>{section.title}</strong>
              {section.description ? <p className="muted small">{section.description}</p> : null}
            </div>
            <button type="button" className="link-button" onClick={() => toggleSection(section.id)}>
              {expandedSections.includes(section.id) ? "Hide" : "Show"}
            </button>
          </div>

          {expandedSections.includes(section.id) ? (
            <div className="stack" style={{ marginTop: 12 }}>
              {section.fields.map((field) => (
                <div key={field.id} className="field-group-box stack">
                  <div className="small muted">{field.label}</div>
                  <div className="submission-value">{field.value || "No response"}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default SubmissionSectionsView;