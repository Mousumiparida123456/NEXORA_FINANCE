import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, RotateCcw, Zap } from "lucide-react";

// ─── AI Response Engine ────────────────────────────────────────────────────────

const RESPONSES: { keywords: string[]; text: string }[] = [
  {
    keywords: ["save", "saving", "savings", "cut", "spend less"],
    text: `Great question! Here are my top money-saving strategies:\n\n**The 50/30/20 Rule**\n• 50% for needs (rent, food, utilities)\n• 30% for wants (dining out, entertainment)\n• 20% for savings and investments\n\n**Quick wins you can start today:**\n• Set up automatic transfers on payday — pay yourself first\n• Audit subscriptions monthly and cancel what you don't use\n• Cook at home 4–5 days a week (saves ~$400/month on average)\n• Use cashback credit cards for everyday spending\n\nBased on your profile, you could redirect an extra **$420/month** toward savings with a few spending tweaks. Want a personalized breakdown?`,
  },
  {
    keywords: ["invest", "investing", "investment", "grow money", "wealth"],
    text: `Smart thinking! Here's a beginner-friendly investment roadmap:\n\n**Step 1 — Emergency Fund first**\n3–6 months of expenses in a high-yield savings account.\n\n**Step 2 — Start a SIP (Mutual Funds)**\n• Set and forget — auto-deducts monthly\n• No market timing needed\n• Start with as little as $50/month\n\n**Step 3 — Diversify over time**\n• Index Funds for broad market exposure\n• Gold (5–10%) as an inflation hedge\n• Stocks for long-term aggressive growth\n\nYour profile shows **$2,100/month investable**. Putting $500/month in diversified mutual funds at 10% p.a. can grow to over **$1 million in 30 years**. Head to the Investments page to calculate your exact plan!`,
  },
  {
    keywords: ["credit score", "credit", "fico", "score", "credit card"],
    text: `Your credit score is one of your most important financial assets. Here's what drives it:\n\n**The 5 FICO Factors:**\n• **35%** Payment History — the most critical factor\n• **30%** Credit Utilization — keep it below 30%\n• **15%** Length of History — don't close old cards\n• **10%** Credit Mix — having both loans and cards helps\n• **10%** New Inquiries — avoid applying for multiple cards at once\n\n**Quick boosters:**\n1. Set up auto-pay — even one missed payment hurts badly\n2. Request a credit limit increase (without spending more)\n3. Check your report annually for errors at annualcreditreport.com\n\nYour current score of **750 (Very Good)** qualifies you for excellent loan rates! Visit the Credit Simulator to practice different scenarios.`,
  },
  {
    keywords: ["budget", "budgeting", "plan", "monthly plan"],
    text: `Budgeting is the foundation of financial health — here's a simple system that works:\n\n**Zero-Based Budgeting**\nAssign every dollar a purpose. Income minus all allocations = $0.\n\n**Your estimated breakdown:**\n• Housing: $1,400 (27%)\n• Food & Transport: $700 (13%)\n• Other expenses: $1,000 (19%)\n• **Savings & Investments: $2,100 (40%)** ✅\n\n**Make it stick:**\n• Review your budget every Sunday (takes 5 minutes)\n• Use the Transactions page to track daily spending\n• Give yourself a "guilt-free" spending allowance\n\nThe goal isn't to restrict — it's to ensure your money works intentionally!`,
  },
  {
    keywords: ["sip", "systematic investment", "monthly invest"],
    text: `SIP (Systematic Investment Plan) is one of the most powerful tools for everyday investors!\n\n**How it works:**\nYou invest a fixed amount every month, automatically. Market ups and downs average out over time — this is called **Rupee/Dollar Cost Averaging**.\n\n**Example:**\n• SIP: $300/month\n• Duration: 15 years\n• Expected return: 10% p.a.\n• Total invested: **$54,000**\n• Estimated value: **~$125,000** 📈\n\n**Why SIP beats lump sum for beginners:**\n• No need to time the market\n• Emotions stay out of the equation\n• Flexible — pause or stop anytime\n\nVisit the **Investment Planner** to calculate your perfect SIP amount for any goal!`,
  },
  {
    keywords: ["stock", "stocks", "equity", "share", "market"],
    text: `Stocks offer the highest long-term returns but require patience!\n\n**For beginners, I recommend starting here:**\n1. **Index Funds** — track the whole market, very low fees\n2. **Blue-chip companies** — stable, established businesses\n3. **Avoid individual stock picking** until you understand fundamentals\n\n**Golden rules:**\n• Never invest money you need within 3–5 years\n• Stay invested through market downturns — don't panic sell\n• Diversify across sectors and geographies\n• Avoid checking prices daily (this is harder than it sounds!)\n\n**Beginner-friendly allocation:**\n• 20% Stocks + 50% Mutual Funds + 30% Fixed Deposits\n\nThis is exactly what the Investments page recommends for your risk profile!`,
  },
  {
    keywords: ["emergency", "emergency fund", "safety net"],
    text: `An emergency fund is your #1 financial priority — before any investment!\n\n**How much do you need?**\n3–6 months of monthly expenses.\n\n**Your target:**\n• Minimum (3 months): **$9,300**\n• Ideal (6 months): **$18,600**\n\n**Where to keep it:**\n• ✅ High-yield savings account (4–5% APY)\n• ✅ Liquid mutual fund\n• ❌ NOT in stocks, crypto, or long-term FDs\n\n**Why it matters:**\nWithout a safety net, one job loss or medical bill can derail years of financial progress and force you into debt at high interest rates.\n\nOnce your emergency fund is funded, you can confidently invest your remaining $2,100/month without worry.`,
  },
  {
    keywords: ["debt", "loan", "emi", "borrow", "pay off"],
    text: `Managing debt strategically is just as important as building wealth!\n\n**Priority order:**\n1. Pay off high-interest debt first (credit cards: 18–24% APR)\n2. Maintain minimum payments on all accounts\n3. Never miss an EMI — it devastates your credit score\n\n**The Avalanche Method (mathematically optimal):**\nList all debts by interest rate. Pay maximum toward the highest-rate debt while paying minimums on others. Saves the most money overall.\n\n**The 50/50 Rule (for motivation):**\nIf your debt rate is above 10%, split extra cash:\n• 50% → extra debt payoff\n• 50% → investments\n\nThis keeps you motivated with both progress on debt AND growing wealth simultaneously. What type of debt would you like to tackle?`,
  },
  {
    keywords: ["retirement", "retire", "pension", "old age"],
    text: `Retirement planning — the earlier you start, the easier it gets!\n\n**The Power of Compound Interest:**\n• Start at 25, invest $300/month @ 10% → **$1.9M by 65**\n• Start at 35, invest $300/month @ 10% → **$680K by 65**\n\nStarting just 10 years earlier **nearly triples** your retirement wealth!\n\n**Your retirement roadmap:**\n1. Estimate needs: ~70% of current monthly expenses\n2. Set a retirement age (55? 60? 65?)\n3. Calculate required corpus using the SIP Calculator\n4. Max out tax-advantaged accounts (401k, IRA, Roth IRA) first\n5. Supplement with diversified investments\n\n**Rule of thumb:** Save 15% of your income for retirement. With your investable amount, you're well-positioned. Want me to calculate your retirement number?`,
  },
  {
    keywords: ["gold", "gold etf", "precious metal"],
    text: `Gold is a classic wealth preserver and inflation hedge!\n\n**Why include gold:**\n• Protects against inflation — its value rises when currencies weaken\n• Low correlation with stocks — reduces overall portfolio volatility\n• Globally accepted store of value for 5,000+ years\n\n**Modern ways to invest (no storage hassle!):**\n• **Gold ETFs** — buy/sell on stock exchange like shares\n• **Sovereign Gold Bonds** — earn 2.5% interest + price appreciation + tax benefits\n• **Digital Gold** — buy fractional amounts through apps\n\n**How much gold should you hold?**\nMost experts recommend **5–10% of your portfolio** in gold.\n\nThink of gold as portfolio insurance — not the growth engine. Combine it with stocks and mutual funds for a balanced approach!`,
  },
  {
    keywords: ["tax", "taxes", "save tax", "tax saving"],
    text: `Smart tax planning can save you thousands every year — legally!\n\n**Top tax-saving strategies:**\n\n**1. Max out retirement contributions**\n• 401(k): Up to $23,000/year (pre-tax)\n• Traditional IRA: Up to $7,000/year\n• Reduces your taxable income dollar-for-dollar\n\n**2. Health Savings Account (HSA)**\n• Triple tax advantage: deductible contributions, tax-free growth, tax-free withdrawals for medical expenses\n\n**3. Tax-loss harvesting**\n• Sell losing investments to offset capital gains\n• Can offset up to $3,000 of ordinary income annually\n\n**4. Municipal Bonds**\n• Interest is federal tax-exempt\n\nTax efficiency can add 1–2% to your effective annual returns — that compounds significantly over time!`,
  },
  {
    keywords: ["mutual fund", "mf", "fund"],
    text: `Mutual funds are one of the best starting points for new investors!\n\n**What is a mutual fund?**\nA pool of money from thousands of investors, managed by a professional fund manager who invests in a diversified mix of stocks, bonds, and other assets.\n\n**Types to know:**\n• **Equity funds** — invest in stocks, higher risk + returns (10–15%)\n• **Debt funds** — invest in bonds, lower risk + stable returns (6–8%)\n• **Hybrid/Balanced funds** — mix of both, great for beginners\n• **Index funds** — track a market index (Nifty/S&P500), lowest fees\n\n**For beginners, start with:**\n1. A large-cap index fund (low cost, market returns)\n2. A balanced/hybrid fund (built-in diversification)\n\nSet up a SIP and let compounding do the rest!`,
  },
];

