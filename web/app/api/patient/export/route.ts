// GET /api/patient/export — a patient downloads all their own data as JSON.
// Read-only, self-scoped. Audit-logged.

import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  if (session.user.role !== Role.PATIENT) return NextResponse.json({ error: "Patients only." }, { status: 403 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: { include: { city: true } } },
  });
  if (!me?.patient) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const patientId = me.patient.id;

  const [appointments, records, orders, labBookings, reviews] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledFor: "desc" },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    }),
    prisma.medicalRecord.findMany({ where: { patientId }, orderBy: { recordedAt: "desc" } }),
    prisma.pharmacyOrder.findMany({ where: { patientId }, orderBy: { createdAt: "desc" }, include: { items: true } }),
    prisma.labBooking.findMany({ where: { patientId }, orderBy: { scheduledFor: "desc" }, include: { test: { select: { nameEn: true } } } }),
    prisma.review.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { name: me.name, email: me.email, phone: me.phone, createdAt: me.createdAt },
    profile: {
      dob: me.patient.dob,
      gender: me.patient.gender,
      bloodType: me.patient.bloodType,
      city: me.patient.city?.nameEn ?? null,
      address: me.patient.addressLine,
    },
    appointments: appointments.map((a) => ({
      id: a.id, doctor: a.doctor.user.name, scheduledFor: a.scheduledFor, mode: a.mode,
      status: a.status, feePaisa: a.feePaisa, symptoms: a.symptoms,
    })),
    medicalRecords: records.map((r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, recordedAt: r.recordedAt })),
    pharmacyOrders: orders.map((o) => ({
      id: o.id, status: o.status, totalPaisa: o.totalPaisa, createdAt: o.createdAt,
      items: o.items.map((i) => ({ qty: i.qty, unitPaisa: i.unitPaisa, totalPaisa: i.totalPaisa })),
    })),
    labBookings: labBookings.map((b) => ({ id: b.id, test: b.test.nameEn, status: b.status, scheduledFor: b.scheduledFor, pricePaisa: b.pricePaisa })),
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, text: r.text, createdAt: r.createdAt })),
  };

  await prisma.auditLog.create({
    data: { actorUserId: me.id, action: "patient.data_exported", targetType: "User", targetId: me.id },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="gbelaaj-my-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
