import { DoctorsListing, type DoctorsSearchParams } from "@/components/doctors/doctors-listing";

export const metadata = { title: "Find verified doctors", description: "Search PMDC-verified doctors across Pakistan by specialty, city, fee, and availability. Live slots updated every 60 seconds." };

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<DoctorsSearchParams>;
}) {
  return <DoctorsListing params={await searchParams} />;
}
