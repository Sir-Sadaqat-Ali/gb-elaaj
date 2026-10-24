"use server";

import { revalidatePath } from "next/cache";
import { Role, MedicalRecordType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/appointments";

/**
 * A patient attaches one of their own uploaded documents to their records.
 * The storage key must live under this user's own upload namespace, so a
 * patient can't attach a file they didn't upload.
 */
export async function addPatientDocumentAction(input: {
  title: string;
  note?: string;
  fileKey: string;
  fileMime?: string | null;
  fileSize?: number | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.PATIENT) return { ok: false, error: "Patients only." };

  const title = (input.title ?? "").trim();
  if (title.length < 2) return { ok: false, error: "Give the document a title." };
  if (!input.fileKey || !input.fileKey.startsWith(`medical-record/${session.user.id}/`)) {
    return { ok: false, error: "Upload a file first." };
  }

  const me = await prisma.patientProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return { ok: false, error: "Patient profile not found." };

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: me.id,
      type: MedicalRecordType.ATTACHMENT,
      title,
      body: input.note?.trim() || null,
      fileKey: input.fileKey,
      fileMime: input.fileMime ?? null,
      fileSize: input.fileSize ?? null,
      recordedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: { actorUserId: session.user.id, action: "patient.document_added", targetType: "MedicalRecord", targetId: record.id },
  });

  revalidatePath("/patient/medical-records");
  return { ok: true };
}
