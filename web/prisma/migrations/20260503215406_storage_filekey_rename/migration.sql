/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `LabReport` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `prescriptionUrl` on the `PharmacyOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "pmdcDocKey" TEXT,
ADD COLUMN     "pmdcDocMime" TEXT,
ADD COLUMN     "pmdcDocSize" INTEGER;

-- AlterTable
ALTER TABLE "LabReport" DROP COLUMN "fileUrl",
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileMime" TEXT,
ADD COLUMN     "fileSize" INTEGER;

-- AlterTable
ALTER TABLE "MedicalRecord" DROP COLUMN "fileUrl",
ADD COLUMN     "fileKey" TEXT;

-- AlterTable
ALTER TABLE "PharmacyOrder" DROP COLUMN "prescriptionUrl",
ADD COLUMN     "prescriptionKey" TEXT,
ADD COLUMN     "prescriptionMime" TEXT,
ADD COLUMN     "prescriptionSize" INTEGER;
