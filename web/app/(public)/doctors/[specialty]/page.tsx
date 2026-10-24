import { DoctorsListing, type DoctorsSearchParams } from "@/components/doctors/doctors-listing";

export const metadata = { title: "Doctors by specialty", description: "Verified specialists by medical specialty across Pakistan." };

export default async function DoctorsBySpecialtyPage({
  params,
  searchParams,
}: {
  params: Promise<{ specialty: string }>;
  searchParams: Promise<DoctorsSearchParams>;
}) {
  const { specialty } = await params;
  return <DoctorsListing params={await searchParams} scopedSpecialty={specialty} />;
}
