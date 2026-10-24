// GET /api/files/[id]/download?kind=<lab-report|prescription|medical-record|pmdc-doc>
//
// Resolves the parent record by id+kind, runs RBAC, returns a short-lived
// signed download URL. Use as: redirect (default) or ?json=1 for JSON.
//
// RBAC rules per kind (see STORAGE_AUDIT.md §7):
//   lab-report      patient owner, treating doctor (via appointment), lab admin (own lab), admin
//   prescription    patient owner, pharmacy admin (own pharmacy), admin
//   medical-record  patient owner, treating doctor (via appointment), admin
//   pmdc-doc        the doctor themselves, admin
//
// Security notes:
//   - The id param identifies a *record* (LabReport.id, PharmacyOrder.id,
//     MedicalRecord.id, DoctorProfile.id). Storage keys are NEVER directly
//     exposed to clients.
//   - Returns 403 (not 404) when found-but-denied so clients can show a
//     meaningful error. Returns 404 when record is missing.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "lab-report" | "prescription" | "medical-record" | "pmdc-doc";

const VALID_KINDS: ReadonlyArray<Kind> = ["lab-report", "prescription", "medical-record", "pmdc-doc"];

/**
 * Returns the storage key the caller is allowed to download, or a deny reason.
 */
async function resolveAccess(
  id: string,
  kind: Kind,
  callerUserId: string,
  callerRole: Role,
): Promise<{ ok: true; key: string; mime?: string | null } | { ok: false; status: 403 | 404; error: string }> {
  if (callerRole === Role.ADMIN) {
    // Admin can read any file (compliance / support). Still need to load the record to get the key.
  }

  switch (kind) {
    case "lab-report": {
      const report = await prisma.labReport.findUnique({
        where: { id },
        include: {
          booking: {
            include: {
              patient: { select: { userId: true } },
              lab: { select: { ownerUserId: true } },
            },
          },
        },
      });
      if (!report) return { ok: false, status: 404, error: "Lab report not found." };
      const key = report.fileKey ?? null;
      if (!key) return { ok: false, status: 404, error: "Lab report has no file." };

      if (callerRole === Role.ADMIN) return { ok: true, key, mime: report.fileMime };
      if (callerRole === Role.PATIENT && report.booking.patient.userId === callerUserId) {
        return { ok: true, key, mime: report.fileMime };
      }
      if (callerRole === Role.LAB_ADMIN && report.booking.lab.ownerUserId === callerUserId) {
        return { ok: true, key, mime: report.fileMime };
      }
      if (callerRole === Role.DOCTOR) {
        // Treating doctor: did this booking get linked to a MedicalRecord owned
        // by an appointment whose doctor is the caller?
        const link = await prisma.medicalRecord.findFirst({
          where: {
            type: "LAB_REPORT",
            patientId: report.booking.patientId,
            doctor: { userId: callerUserId },
          },
          select: { id: true },
        });
        if (link) return { ok: true, key, mime: report.fileMime };
      }
      return { ok: false, status: 403, error: "You don't have permission to view this report." };
    }

    case "prescription": {
      // id is the PharmacyOrder.id; key is on PharmacyOrder.prescriptionKey
      const order = await prisma.pharmacyOrder.findUnique({
        where: { id },
        include: {
          patient: { select: { userId: true } },
          pharmacy: { select: { ownerUserId: true } },
        },
      });
      if (!order) return { ok: false, status: 404, error: "Order not found." };
      const key = order.prescriptionKey ?? null;
      if (!key) return { ok: false, status: 404, error: "No prescription on this order." };

      if (callerRole === Role.ADMIN) return { ok: true, key, mime: order.prescriptionMime };
      if (callerRole === Role.PATIENT && order.patient.userId === callerUserId) {
        return { ok: true, key, mime: order.prescriptionMime };
      }
      if (callerRole === Role.PHARMACY_ADMIN && order.pharmacy.ownerUserId === callerUserId) {
        return { ok: true, key, mime: order.prescriptionMime };
      }
      return { ok: false, status: 403, error: "You don't have permission to view this prescription." };
    }

    case "medical-record": {
      const record = await prisma.medicalRecord.findUnique({
        where: { id },
        include: {
          patient: { select: { userId: true } },
          doctor: { select: { userId: true } },
        },
      });
      if (!record) return { ok: false, status: 404, error: "Medical record not found." };
      const key = record.fileKey ?? null;
      if (!key) return { ok: false, status: 404, error: "Medical record has no file." };

      if (callerRole === Role.ADMIN) return { ok: true, key, mime: record.fileMime };
      if (callerRole === Role.PATIENT && record.patient.userId === callerUserId) {
        return { ok: true, key, mime: record.fileMime };
      }
      if (callerRole === Role.DOCTOR && record.doctor?.userId === callerUserId) {
        return { ok: true, key, mime: record.fileMime };
      }
      return { ok: false, status: 403, error: "You don't have permission to view this record." };
    }

    case "pmdc-doc": {
      // id is the DoctorProfile.id
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id },
        select: { id: true, userId: true, pmdcDocKey: true, pmdcDocMime: true },
      });
      if (!doctor) return { ok: false, status: 404, error: "Doctor not found." };
      const key = doctor.pmdcDocKey ?? null;
      if (!key) return { ok: false, status: 404, error: "No PMDC document on file." };

      if (callerRole === Role.ADMIN) return { ok: true, key, mime: doctor.pmdcDocMime };
      if (callerRole === Role.DOCTOR && doctor.userId === callerUserId) {
        return { ok: true, key, mime: doctor.pmdcDocMime };
      }
      return { ok: false, status: 403, error: "You don't have permission to view this document." };
    }
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const url = new URL(req.url);
  const kindParam = url.searchParams.get("kind");
  if (!kindParam || !VALID_KINDS.includes(kindParam as Kind)) {
    return NextResponse.json(
      { ok: false, error: `Missing or invalid 'kind'. Use one of: ${VALID_KINDS.join(", ")}.` },
      { status: 400 },
    );
  }
  const kind = kindParam as Kind;

  const access = await resolveAccess(id, kind, session.user.id, session.user.role);
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  // Audit: log every download — these are PHI accesses
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "file.downloaded",
      targetType: kind,
      targetId: id,
      meta: { role: session.user.role, key: access.key },
    },
  }).catch(() => {
    // audit failure must NOT block the user; log and continue
    console.error("[files/download] audit log write failed for", id);
  });

  // Issue signed URL
  let signed;
  try {
    const provider = getStorageProvider();
    signed = await provider.signDownload({ key: access.key, expiresInSeconds: 600 });
  } catch (err) {
    console.error("[files/download] provider error:", err);
    return NextResponse.json(
      { ok: false, error: "Storage is not configured. Contact support." },
      { status: 503 },
    );
  }

  // Default behavior: 302 to the signed URL — the browser handles content disposition.
  // Pass ?json=1 if a client wants the raw URL (e.g., to embed in <img>).
  if (url.searchParams.get("json") === "1") {
    return NextResponse.json(
      {
        ok: true,
        data: {
          downloadUrl: signed.downloadUrl,
          mime: access.mime ?? null,
          expiresAt: signed.expiresAt.toISOString(),
        },
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.redirect(signed.downloadUrl, {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
