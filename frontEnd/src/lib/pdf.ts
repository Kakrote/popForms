import { jsPDF } from "jspdf";
import type { Submission, Form } from "../types";
import { getFieldTypeLabel } from "../components/fieldTypeLabels";

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
  
  let currentY = marginY;
  let pageNumber = 1;

  // Header and Footer helper for every page
  const drawPageHeaderAndFooter = (pageNum: number) => {
    // Header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // muted slate grey
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

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      pageNumber++;
      currentY = marginY;
      drawPageHeaderAndFooter(pageNumber);
      return true;
    }
    return false;
  };

  // Draw header for page 1
  drawPageHeaderAndFooter(pageNumber);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Accent color (#4f46e5)
  
  const titleLines = doc.splitTextToSize(submission.form?.title || "Submission Form", printableWidth);
  const titleHeight = titleLines.length * 7;
  checkPageBreak(titleHeight + 10);
  doc.text(titleLines, marginX, currentY);
  currentY += titleHeight + 4;

  // Horizontal separator rule
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.75);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // Metadata Card / Info
  checkPageBreak(42);
  doc.setFillColor(248, 250, 252); // light slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, currentY, printableWidth, 32, 3, 3, "FD");
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "bold");
  doc.text("Receipt ID:", marginX + 6, currentY + 7);
  doc.text("Submitted By:", marginX + 6, currentY + 13);
  doc.text("Department:", marginX + 6, currentY + 19);
  doc.text("Submission Date:", marginX + 6, currentY + 25);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(submission.id, marginX + 38, currentY + 7);
  doc.text(submission.submittedBy?.username || submission.submittedById || "Unknown User", marginX + 38, currentY + 13);
  doc.text(submission.department?.department_Name || submission.departmentId || "Unknown Department", marginX + 38, currentY + 19);
  doc.text(submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date(submission.createdAt).toLocaleString(), marginX + 38, currentY + 25);

  currentY += 40;

  // Get Answers
  const valuesByFieldId = new Map(submission.submissionValue.map((v) => [v.fieldId, v.value]));
  const sections = submission.form?.sections ?? [];

  if (sections.length === 0) {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Submission Details", marginX, currentY);
    currentY += 8;

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
      doc.text(qLines, marginX, currentY);
      currentY += qLines.length * 5 + 1;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(aLines, marginX + 5, currentY);
      currentY += aLines.length * 5 + 4;
    });
  } else {
    sections.forEach((section) => {
      const secTitleLines = doc.splitTextToSize(section.title, printableWidth - 6);
      const secDescLines = section.description ? doc.splitTextToSize(section.description, printableWidth) : [];
      const secHeight = secTitleLines.length * 6 + (secDescLines.length ? secDescLines.length * 4.5 + 2 : 0) + 12;

      checkPageBreak(secHeight);

      // Draw background bar for section header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(marginX, currentY, printableWidth, secTitleLines.length * 6 + 4, "F");
      
      // Draw left accent bar
      doc.setFillColor(79, 70, 229);
      doc.rect(marginX, currentY, 1.5, secTitleLines.length * 6 + 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229);
      doc.text(secTitleLines, marginX + 4, currentY + 5);
      currentY += secTitleLines.length * 6 + 6;

      if (secDescLines.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(secDescLines, marginX, currentY);
        currentY += secDescLines.length * 4.5 + 4;
      } else {
        currentY += 2;
      }

      // Fields in this section
      section.fields.forEach((field) => {
        const val = valuesByFieldId.get(field.id) ?? "No response";
        const qLabel = `${field.label} (${getFieldTypeLabel(field.fieldType)})`;
        const qLines = doc.splitTextToSize(qLabel, printableWidth);
        
        // Format options / values a bit cleaner if checkbox / select
        const cleanVal = val || "-";
        const aLines = doc.splitTextToSize(cleanVal, printableWidth - 6);
        const itemHeight = qLines.length * 5 + aLines.length * 4.5 + 6;

        checkPageBreak(itemHeight);

        // Print Question Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(qLines, marginX, currentY);
        currentY += qLines.length * 5 + 1;

        // Print Answer response
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700
        doc.setFontSize(9);
        doc.text(aLines, marginX + 4, currentY);
        currentY += aLines.length * 4.5 + 4.5;
      });

      currentY += 4; // Margin after section
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
  
  let currentY = marginY;
  let pageNumber = 1;

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

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      pageNumber++;
      currentY = marginY;
      drawPageHeaderAndFooter(pageNumber);
      return true;
    }
    return false;
  };

  // Draw header for page 1
  drawPageHeaderAndFooter(pageNumber);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Accent color (#4f46e5)
  
  const titleLines = doc.splitTextToSize(form.title, printableWidth);
  const titleHeight = titleLines.length * 7;
  checkPageBreak(titleHeight + 10);
  doc.text(titleLines, marginX, currentY);
  currentY += titleHeight + 4;

  // Horizontal separator rule
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.75);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // Form Description
  if (form.description) {
    const descLines = doc.splitTextToSize(form.description, printableWidth - 8);
    const descBoxHeight = descLines.length * 4.5 + 8;
    checkPageBreak(descBoxHeight + 6);
    
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.roundedRect(marginX, currentY, printableWidth, descBoxHeight, 2, 2, "FD");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(descLines, marginX + 4, currentY + 6);
    
    currentY += descBoxHeight + 8;
  }

  // Sections
  const sections = form.sections ?? [];
  if (sections.length === 0) {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("No questions configured in this form.", marginX, currentY);
  } else {
    sections.forEach((section) => {
      const secTitleLines = doc.splitTextToSize(section.title, printableWidth - 6);
      const secDescLines = section.description ? doc.splitTextToSize(section.description, printableWidth) : [];
      const secHeight = secTitleLines.length * 6 + (secDescLines.length ? secDescLines.length * 4.5 + 2 : 0) + 12;

      checkPageBreak(secHeight);

      // Draw background bar for section header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(marginX, currentY, printableWidth, secTitleLines.length * 6 + 4, "F");
      
      // Draw left accent bar
      doc.setFillColor(79, 70, 229);
      doc.rect(marginX, currentY, 1.5, secTitleLines.length * 6 + 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229);
      doc.text(secTitleLines, marginX + 4, currentY + 5);
      currentY += secTitleLines.length * 6 + 6;

      if (secDescLines.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(secDescLines, marginX, currentY);
        currentY += secDescLines.length * 4.5 + 4;
      } else {
        currentY += 2;
      }

      // Fields in this section
      section.fields.forEach((field) => {
        const fieldLabel = `${field.label}${field.required ? " *" : ""}`;
        const qLines = doc.splitTextToSize(fieldLabel, printableWidth);
        
        let visualHeight = 0;
        if (field.fieldType === "TEXTAREA") {
          visualHeight = 18;
        } else if (field.fieldType === "SELECT" || field.fieldType === "RADIO" || field.fieldType === "CHECKBOX") {
          const optionsCount = field.options?.length || 0;
          visualHeight = optionsCount * 5 + 2;
        } else {
          visualHeight = 6;
        }

        const itemHeight = qLines.length * 5 + visualHeight + 6;
        checkPageBreak(itemHeight);

        // Print Question Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(qLines, marginX, currentY);
        currentY += qLines.length * 5 + 2;

        // Render printable blank elements
        if (field.fieldType === "TEXTAREA") {
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.setLineWidth(0.2);
          doc.rect(marginX + 2, currentY, printableWidth - 4, 14);
          currentY += 16;
        } else if (field.fieldType === "SELECT" || field.fieldType === "RADIO" || field.fieldType === "CHECKBOX") {
          const prefix = field.fieldType === "CHECKBOX" ? "[  ]" : "(  )";
          const options = field.options ?? [];
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105); // slate-600
          
          options.forEach((opt) => {
            const optText = `${prefix}  ${opt.label}`;
            const optLines = doc.splitTextToSize(optText, printableWidth - 6);
            
            checkPageBreak(optLines.length * 4.5 + 2);
            doc.text(optLines, marginX + 3, currentY);
            currentY += optLines.length * 4.5 + 1;
          });
          currentY += 2;
        } else {
          // TEXT, NUMBER, EMAIL, DATE
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.line(marginX + 2, currentY + 3, pageWidth - marginX - 2, currentY + 3);
          
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`[ Input Type: ${getFieldTypeLabel(field.fieldType)} ]`, marginX + 2, currentY + 2);
          
          currentY += 6;
        }
      });

      currentY += 4; // Margin after section
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
