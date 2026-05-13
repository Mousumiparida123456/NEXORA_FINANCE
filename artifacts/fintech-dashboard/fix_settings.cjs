const fs = require('fs');
let code = fs.readFileSync('c:/Users/HP/Desktop/NEXORA_FINANCE-main/NEXORA_FINANCE-main/artifacts/fintech-dashboard/src/pages/Settings.tsx', 'utf-8');

const regex = /<SectionTitle icon=\{BarChart2\} title="Risk Tolerance" subtitle="How comfortable are you with investment risk\?" \/>[\s\S]*?(?=<!-- Investment Style -->|<SectionTitle)/g;

const replacement = `<SectionTitle icon={BarChart2} title="Risk Tolerance" subtitle="How comfortable are you with investment risk?" />
        {loadingPersisted && <p className="mb-3 text-xs text-slate-500">Loading your saved preferences...</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RISK_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRisk(opt.id)}
              className={\`rounded-2xl border p-4 text-left transition-all \${risk === opt.id ? \`\${opt.bg} \${opt.border}\` : "border-slate-800/60 bg-slate-800/30 hover:border-slate-700/60"}\`}
            >
              <p className={\`text-sm font-bold mb-1 \${risk === opt.id ? opt.color : "text-slate-400"}\`}>{opt.label}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
              <div className="mt-3 flex items-center gap-1">
                {RISK_OPTIONS.map((_, i) => (
                  <div key={i} className={\`h-1 flex-1 rounded-full transition-all \${i <= RISK_OPTIONS.indexOf(opt) ? (risk === opt.id ? opt.color.replace("text-", "bg-") : "bg-slate-600") : "bg-slate-800"}\`} />
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
          <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-medium">Beginner tip: </span>
            If you're just starting out, Low or Medium risk is recommended. You can always increase it as you gain confidence.
          </p>
        </div>
      </Card>

      {/* Investment Style */}
`;

code = code.replace(regex, replacement);
fs.writeFileSync('c:/Users/HP/Desktop/NEXORA_FINANCE-main/NEXORA_FINANCE-main/artifacts/fintech-dashboard/src/pages/Settings.tsx', code);
console.log('Fixed Settings.tsx');
