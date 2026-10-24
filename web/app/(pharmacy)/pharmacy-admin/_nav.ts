import type { NavItem } from "@/components/layout/sidebar";

export const PHARMACY_NAV: NavItem[] = [
  { kind: "section", label: "Pharmacy" },
  { kind: "link", id: "home", icon: "Home", href: "/pharmacy-admin/dashboard", label: "Overview" },
  { kind: "link", id: "notif", icon: "Bell", href: "/pharmacy-admin/notifications", label: "Notifications" },
  { kind: "link", id: "orders", icon: "Truck", href: "/pharmacy-admin/orders", label: "Orders" },
  { kind: "link", id: "inv", icon: "Layers", href: "/pharmacy-admin/inventory", label: "Inventory" },
  { kind: "link", id: "meds", icon: "Pill", href: "/pharmacy-admin/medicines", label: "Medicines" },
  { kind: "section", label: "Earnings" },
  { kind: "link", id: "earn", icon: "Wallet", href: "/pharmacy-admin/earnings", label: "Earnings" },
  { kind: "link", id: "wd", icon: "BarChart3", href: "/pharmacy-admin/withdrawals", label: "Withdrawals" },
  { kind: "section", label: "Account" },
  { kind: "link", id: "settings", icon: "Settings", href: "/pharmacy-admin/settings", label: "Settings" },
];
