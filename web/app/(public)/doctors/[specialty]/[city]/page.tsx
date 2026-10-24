import { DoctorsListing, type DoctorsSearchParams } from "@/components/doctors/doctors-listing";

export const metadata = { title: "Doctors by city", description: "Verified specialists in your city across Pakistan." };

export default async function DoctorsBySpecialtyCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ specialty: string; city: string }>;
  searchParams: Promise<DoctorsSearchParams>;
}) {
  const { specialty, city } = await params;
  return <DoctorsListing params={await searchParams} scopedSpecialty={specialty} scopedCity={city} />;
}
