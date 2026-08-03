import { prisma } from "../../lib/prisma.js";

export const fetchOverviewData = async () => {
  const [formsCount, usersCount, deptsCount, submissions] = await Promise.all([
    prisma.form.count(),
    prisma.user.count(),
    prisma.department.count(),
    prisma.submission.findMany({
      select: {
        id: true,
        status: true,
        formId: true,
        departmentId: true,
        createdAt: true,
        submittedAt: true,
        department: {
          select: {
            id: true,
            department_Name: true,
          },
        },
        form: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  const departments = await prisma.department.findMany({
    select: {
      id: true,
      department_Name: true,
    },
  });

  return {
    forms_count: formsCount,
    users_count: usersCount,
    depts_count: deptsCount,
    departments,
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      form_id: s.formId,
      form_title: s.form?.title || "",
      department_id: s.departmentId,
      department_name: s.department?.department_Name || "",
      created_at: s.createdAt.toISOString(),
      submitted_at: s.submittedAt ? s.submittedAt.toISOString() : null,
    })),
  };
};

export const fetchFormOverviewData = async (formId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, title: true, description: true },
  });

  if (!form) return null;

  const [assigned, submissions] = await Promise.all([
    prisma.formAccess.findMany({
      where: { formId },
      include: { department: true },
    }),
    prisma.submission.findMany({
      where: { formId },
      include: {
        department: true,
        submittedBy: { select: { email: true } },
      },
    }),
  ]);

  return {
    form,
    assigned_departments: assigned.map((a) => ({
      department_id: a.departmentId,
      department_name: a.department.department_Name,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      created_at: s.createdAt.toISOString(),
      submitted_at: s.submittedAt ? s.submittedAt.toISOString() : null,
      dept_id: s.departmentId,
      dept_name: s.department?.department_Name || "",
      user_email: s.submittedBy?.email || null,
    })),
  };
};

export const fetchYearComparisonData = async (formId: string) => {
  const [fields, submissions, values] = await Promise.all([
    prisma.field.findMany({
      where: { section: { formId } },
      include: {
        section: { select: { title: true, sortOrder: true } },
        options: { select: { label: true, value: true } },
      },
      orderBy: [
        { section: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    }),
    prisma.submission.findMany({
      where: { formId },
      include: { department: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.submissionValue.findMany({
      where: { submission: { formId } },
      include: {
        submission: {
          select: {
            createdAt: true,
            submittedAt: true,
          },
        },
      },
    }),
  ]);

  return {
    form_id: formId,
    fields: fields.map((f) => ({
      field_id: f.id,
      label: f.label,
      field_key: f.fieldKey,
      field_type: f.fieldType,
      section_title: f.section.title,
      options: f.options,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      created_at: s.createdAt.toISOString(),
      submitted_at: s.submittedAt ? s.submittedAt.toISOString() : null,
      dept_name: s.department?.department_Name || "",
    })),
    values: values.map((v) => ({
      field_id: v.fieldId,
      value: v.value,
      submission_id: v.submissionId,
      submitted_at: v.submission.submittedAt
        ? v.submission.submittedAt.toISOString()
        : v.submission.createdAt.toISOString(),
    })),
  };
};

export const fetchQuestionComparisonData = async (formId: string) => {
  const fields = await prisma.field.findMany({
    where: { section: { formId } },
    include: {
      section: { select: { title: true, sortOrder: true } },
      options: { select: { label: true, value: true } },
    },
    orderBy: [
      { section: { sortOrder: "asc" } },
      { sortOrder: "asc" },
    ],
  });

  const values = await prisma.submissionValue.findMany({
    where: { submission: { formId } },
    include: {
      submission: {
        select: {
          id: true,
          createdAt: true,
          submittedAt: true,
          department: { select: { department_Name: true } },
        },
      },
    },
  });

  return {
    form_id: formId,
    fields: fields.map((f) => ({
      field_id: f.id,
      label: f.label,
      field_key: f.fieldKey,
      field_type: f.fieldType,
      section_title: f.section.title,
      options: f.options,
    })),
    values: values.map((v) => ({
      field_id: v.fieldId,
      value: v.value,
      submission_id: v.submissionId,
      dept_name: v.submission.department?.department_Name || "",
      submitted_at: v.submission.submittedAt
        ? v.submission.submittedAt.toISOString()
        : v.submission.createdAt.toISOString(),
    })),
  };
};

export const fetchSubmissionComparisonData = async (formId: string, submissionIds: string[]) => {
  const fields = await prisma.field.findMany({
    where: { section: { formId } },
    include: { section: { select: { title: true, sortOrder: true } } },
    orderBy: [
      { section: { sortOrder: "asc" } },
      { sortOrder: "asc" },
    ],
  });

  const [submissions, values, histories] = await Promise.all([
    prisma.submission.findMany({
      where: { id: { in: submissionIds }, formId },
      include: {
        department: true,
        submittedBy: { select: { username: true, email: true } },
      },
    }),
    prisma.submissionValue.findMany({
      where: { submissionId: { in: submissionIds } },
    }),
    prisma.submissionEditHistory.findMany({
      where: { submissionId: { in: submissionIds } },
    }),
  ]);

  const editCounts: Record<string, number> = {};
  histories.forEach((h) => {
    editCounts[h.submissionId] = (editCounts[h.submissionId] || 0) + 1;
  });

  return {
    form_id: formId,
    submission_ids: submissionIds,
    fields: fields.map((f) => ({
      field_id: f.id,
      label: f.label,
      field_key: f.fieldKey,
      field_type: f.fieldType,
      section_title: f.section.title,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      dept_name: s.department?.department_Name || "",
      user_name: s.submittedBy?.username || null,
      user_email: s.submittedBy?.email || null,
      status: s.status,
      submittedAt: s.submittedAt ? s.submittedAt.toISOString() : s.createdAt.toISOString(),
      edit_history_count: editCounts[s.id] || 0,
    })),
    values: values.map((v) => ({
      submission_id: v.submissionId,
      field_id: v.fieldId,
      value: v.value,
    })),
  };
};

export const fetchGrowthData = async (formId: string) => {
  const submissions = await prisma.submission.findMany({
    where: { formId },
    include: { department: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    form_id: formId,
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      created_at: s.createdAt.toISOString(),
      submitted_at: s.submittedAt ? s.submittedAt.toISOString() : null,
      dept_name: s.department?.department_Name || "",
    })),
  };
};