const FALLBACK_RESPONSES = [
  `That's a thoughtful question! Let me give you some context:\n\nFinancial wellness is about three things working together:\n1. **Spend less than you earn** — build a gap between income and expenses\n2. **Protect what you have** — emergency fund + insurance\n3. **Grow what's left** — invest wisely and consistently\n\nBased on your profile, you're already doing well with a $2,100/month investable surplus (40% of income). That puts you ahead of most people!\n\nWould you like to explore any specific area — saving, investing, credit, or retirement planning?`,
  `Great question! The key to financial health is consistency over perfection.\n\nHere's my simple framework:\n• **Automate everything** — savings, investments, bill payments\n• **Review monthly** — 30 minutes a month is all it takes\n• **Stay diversified** — never concentrate risk in one place\n• **Think long-term** — ignore short-term market noise\n\nYour NEXORA dashboard gives you all the tools to track this in real time. Is there a specific financial goal you're working toward?`,
];

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How can I save money?",
  "Where should I invest?",
  "How do I improve my credit score?",
  "What is a SIP?",
  "How much emergency fund do I need?",
  "How do I start investing with $100?",
];

function localizeCurrencyToINR(text: string) {
  return text
    .replaceAll("Rupee/Dollar Cost Averaging", "Rupee Cost Averaging")
    .replaceAll("dollar-for-dollar", "rupee-for-rupee")
    .replaceAll("every dollar", "every rupee")
    .replaceAll("Dollar", "Rupee")
    .replaceAll("dollar", "rupee")
    .replaceAll("USD", "INR")
    .replaceAll("$", "₹");
}

