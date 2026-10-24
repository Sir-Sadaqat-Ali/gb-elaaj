import type { NavItem } from "@/components/layout/sidebar";

export const PATIENT_NAV: NavItem[] = [
  { kind: "section", label: "Care" },
  { kind: "link", id: "home", icon: "Home", href: "/patient/dashboard", label: "Dashboard" },
  { kind: "link", id: "doctors", icon: "Stethoscope", href: "/patient/doctors", label: "Doctors" },
  { kind: "link", id: "saved", icon: "Heart", href: "/patient/saved", label: "Saved doctors" },
  { kind: "link", id: "appts", icon: "Calendar", href: "/patient/appointments", label: "Appointments" },
  { kind: "link", id: "records", icon: "FileText", href: "/patient/medical-records", label: "Medical Records" },
  { kind: "section", label: "Services" },
  { kind: "link", id: "labs", icon: "Beaker", href: "/patient/lab-tests", label: "Lab Tests" },
  { kind: "link", id: "lab-reports", icon: "FileText", href: "/patient/lab-reports", label: "Lab Reports" },
  { kind: "link", id: "pharm", icon: "Pill", href: "/patient/pharmacy", label: "Pharmacy" },
  { kind: "link", id: "care", icon: "Heart", href: "/patient/home-care", label: "Home Care" },
  { kind: "section", label: "Insights" },
  { kind: "link", id: "insights", icon: "Activity", href: "/patient/health-insights", label: "Health Insights" },
  { kind: "link", id: "ai", icon: "Sparkles", href: "/patient/ai-assistant", label: "Aafiyat AI" },
  { kind: "section", label: "Account" },
  { kind: "link", id: "notif", icon: "Bell", href: "/patient/notifications", label: "Notifications" },
  { kind: "link", id: "settings", icon: "Settings", href: "/patient/settings", label: "Settings" },
];
