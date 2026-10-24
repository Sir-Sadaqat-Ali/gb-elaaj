import type { NavItem } from "@/components/layout/sidebar";

export const FINANCE_NAV: NavItem[] = [
  { kind: "section", label: "Finance" },
  { kind: "link", id: "home", icon: "Home", href: "/finance/dashboard", label: "Overview" },
  { kind: "link", id: "notif", icon: "Bell", href: "/finance/notifications", label: "Notifications" },
  { kind: "link", id: "tx", icon: "ClipboardList", href: "/finance/transactions", label: "Transactions" },
  { kind: "link", id: "wd", icon: "Wallet", href: "/finance/withdrawals", label: "Withdrawals" },
  { kind: "link", id: "comm", icon: "BarChart3", href: "/finance/commission-reports", label: "Commission reports" },
];