function getAIResponse(input: string): string {
  const q = input.toLowerCase();
  for (const r of RESPONSES) {
    if (r.keywords.some((k) => q.includes(k))) return localizeCurrencyToINR(r.text);
  }
  return localizeCurrencyToINR(
    FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
  );
}

// ─── Markdown-lite renderer ────────────────────────────────────────────────────
function renderText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-slate-500"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: `Hello! I'm **FinBot**, your personal finance assistant. 👋\n\nI can help you with:\n• Saving money and building budgets\n• Investment strategies for beginners\n• Understanding your credit score\n• Retirement and SIP planning\n• Debt management tips\n\nWhat's on your financial mind today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setShowSuggestions(false);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      const aiText = getAIResponse(trimmed);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: aiText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, [isTyping]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleReset() {
    setMessages([{
      id: "welcome-reset",
      role: "ai",
      text: `Hello again! I'm FinBot, ready to help. What would you like to explore?`,
      timestamp: new Date(),
    }]);
    setInput("");
    setIsTyping(false);
    setShowSuggestions(true);
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-full max-h-screen">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800/60 bg-[#0f172a]/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0f172a]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100">FinBot</h1>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                AI Finance Assistant · Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1.5">
              <Zap className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] font-semibold text-violet-400">Powered by FinAI</span>
            </div>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.role === "ai" ? (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500/15 border border-emerald-500/25 text-slate-200 rounded-tr-sm"
                        : "bg-slate-800/60 border border-slate-700/40 text-slate-300 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "ai"
                      ? <span className="whitespace-pre-line">{renderText(msg.text)}</span>
                      : msg.text
                    }
                  </div>
                  <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested questions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex-shrink-0 px-4 pb-3"
          >
            <div className="max-w-3xl mx-auto">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => {
                  const label = localizeCurrencyToINR(s);
                  return (
                  <button
                    key={s}
                    onClick={() => sendMessage(label)}
                    disabled={isTyping}
                    className="rounded-full bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all disabled:opacity-40"
                  >
                    {label}
                  </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-slate-800/60 bg-[#0f172a]/90 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 focus-within:border-emerald-500/40 focus-within:bg-slate-900/80 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about money, investing, or budgeting..."
              rows={1}
              data-testid="input-chat"
              className="flex-1 resize-none bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none leading-relaxed max-h-32"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              data-testid="button-send-chat"
              className="flex-shrink-0 h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-700 mt-2">
            FinBot provides general financial education — not personalized financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
