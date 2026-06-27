-- CreateTable
CREATE TABLE "SubmissionEditHistory" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "editedById" TEXT NOT NULL,
    "changedValues" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionEditHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubmissionEditHistory" ADD CONSTRAINT "SubmissionEditHistory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionEditHistory" ADD CONSTRAINT "SubmissionEditHistory_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
