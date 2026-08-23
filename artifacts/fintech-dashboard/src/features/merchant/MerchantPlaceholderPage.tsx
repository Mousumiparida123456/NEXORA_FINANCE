import type { LucideIcon } from "lucide-react";

interface MerchantPlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function MerchantPlaceholderPage({
  title,
  description,
  icon: Icon,
}: MerchantPlaceholderPageProps) {
  return (
    <section
      className="space-y-6"
      aria-labelledby="merchant-page-title"
    >
      <div className="border-b border-slate-800 pb-5">
        <div className="mt-3 flex items-start gap-3">
          <span className="mt-1 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
            <Icon className="h-5 w-5" />
          </span>

          <div>
            <h1
              id="merchant-page-title"
              className="text-2xl font-bold tracking-tight text-slate-100"
            >
              {title}
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          Workspace foundation ready
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          This area is reserved for the Merchant Intelligence implementation.
        </p>
      </div>
    </section>
  );
}

export default MerchantPlaceholderPage;
