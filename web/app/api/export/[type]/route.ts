// GET /api/export/<type> — RBAC-gated CSV export of platform data.
//   users, appointments, pharmacy-orders, lab-bookings   → ADMIN
//   transactions, withdrawals                            → ADMIN, FINANCE
// Each export is audit-logged (actor + type + row count).

import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv, type CsvCell } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5000;
const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 19).replace("T", " ") : "");
const rupees = (paisa: number) => (paisa / 100).toFixed(2);

type Exporter = {
  roles: Role[];
  build: () => Promise<{ headers: string[]; rows: CsvCell[][] }>;
};

const EXPORTERS: Record<string, Exporter> = {
  users: {
    roles: [Role.ADMIN],
    build: async () => {
      const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT });
      return {
        headers: ["ID", "Name", "Email", "Phone", "Role", "Status", "Joined"],
        rows: rows.map((u) => [u.id, u.name, u.email ?? "", u.phone ?? "", u.role, u.status, iso(u.createdAt)]),
      };
    },
  },
  appointments: {
    roles: [Role.ADMIN],
    build: async () => {
      const rows = await prisma.appointment.findMany({
        orderBy: { scheduledFor: "desc" },
        take: LIMIT,
        include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
      });
      return {
        headers: ["ID", "Scheduled", "Doctor", "Patient", "Mode", "Status", "Fee (PKR)", "Created"],
        rows: rows.map((a) => [a.id, iso(a.scheduledFor), a.doctor.user.name, a.patient.user.name, a.mode, a.status, rupees(a.feePaisa), iso(a.createdAt)]),
      };
    },
  },
  "pharmacy-orders": {
    roles: [Role.ADMIN],
    build: async () => {
      const rows = await prisma.pharmacyOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        include: { patient: { include: { user: true } }, pharmacy: true },
      });
      return {
        headers: ["ID", "Patient", "Pharmacy", "Status", "Subtotal (PKR)", "Delivery (PKR)", "Total (PKR)", "City", "Created"],
        rows: rows.map((o) => [o.id, o.patient.user.name, o.pharmacy.name, o.status, rupees(o.subtotalPaisa), rupees(o.deliveryPaisa), rupees(o.totalPaisa), o.cityName ?? "", iso(o.createdAt)]),
      };
    },
  },
  "lab-bookings": {
    roles: [Role.ADMIN],
    build: async () => {
      const rows = await prisma.labBooking.findMany({
        orderBy: { scheduledFor: "desc" },
        take: LIMIT,
        include: { patient: { include: { user: true } }, lab: true, test: true },
      });
      return {
        headers: ["ID", "Patient", "Lab", "Test", "Mode", "Status", "Price (PKR)", "Scheduled", "Created"],
        rows: rows.map((b) => [b.id, b.patient.user.name, b.lab.name, b.test.nameEn, b.mode, b.status, rupees(b.pricePaisa), iso(b.scheduledFor), iso(b.createdAt)]),
      };
    },
  },
  transactions: {
    roles: [Role.ADMIN, Role.FINANCE],
    build: async () => {
      const rows = await prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        include: { payer: true },
      });
      return {
        headers: ["ID", "Kind", "Status", "Gross (PKR)", "Commission (PKR)", "Net (PKR)", "Method", "Earner Role", "Payer", "Created"],
        rows: rows.map((t) => [t.id, t.kind, t.status, rupees(t.grossPaisa), rupees(t.commissionPaisa), rupees(t.netPaisa), t.provider ?? "", t.providerRole ?? "", t.payer?.name ?? "", iso(t.createdAt)]),
      };
    },
  },
  withdrawals: {
    roles: [Role.ADMIN, Role.FINANCE],
    build: async () => {
      const rows = await prisma.withdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        include: { provider: true },
      });
      return {
        headers: ["ID", "Provider", "Role", "Amount (PKR)", "Bank", "Account Title", "Account #", "Status", "Requested", "Paid"],
        rows: rows.map((w) => [w.id, w.provider?.name ?? "", w.providerRole, rupees(w.amountPaisa), w.bankName, w.accountTitle, w.accountNumber, w.status, iso(w.createdAt), iso(w.paidAt)]),
      };
    },
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const exporter = EXPORTERS[type];
  if (!exporter) return NextResponse.json({ error: "Unknown export type." }, { status: 404 });

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  if (!exporter.roles.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const { headers, rows } = await exporter.build();
  const csv = toCsv(headers, rows);

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "data.exported",
      targetType: "Export",
      targetId: type,
      meta: { rows: rows.length },
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gbelaaj-${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
