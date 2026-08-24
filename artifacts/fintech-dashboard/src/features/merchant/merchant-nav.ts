import {
  Activity,
  ArrowLeftRight,
  Bot,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type MerchantNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type MerchantNavSection = {
  title: string;
  items: MerchantNavItem[];
};

export const MERCHANT_NAV_SECTIONS: MerchantNavSection[] = [
  { title: "Overview", items: [
    { href: "/merchant", label: "Dashboard", description: "Merchant workspace home", icon: LayoutDashboard },
    { href: "/merchant/safepay", label: "SafePay Protection", description: "Real-time payment simulator", icon: Zap },
    { href: "/merchant/risk", label: "Risk Center", description: "Risk operations queue", icon: ShieldAlert },
  ] },
  { title: "Operations", items: [
    { href: "/merchant/transactions", label: "Transactions", description: "Payment activity", icon: ArrowLeftRight },
    { href: "/merchant/customers", label: "Customers", description: "Customer profiles", icon: Users },
    { href: "/merchant/returns", label: "Returns & Chargebacks", description: "Dispute operations", icon: FileWarning },
  ] },
  { title: "Intelligence", items: [
    { href: "/merchant/investigations", label: "Investigations", description: "Case management", icon: Search },
    { href: "/merchant/agent", label: "AI Risk Agent", description: "Agent workspace", icon: Bot },
    { href: "/merchant/rules", label: "Risk Rules", description: "Policy controls", icon: SlidersHorizontal },
  ] },
  { title: "Analytics", items: [
    { href: "/merchant/analytics", label: "Risk Analytics", description: "Reporting workspace", icon: Activity },
    { href: "/merchant/model-performance", label: "Model Performance", description: "Model governance", icon: Settings2 },
    { href: "/merchant/audit", label: "Audit Logs", description: "Operational history", icon: ClipboardList },
  ] },
];


export const MERCHANT_NAV_ITEMS = MERCHANT_NAV_SECTIONS.flatMap((section) => section.items);
