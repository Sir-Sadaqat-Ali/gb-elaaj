-- AlterTable
ALTER TABLE "HomeCareRequest" ADD COLUMN     "addressLat" DOUBLE PRECISION,
ADD COLUMN     "addressLng" DOUBLE PRECISION,
ADD COLUMN     "lastLocationAt" TIMESTAMP(3),
ADD COLUMN     "lastNurseLat" DOUBLE PRECISION,
ADD COLUMN     "lastNurseLng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "NurseLocation" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "homeCareRequestId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'browser',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NurseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NurseLocation_homeCareRequestId_createdAt_idx" ON "NurseLocation"("homeCareRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "NurseLocation_nurseId_createdAt_idx" ON "NurseLocation"("nurseId", "createdAt");

-- AddForeignKey
ALTER TABLE "NurseLocation" ADD CONSTRAINT "NurseLocation_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseLocation" ADD CONSTRAINT "NurseLocation_homeCareRequestId_fkey" FOREIGN KEY ("homeCareRequestId") REFERENCES "HomeCareRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
