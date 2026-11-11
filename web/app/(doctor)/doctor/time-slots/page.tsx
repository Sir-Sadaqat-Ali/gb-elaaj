import { redirect } from "next/navigation";

export default function DoctorTimeSlotsRedirect() {
  redirect("/doctor/schedule");
}
