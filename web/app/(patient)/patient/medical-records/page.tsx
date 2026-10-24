import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PATIENT_NAV } from "@/app/(patient)/patient/_nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { FileDownloadButton } from "@/components/uploads/file-download-button";
import { PatientDocumentUpload } from "@/components/uploads/patient-document-upload";
import { formatDate } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export const metadata = { title: "Medical Records" };

export default async function MedicalRecordsPage() {
  const session = await requireRole("PATIENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!me?.patient) return null;

  const records = await prisma.medicalRecord.findMany({
    where: { patientId: me.patient.id },
    include: { doctor: { include: { user: true } } },
    orderBy: { recordedAt: "desc" },
  });

  return (
    <AppShell
      navItems={PATIENT_NAV}
      user={{ name: me.name, role: "Patient", image: me.image }}
      title="Medical records"
      subtitle="Prescriptions, lab reports, vitals — encrypted and yours forever."
    >
      <Card className="mb-4 p-5">
        <h2 className="text-[14px] font-semibold text-ge-ink">Upload a document</h2>
        <p className="mt-1 text-[12px] text-ge-muted">Add your own reports or scans so your doctors can see them during consultations.</p>
        <div className="mt-4 max-w-lg"><PatientDocumentUpload /></div>
      </Card>

      {records.length === 0 ? (
        <EmptyState icon={FileText} title="No records yet" body="Records appear here after consultations and lab reports — or upload your own above." />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ge-soft-bg text-ge-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13.5px] font-semibold text-ge-ink">{r.title}</h3>
                  <Badge variant="info">{r.type.replace("_", " ")}</Badge>
                </div>
                {r.body && <p className="mt-1 text-[12.5px] leading-relaxed text-ge-muted">{r.body}</p>}
                <p className="mt-1 text-[11px] text-ge-muted">
                  {formatDate(r.recordedAt)} {r.doctor && `· ${r.doctor.user.name}`}
                </p>
              </div>
              {r.fileKey && <FileDownloadButton id={r.id} kind="medical-record" label="File" />}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
