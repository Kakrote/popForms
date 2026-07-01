-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_userId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionEditHistory" DROP CONSTRAINT "SubmissionEditHistory_editedById_fkey";

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "submittedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SubmissionEditHistory" ALTER COLUMN "editedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionEditHistory" ADD CONSTRAINT "SubmissionEditHistory_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
