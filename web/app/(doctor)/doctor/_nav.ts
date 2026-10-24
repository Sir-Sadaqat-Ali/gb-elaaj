import type { NavItem } from "@/components/layout/sidebar";

export const DOCTOR_NAV: NavItem[] = [
  { kind: "section", label: "Practice" },
  { kind: "link", id: "home", icon: "Home", href: "/doctor/dashboard", label: "Today" },
  { kind: "link", id: "notif", icon: "Bell", href: "/doctor/notifications", label: "Notifications" },
  { kind: "link", id: "appts", icon: "Calendar", href: "/doctor/appointments", label: "Appointments" },
  { kind: "link", id: "schedule", icon: "Clock", href: "/doctor/schedule", label: "Schedule" },
  { kind: "link", id: "slots", icon: "Layers", href: "/doctor/time-slots", label: "Time slots" },
  { kind: "link", id: "patients", icon: "Users", href: "/doctor/patients", label: "Patients" },
  { kind: "section", label: "Clinical" },
  { kind: "link", id: "labs", icon: "Beaker", href: "/doctor/lab-reports", label: "Lab Reports" },
  { kind: "link", id: "rx", icon: "FileText", href: "/doctor/prescriptions", label: "Prescriptions" },
  { kind: "link", id: "video", icon: "Video", href: "/doctor/video-room", label: "Video room" },
  { kind: "section", label: "Earnings" },
  { kind: "link", id: "earn", icon: "Wallet", href: "/doctor/earnings", label: "Earnings" },
  { kind: "link", id: "wd", icon: "BarChart3", href: "/doctor/withdrawals", label: "Withdrawals" },
  { kind: "section", label: "Profile" },
  { kind: "link", id: "pub", icon: "Stethoscope", href: "/doctor/public-profile", label: "Public profile" },
];
