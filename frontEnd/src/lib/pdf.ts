import { jsPDF } from "jspdf";
import type { Submission, Form } from "../types";
import { getFieldTypeLabel } from "../components/fieldTypeLabels";

// Helper to check and add page break safely
const checkPageBreakFactory = (
  doc: jsPDF,
  currentY: { val: number },
  pageNumber: { val: number },
  drawHeaderFooter: (pageNum: number) => void,
  marginY: number,
  maxY: number
) => {
  return (neededHeight: number) => {
    if (currentY.val + neededHeight > maxY) {
      doc.addPage();
      pageNumber.val++;
      currentY.val = marginY;
      drawHeaderFooter(pageNumber.val);
      return true;
    }
    return false;
  };
};

export function generateSubmissionPDF(submission: Submission) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const marginY = 20;
  const printableWidth = pageWidth - 2 * marginX;
  const maxY = pageHeight - marginY;
  
  const currentY = { val: marginY };
  const pageNumber = { val: 1 };

  // Header and Footer helper
  const drawPageHeaderAndFooter = (pageNum: number) => {
    // Header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("PRAGATI Questionnaire Submission Receipt", marginX, 10);
    doc.text(
      `Date Generated: ${new Date().toLocaleDateString()}`,
      pageWidth - marginX,
      10,
      { align: "right" }
    );
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.25);
    doc.line(marginX, 12, pageWidth - marginX, 12);

    // Footer
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);
    doc.text("IQAC, Uttaranchal University", marginX, pageHeight - 8);
    doc.text(`Page ${pageNum}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
  };

  const checkPageBreak = checkPageBreakFactory(
    doc,
    currentY,
    pageNumber,
    drawPageHeaderAndFooter,
    marginY,
    maxY
  );

  // Draw header for page 1
  drawPageHeaderAndFooter(pageNumber.val);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // #4f46e5 Indigo-600
  
  const titleLines = doc.splitTextToSize(submission.form?.title || "Submission Form", printableWidth);
  const titleHeight = titleLines.length * 7;
  checkPageBreak(titleHeight + 10);
  doc.text(titleLines, marginX, currentY.val);
  currentY.val += titleHeight + 4;

  // Horizontal separator rule
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.75);
  doc.line(marginX, currentY.val, pageWidth - marginX, currentY.val);
  currentY.val += 8;

  // Metadata Card / Info
  checkPageBreak(42);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, currentY.val, printableWidth, 32, 3, 3, "FD");
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "bold");
  doc.text("Receipt ID:", marginX + 6, currentY.val + 7);
  doc.text("Submitted By:", marginX + 6, currentY.val + 13);
  doc.text("Department:", marginX + 6, currentY.val + 19);
  doc.text("Submission Date:", marginX + 6, currentY.val + 25);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(submission.id, marginX + 38, currentY.val + 7);
  doc.text(submission.submittedBy?.username || submission.submittedById || "Unknown User", marginX + 38, currentY.val + 13);
  doc.text(submission.department?.department_Name || submission.departmentId || "Unknown Department", marginX + 38, currentY.val + 19);
  doc.text(submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date(submission.createdAt).toLocaleString(), marginX + 38, currentY.val + 25);

  currentY.val += 40;

  // Get Answers
  const valuesByFieldId = new Map(submission.submissionValue.map((v) => [v.fieldId, v.value]));
  const sections = submission.form?.sections ?? [];

  if (sections.length === 0) {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Submission Details", marginX, currentY.val);
    currentY.val += 8;

    submission.submissionValue.forEach((value) => {
      const qText = value.field?.label ?? value.fieldId;
      const aText = value.value || "No response";

      const qLines = doc.splitTextToSize(`Q: ${qText}`, printableWidth);
      const aLines = doc.splitTextToSize(`A: ${aText}`, printableWidth - 6);
      const itemHeight = qLines.length * 5 + aLines.length * 5 + 6;

      checkPageBreak(itemHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, marginX, currentY.val);
      currentY.val += qLines.length * 5 + 1;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(aLines, marginX + 5, currentY.val);
      currentY.val += aLines.length * 5 + 4;
    });
  } else {
    sections.forEach((section) => {
      // Check and render Category Header / Separator (headerLabel & headerDescription)
      if (section.headerLabel || section.headerDescription) {
        const hLabelLines = section.headerLabel ? doc.splitTextToSize(section.headerLabel.toUpperCase(), printableWidth) : [];
        const hDescLines = section.headerDescription ? doc.splitTextToSize(section.headerDescription, printableWidth) : [];
        const hHeight = (hLabelLines.length ? hLabelLines.length * 6 : 0) + (hDescLines.length ? hDescLines.length * 4.5 + 2 : 0) + 6;
        
        checkPageBreak(hHeight + 10);
        
        if (section.headerLabel) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(79, 70, 229); // Accent Indigo
          doc.text(hLabelLines, marginX, currentY.val);
          currentY.val += hLabelLines.length * 6;
        }
        
        if (section.headerDescription) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(hDescLines, marginX, currentY.val);
          currentY.val += hDescLines.length * 4.5 + 2;
        }
        
        // Draw category separator line
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.4);
        doc.line(marginX, currentY.val + 2, pageWidth - marginX, currentY.val + 2);
        currentY.val += 8;
      }

      const secTitleLines = doc.splitTextToSize(section.title.toUpperCase(), printableWidth - 8);
      const secDescLines = section.description ? doc.splitTextToSize(section.description, printableWidth) : [];
      const secHeaderBoxHeight = secTitleLines.length * 5 + 6;
      const secHeight = secHeaderBoxHeight + (secDescLines.length ? secDescLines.length * 4.5 + 2 : 0) + 12;

      // Make sure section header has enough space
      checkPageBreak(secHeight > 45 ? 45 : secHeight);

      // Draw elegant Slate-800 horizontal banner for Section Header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(marginX, currentY.val, printableWidth, secHeaderBoxHeight, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255); // White text
      doc.text(secTitleLines, marginX + 4, currentY.val + 5.5);
      currentY.val += secHeaderBoxHeight + 4;

      if (secDescLines.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(secDescLines, marginX, currentY.val);
        currentY.val += secDescLines.length * 4.5 + 4;
      } else {
        currentY.val += 2;
      }

      // Fields in this section
      section.fields.forEach((field) => {
        const val = valuesByFieldId.get(field.id) ?? "";
        const hasResponse = val.trim().length > 0;
        const cleanVal = hasResponse ? val : "No response";

        const labelText = `${field.label}${field.required ? " *" : ""}`;
        
        // UI/UX Decision: side-by-side layout if label is short and input is simple
        const isShortLabel = labelText.length < 35;
        const isSimpleType = field.fieldType !== "TEXTAREA" && field.fieldType !== "SELECT" && field.fieldType !== "CHECKBOX" && field.fieldType !== "RADIO";
        
        if (isShortLabel && isSimpleType) {
          // Side-by-side layout
          const itemHeight = 9;
          checkPageBreak(itemHeight);

          // Question on the left
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(labelText, marginX, currentY.val + 4);

          // Response value aligned on the right
          doc.setFont("helvetica", "medium");
          doc.setFontSize(9.5);
          doc.setTextColor(79, 70, 229); // Brand color for submitted answers
          doc.text(cleanVal, pageWidth - marginX, currentY.val + 4, { align: "right" });

          // Light underline to separate
          doc.setDrawColor(241, 245, 249); // slate-100
          doc.setLineWidth(0.15);
          doc.line(marginX, currentY.val + 6.5, pageWidth - marginX, currentY.val + 6.5);

          currentY.val += itemHeight;
        } else {
          // Full width layout for long textareas or choice options
          const qLines = doc.splitTextToSize(labelText, printableWidth);
          
          let responseHeight = 0;
          let aLines: string[] = [];

          if (field.fieldType === "TEXTAREA" || val.length > 60) {
            aLines = doc.splitTextToSize(cleanVal, printableWidth - 8);
            responseHeight = aLines.length * 4.5 + 8; // rounded card height
          } else {
            aLines = doc.splitTextToSize(cleanVal, printableWidth - 4);
            responseHeight = aLines.length * 4.5 + 2;
          }

          const itemHeight = qLines.length * 5 + responseHeight + 6;
          checkPageBreak(itemHeight);

          // Print Question
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(qLines, marginX, currentY.val);
          currentY.val += qLines.length * 5 + 1.5;

          // Render answer box/text
          if (field.fieldType === "TEXTAREA" || val.length > 60) {
            // Draw a subtle rounded card for long text answers
            doc.setFillColor(248, 250, 252); // slate-50
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(0.2);
            doc.roundedRect(marginX, currentY.val, printableWidth, responseHeight, 1.5, 1.5, "FD");

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85); // slate-700
            doc.text(aLines, marginX + 4, currentY.val + 5.5);
            currentY.val += responseHeight + 4;
          } else {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(79, 70, 229); // brand color for answers
            doc.text(aLines, marginX + 4, currentY.val);
            currentY.val += responseHeight + 3;
          }
        }
      });

      currentY.val += 6; // Margin after section
    });
  }

  // Save/Download PDF
  const safeSlug = (submission.form?.title || "form")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .substring(0, 30);
  const filename = `${safeSlug}_submission_${submission.id.substring(0, 8)}.pdf`;
  doc.save(filename);
}

export function generateBlankFormPDF(form: Form) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const marginY = 20;
  const printableWidth = pageWidth - 2 * marginX;
  const maxY = pageHeight - marginY;
  
  const currentY = { val: marginY };
  const pageNumber = { val: 1 };

  // Header and Footer helper for every page
  const drawPageHeaderAndFooter = (pageNum: number) => {
    // Header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // muted slate grey
    doc.text("PRAGATI Questionnaire Form Schema", marginX, 10);
    doc.text(
      `Deadline: ${form.deadline ? new Date(form.deadline).toLocaleDateString() : "None"}`,
      pageWidth - marginX,
      10,
      { align: "right" }
    );
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.25);
    doc.line(marginX, 12, pageWidth - marginX, 12);

    // Footer
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);
    doc.text("IQAC, Uttaranchal University", marginX, pageHeight - 8);
    doc.text(`Page ${pageNum}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
  };

  const checkPageBreak = checkPageBreakFactory(
    doc,
    currentY,
    pageNumber,
    drawPageHeaderAndFooter,
    marginY,
    maxY
  );

  // Draw header for page 1
  drawPageHeaderAndFooter(pageNumber.val);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Accent color (#4f46e5)
  
  const titleLines = doc.splitTextToSize(form.title, printableWidth);
  const titleHeight = titleLines.length * 7;
  checkPageBreak(titleHeight + 10);
  doc.text(titleLines, marginX, currentY.val);
  currentY.val += titleHeight + 4;

  // Horizontal separator rule
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.75);
  doc.line(marginX, currentY.val, pageWidth - marginX, currentY.val);
  currentY.val += 8;

  // Form Description
  if (form.description) {
    const descLines = doc.splitTextToSize(form.description, printableWidth - 8);
    const descBoxHeight = descLines.length * 4.5 + 8;
    checkPageBreak(descBoxHeight + 6);
    
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.roundedRect(marginX, currentY.val, printableWidth, descBoxHeight, 2, 2, "FD");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(descLines, marginX + 4, currentY.val + 6);
    
    currentY.val += descBoxHeight + 8;
  }

  // Sections
  const sections = form.sections ?? [];
  if (sections.length === 0) {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("No questions configured in this form.", marginX, currentY.val);
  } else {
    sections.forEach((section) => {
      // Check and render Category Header / Separator (headerLabel & headerDescription)
      if (section.headerLabel || section.headerDescription) {
        const hLabelLines = section.headerLabel ? doc.splitTextToSize(section.headerLabel.toUpperCase(), printableWidth) : [];
        const hDescLines = section.headerDescription ? doc.splitTextToSize(section.headerDescription, printableWidth) : [];
        const hHeight = (hLabelLines.length ? hLabelLines.length * 6 : 0) + (hDescLines.length ? hDescLines.length * 4.5 + 2 : 0) + 6;
        
        checkPageBreak(hHeight + 10);
        
        if (section.headerLabel) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(79, 70, 229); // Accent Indigo
          doc.text(hLabelLines, marginX, currentY.val);
          currentY.val += hLabelLines.length * 6;
        }
        
        if (section.headerDescription) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(hDescLines, marginX, currentY.val);
          currentY.val += hDescLines.length * 4.5 + 2;
        }
        
        // Draw category separator line
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.4);
        doc.line(marginX, currentY.val + 2, pageWidth - marginX, currentY.val + 2);
        currentY.val += 8;
      }

      const secTitleLines = doc.splitTextToSize(section.title.toUpperCase(), printableWidth - 8);
      const secDescLines = section.description ? doc.splitTextToSize(section.description, printableWidth) : [];
      const secHeaderBoxHeight = secTitleLines.length * 5 + 6;
      const secHeight = secHeaderBoxHeight + (secDescLines.length ? secDescLines.length * 4.5 + 2 : 0) + 12;

      // Make sure section header has enough space
      checkPageBreak(secHeight > 45 ? 45 : secHeight);

      // Draw elegant Slate-800 horizontal banner for Section Header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(marginX, currentY.val, printableWidth, secHeaderBoxHeight, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255); // White text
      doc.text(secTitleLines, marginX + 4, currentY.val + 5.5);
      currentY.val += secHeaderBoxHeight + 4;

      if (secDescLines.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(secDescLines, marginX, currentY.val);
        currentY.val += secDescLines.length * 4.5 + 4;
      } else {
        currentY.val += 2;
      }

      // Fields in this section
      section.fields.forEach((field) => {
        const fieldLabel = `${field.label}${field.required ? " *" : ""}`;
        
        // UI/UX Decision: side-by-side layout if label is short and input is simple
        const isShortLabel = fieldLabel.length < 35;
        const isSimpleType = field.fieldType !== "TEXTAREA" && field.fieldType !== "SELECT" && field.fieldType !== "CHECKBOX" && field.fieldType !== "RADIO";

        if (isShortLabel && isSimpleType) {
          // Side-by-side layout
          const itemHeight = 9;
          checkPageBreak(itemHeight);

          // Question on the left
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(fieldLabel, marginX, currentY.val + 4);

          // Dotted writing line on the right
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.setLineWidth(0.2);
          doc.line(130, currentY.val + 4.5, 175, currentY.val + 4.5);

          // Type hint far right
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`(${getFieldTypeLabel(field.fieldType)})`, pageWidth - marginX, currentY.val + 4, { align: "right" });

          currentY.val += itemHeight;
        } else {
          // Full width layout
          const qLines = doc.splitTextToSize(fieldLabel, printableWidth);
          
          let visualHeight = 0;
          if (field.fieldType === "TEXTAREA") {
            visualHeight = 18;
          } else if (field.fieldType === "SELECT" || field.fieldType === "RADIO" || field.fieldType === "CHECKBOX") {
            const optionsCount = field.options?.length || 0;
            // Draw in 2 columns if options count is > 2 to save space
            if (optionsCount > 2) {
              visualHeight = Math.ceil(optionsCount / 2) * 5 + 2;
            } else {
              visualHeight = optionsCount * 5 + 2;
            }
          } else {
            visualHeight = 6;
          }

          const itemHeight = qLines.length * 5 + visualHeight + 6;
          checkPageBreak(itemHeight);

          // Print Question Label
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(qLines, marginX, currentY.val);
          currentY.val += qLines.length * 5 + 2;

          // Render printable blank elements
          if (field.fieldType === "TEXTAREA") {
            doc.setDrawColor(203, 213, 225); // slate-300
            doc.setLineWidth(0.25);
            doc.rect(marginX + 2, currentY.val, printableWidth - 4, 14);
            currentY.val += 17;
          } else if (field.fieldType === "SELECT" || field.fieldType === "RADIO" || field.fieldType === "CHECKBOX") {
            const prefix = field.fieldType === "CHECKBOX" ? "[  ]" : "(  )";
            const options = field.options ?? [];
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105); // slate-600
            
            const optionsCount = options.length;
            if (optionsCount > 2) {
              // 2-Column layout for choices
              const colWidth = (printableWidth - 6) / 2;
              let rowY = currentY.val;
              
              for (let i = 0; i < optionsCount; i++) {
                const opt = options[i];
                const optText = `${prefix}  ${opt.label}`;
                const optLines = doc.splitTextToSize(optText, colWidth - 4);
                
                const colX = marginX + 3 + (i % 2) * (colWidth + 2);
                doc.text(optLines, colX, rowY + 3);
                
                if (i % 2 === 1 || i === optionsCount - 1) {
                  // Advance row
                  const maxLinesInRow = 1; // Assuming mostly single line choices, adjust if needed
                  rowY += maxLinesInRow * 4.5 + 1.5;
                }
              }
              currentY.val = rowY + 2;
            } else {
              // Single column layout
              options.forEach((opt) => {
                const optText = `${prefix}  ${opt.label}`;
                const optLines = doc.splitTextToSize(optText, printableWidth - 6);
                
                checkPageBreak(optLines.length * 4.5 + 2);
                doc.text(optLines, marginX + 3, currentY.val);
                currentY.val += optLines.length * 4.5 + 1;
              });
              currentY.val += 2;
            }
          } else {
            // TEXT, NUMBER, EMAIL, DATE
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.line(marginX + 2, currentY.val + 3, pageWidth - marginX - 2, currentY.val + 3);
            
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`[ Input Type: ${getFieldTypeLabel(field.fieldType)} ]`, marginX + 2, currentY.val + 2);
            
            currentY.val += 6;
          }
        }
      });

      currentY.val += 6; // Margin after section
    });
  }

  // Save/Download PDF
  const safeFormSlug = (form.title || "form")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .substring(0, 30);
  const filename = `${safeFormSlug}_form_schema.pdf`;
  doc.save(filename);
}
