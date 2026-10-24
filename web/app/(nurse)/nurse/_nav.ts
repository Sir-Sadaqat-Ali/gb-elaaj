import type { NavItem } from "@/components/layout/sidebar";

export const NURSE_NAV: NavItem[] = [
  { kind: "section", label: "Visits" },
  { kind: "link", id: "home", icon: "Home", href: "/nurse/dashboard", label: "Today" },
  { kind: "link", id: "notif", icon: "Bell", href: "/nurse/notifications", label: "Notifications" },
  { kind: "link", id: "asg", icon: "Calendar", href: "/nurse/assignments", label: "Assignments" },
  { kind: "link", id: "loc", icon: "MapPin", href: "/nurse/location", label: "Location" },
  { kind: "section", label: "Earnings" },
  { kind: "link", id: "earn", icon: "Wallet", href: "/nurse/earnings", label: "Earnings" },
  { kind: "link", id: "wd", icon: "BarChart3", href: "/nurse/withdrawals", label: "Withdrawals" },
];
