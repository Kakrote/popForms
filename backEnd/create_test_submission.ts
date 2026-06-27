import { prisma } from './src/lib/prisma.js';

async function main() {
  const baseUrl = 'http://localhost:5001/api';

  console.log("Seeding test data...");
  try {
    // 1. Create or get department
    const dept = await prisma.department.upsert({
      where: { department_Name: 'Test Dept' },
      update: {},
      create: {
        department_Name: 'Test Dept',
        user: {
          create: {
            username: 'deptuser',
            email: 'deptuser@example.com',
            password: 'password123',
            role: 'USER'
          }
        }
      }
    });

    // 2. Get the user created for the department
    const user = await prisma.user.findUnique({
      where: { email: 'deptuser@example.com' }
    });
    if (!user) throw new Error("Dept user not found");

    // 3. Create a test form
    const form = await prisma.form.create({
      data: {
        title: 'Test Form',
        slug: 'test-form-' + Date.now(),
        isOpen: true,
        createdById: user.id,
        sections: {
          create: {
            title: 'Section 1',
            sortOrder: 1,
            fields: {
              create: {
                label: 'Field 1',
                fieldType: 'TEXT',
                fieldKey: 'field_1',
                required: true,
                sortOrder: 1
              }
            }
          }
        }
      },
      include: {
        sections: {
          include: {
            fields: true
          }
        }
      }
    });

    const field = form.sections[0].fields[0];

    // 4. Create a submission
    const submission = await prisma.submission.create({
      data: {
        formId: form.id,
        departmentId: dept.id,
        submittedById: user.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submissionValue: {
          create: {
            fieldId: field.id,
            value: 'Hello World'
          }
        }
      }
    });

    console.log("Test submission created! ID:", submission.id);

    // 5. Get admin token
    console.log("Logging in as admin...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'supersecurepassword' })
    });
    
    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} - ${errText}`);
    }

    const loginData = await loginRes.json() as any;
    const token = loginData.data.token;

    // 6. Query the submission detail
    console.log(`Querying /api/submissions/${submission.id}...`);
    const detailRes = await fetch(`${baseUrl}/submissions/${submission.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("API response status:", detailRes.status);
    const detailData = await detailRes.json();
    console.log("API response body:", JSON.stringify(detailData, null, 2));

  } catch (err: any) {
    console.error("Failed to run seed and API query:", err.message || err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
