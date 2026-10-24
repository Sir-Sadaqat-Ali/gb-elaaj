import type { NavItem } from "@/components/layout/sidebar";

export const LAB_NAV: NavItem[] = [
  { kind: "section", label: "Lab" },
  { kind: "link", id: "home", icon: "Home", href: "/lab-admin/dashboard", label: "Overview" },
  { kind: "link", id: "notif", icon: "Bell", href: "/lab-admin/notifications", label: "Notifications" },
  { kind: "link", id: "book", icon: "Calendar", href: "/lab-admin/bookings", label: "Bookings" },
  { kind: "link", id: "rep", icon: "FileText", href: "/lab-admin/reports", label: "Reports" },
  { kind: "link", id: "cat", icon: "Layers", href: "/lab-admin/test-catalog", label: "Test catalog" },
  { kind: "section", label: "Earnings" },
  { kind: "link", id: "earn", icon: "Wallet", href: "/lab-admin/earnings", label: "Earnings" },
  { kind: "link", id: "wd", icon: "BarChart3", href: "/lab-admin/withdrawals", label: "Withdrawals" },
  { kind: "section", label: "Account" },
  { kind: "link", id: "settings", icon: "Settings", href: "/lab-admin/settings", label: "Settings" },
];
