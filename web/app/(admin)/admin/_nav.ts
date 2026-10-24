import type { NavItem } from "@/components/layout/sidebar";

export const ADMIN_NAV: NavItem[] = [
  { kind: "section", label: "Overview" },
  { kind: "link", id: "home", icon: "Home", href: "/admin/dashboard", label: "Dashboard" },
  { kind: "link", id: "notif", icon: "Bell", href: "/admin/notifications", label: "Notifications" },
  { kind: "link", id: "search", icon: "Search", href: "/admin/search", label: "Search" },
  { kind: "link", id: "users", icon: "Users", href: "/admin/users", label: "Users" },
  { kind: "section", label: "Providers" },
  { kind: "link", id: "doctors", icon: "Stethoscope", href: "/admin/doctors", label: "Doctors" },
  { kind: "link", id: "verif", icon: "ShieldCheck", href: "/admin/doctor-verification", label: "Doctor verification" },
  { kind: "link", id: "nurses", icon: "Heart", href: "/admin/nurse-assignment", label: "Nurse assignment" },
  { kind: "link", id: "nurse-tracking", icon: "MapPin", href: "/admin/nurse-tracking", label: "Nurse tracking" },
  { kind: "link", id: "roles", icon: "Layers", href: "/admin/roles", label: "Roles" },
  { kind: "section", label: "Operations" },
  { kind: "link", id: "appts", icon: "Calendar", href: "/admin/appointments", label: "Appointments" },
  { kind: "link", id: "orders", icon: "Truck", href: "/admin/orders", label: "Pharmacy orders" },
  { kind: "link", id: "labs", icon: "Beaker", href: "/admin/lab-bookings", label: "Lab bookings" },
  { kind: "link", id: "fin", icon: "Wallet", href: "/admin/finance", label: "Finance" },
  { kind: "link", id: "rev", icon: "ClipboardList", href: "/admin/reviews", label: "Reviews" },
  { kind: "section", label: "System" },
  { kind: "link", id: "audit", icon: "Activity", href: "/admin/audit-log", label: "Audit log" },
  { kind: "link", id: "settings", icon: "Settings", href: "/admin/settings", label: "Settings" },
];
