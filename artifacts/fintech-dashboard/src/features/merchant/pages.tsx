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

import { RiskCenterPage } from "./pages/RiskCenterPage";
import { InvestigationsPage } from "./pages/InvestigationsPage";
import { ModelPerformancePage } from "./pages/ModelPerformancePage";

export const MerchantOverviewPage = SentinelDashboard;
export const MerchantRiskPage = RiskCenterPage;
export const MerchantTransactionsPage = createMerchantPage("/merchant/transactions");
export const MerchantCustomersPage = createMerchantPage("/merchant/customers");
export const MerchantInvestigationsPage = InvestigationsPage;
export const MerchantReturnsPage = createMerchantPage("/merchant/returns");
export const MerchantAnalyticsPage = createMerchantPage("/merchant/analytics");
export const MerchantAgentPage = createMerchantPage("/merchant/agent");
export const MerchantRulesPage = createMerchantPage("/merchant/rules");
export const MerchantModelPerformancePage = ModelPerformancePage;
export const MerchantAuditPage = createMerchantPage("/merchant/audit");

