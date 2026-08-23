import { MERCHANT_NAV_ITEMS } from "./merchant-nav";
import { MerchantPlaceholderPage } from "./MerchantPlaceholderPage";
import { SentinelDashboard } from "./components/SentinelDashboard";

function createMerchantPage(href: string) {
  const item = MERCHANT_NAV_ITEMS.find((navItem) => navItem.href === href);
  if (!item) throw new Error(`Missing merchant navigation item for ${href}`);

  return function MerchantPage() {
    return <MerchantPlaceholderPage title={item.label} description={item.description} icon={item.icon} />;
  };
}

export const MerchantOverviewPage = SentinelDashboard;
export const MerchantRiskPage = createMerchantPage("/merchant/risk");
export const MerchantTransactionsPage = createMerchantPage("/merchant/transactions");
export const MerchantCustomersPage = createMerchantPage("/merchant/customers");
export const MerchantInvestigationsPage = createMerchantPage("/merchant/investigations");
export const MerchantReturnsPage = createMerchantPage("/merchant/returns");
export const MerchantAnalyticsPage = createMerchantPage("/merchant/analytics");
export const MerchantAgentPage = createMerchantPage("/merchant/agent");
export const MerchantRulesPage = createMerchantPage("/merchant/rules");
export const MerchantModelPerformancePage = createMerchantPage("/merchant/model-performance");
export const MerchantAuditPage = createMerchantPage("/merchant/audit");

