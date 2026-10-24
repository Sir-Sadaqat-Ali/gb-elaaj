-- CreateTable
CREATE TABLE "SavedDoctor" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedDoctor_patientId_idx" ON "SavedDoctor"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedDoctor_patientId_doctorId_key" ON "SavedDoctor"("patientId", "doctorId");

-- AddForeignKey
ALTER TABLE "SavedDoctor" ADD CONSTRAINT "SavedDoctor_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDoctor" ADD CONSTRAINT "SavedDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
