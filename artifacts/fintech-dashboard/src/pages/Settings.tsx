import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, IndianRupee, Target, Camera,
  TrendingUp, PiggyBank, BarChart2,
  ShieldCheck, Lock, Smartphone, LogOut,
  Database, Download, RefreshCw, Link2,
  CheckCircle2, AlertTriangle, Eye, EyeOff,
  ChevronRight, Info, X, Wifi, Building2,
} from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const formatINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// ─── Tab config ────────────────────────────────────────────────────────────────

type Tab = "profile" | "preferences" | "security" | "data";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",     label: "Profile",      icon: User        },
  { id: "preferences", label: "Preferences",  icon: TrendingUp  },
  { id: "security",    label: "Security",     icon: ShieldCheck },
  { id: "data",        label: "Financial Data", icon: Database  },
];

// ─── Shared UI pieces ──────────────────────────────────────────────────────────

function Label({ children, helper }: { children: React.ReactNode; helper?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-xs font-semibold text-slate-300 tracking-wide">{children}</label>
      {helper && <p className="text-[11px] text-slate-500 mt-0.5">{helper}</p>}
    </div>
  );
}

function Input({
  type = "text", value, onChange, placeholder, disabled = false,
}: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600
        focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all
        disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

function PasswordInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 pr-11 text-sm text-slate-100 placeholder:text-slate-600
          focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SaveButton({
  onClick, saved, loading, label = "Save Changes",
}: { onClick: () => void; saved: boolean; loading: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95
        ${saved
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
        } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
      {loading ? "Saving…" : saved ? "Saved!" : label}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800/60 bg-[#1e293b]/70 p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-9 w-9 rounded-xl bg-slate-700/60 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4.5 w-4.5 h-[18px] w-[18px] text-emerald-400" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Confirmation Dialog ───────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, body, confirmLabel, danger = false,
  onConfirm, onCancel,
}: {
  open: boolean; title: string; body: string;
  confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-[#1e293b] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-rose-500/15" : "bg-amber-500/15"}`}>
                <AlertTriangle className={`h-5 w-5 ${danger ? "text-rose-400" : "text-amber-400"}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95
                  ${danger ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-amber-500 text-slate-900 hover:bg-amber-400"}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Profile Section ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, setUser } = useDashboard();
  const { toast } = useToast();
  const [name, setName]     = useState(user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : "John Doe");
  const [email, setEmail]   = useState(user?.email || "john.doe@example.com");
  const [income, setIncome] = useState(user?.monthlyIncome || "0");
  const [goals, setGoals]   = useState(user?.financialGoals || "Save for a home down payment and build a 6-month emergency fund.");
  const [avatar, setAvatar] = useState(user?.profileImageUrl || "https://i.pravatar.cc/150?u=a042581f4e29026704d");
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPersisted, setLoadingPersisted] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : "John Doe");
      setEmail(user.email || "john.doe@example.com");
      setIncome(user.monthlyIncome || "0");
      setGoals(user.financialGoals || "Save for a home down payment and build a 6-month emergency fund.");
      if (user.profileImageUrl) setAvatar(user.profileImageUrl);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.getUserData();
        const profile = data?.profile || {};
        if (!mounted) return;
        if (profile.name) setName(profile.name);
        if (profile.email) setEmail(profile.email);
        if (profile.income) setIncome(String(profile.income));
        if (profile.goals) setGoals(profile.goals);
        if (profile.avatar) setAvatar(profile.avatar);
      } catch {
        // no-op
      } finally {
        if (mounted) setLoadingPersisted(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result) setAvatar(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const names = name.split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ");
      
      const { user: updatedUser } = await api.updateUserData({
        email,
        firstName,
        lastName,
        monthlyIncome: income,
        profileImageUrl: avatar,
        financialGoals: goals,
      });
      await api.upsertUserData({
        ...(user?.preferences || {}),
        profile: { name, email, income, goals, avatar },
      });
      
      setUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Save failed",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={User} title="Personal Information" subtitle="Update your name, email, and avatar" />
        {loadingPersisted && <p className="mb-3 text-xs text-slate-500">Loading your saved profile...</p>}

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-800/60">
          <div className="relative flex-shrink-0">
            <img
              src={avatar}
              alt="Avatar"
              className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-700/60 ring-2 ring-emerald-500/20"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-slate-900 hover:bg-emerald-400 transition-all"
            >
              <Camera className="h-3.5 w-3.5 text-slate-950" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Change photo
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 pl-9 text-sm text-slate-100
                  focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <Label>Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 pl-9 text-sm text-slate-100
                  focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <Label helper="Used to calculate your savings rate and budget">Monthly Income (INR)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 pl-9 text-sm text-slate-100
                  focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <Label helper="Optional — helps us personalise your dashboard">Financial Goals</Label>
            <div className="relative">
              <Target className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={2}
                placeholder="e.g. Save for a house, retire at 50…"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 pl-9 text-sm text-slate-100 placeholder:text-slate-600 resize-none
                  focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-5 border-t border-slate-800/60">
          <SaveButton onClick={handleSave} saved={saved} loading={loading} />
        </div>
      </Card>
    </div>
  );
}

// ─── Preferences Section ───────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high";
type InvestStyle = "safe" | "balanced" | "aggressive";

const RISK_OPTIONS: { id: RiskLevel; label: string; desc: string; color: string; bg: string; border: string }[] = [
  { id: "low",    label: "Low",    desc: "Capital preservation; minimal market exposure", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { id: "medium", label: "Medium", desc: "Balanced growth with moderate risk tolerance",  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"    },
  { id: "high",   label: "High",   desc: "Aggressive growth; comfortable with volatility", color: "text-amber-400", bg: "bg-amber-500/10",   border: "border-amber-500/30"  },
];

const STYLE_OPTIONS: { id: InvestStyle; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "safe",       label: "Safe",       desc: "FDs, bonds, liquid funds — very low risk", icon: ShieldCheck },
  { id: "balanced",   label: "Balanced",   desc: "Mix of equity and debt — moderate growth",  icon: BarChart2   },
  { id: "aggressive", label: "Aggressive", desc: "Heavy equity, crypto exposure — high reward", icon: TrendingUp },
];

function PreferencesSection() {
  const { user, setUser } = useDashboard();
  const { toast } = useToast();
  const [risk, setRisk]         = useState<RiskLevel>((user?.riskLevel as RiskLevel) || "medium");
  const [savingsGoal, setSavings] = useState<number>(user?.savingsGoal ?? 15000);
  const [style, setStyle]       = useState<InvestStyle>((user?.investStyle as InvestStyle) || "balanced");
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [loadingPersisted, setLoadingPersisted] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.riskLevel) setRisk(user.riskLevel as RiskLevel);
    if (typeof user.savingsGoal === "number") setSavings(user.savingsGoal);
    if (user.investStyle) setStyle(user.investStyle as InvestStyle);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.getUserData();
        const prefs = data?.preferences || {};
        if (!mounted) return;
        if (prefs.riskLevel) setRisk(prefs.riskLevel as RiskLevel);
        if (typeof prefs.savingsGoal === "number") setSavings(prefs.savingsGoal);
        if (prefs.investStyle) setStyle(prefs.investStyle as InvestStyle);
      } catch {
        // no-op
      } finally {
        if (mounted) setLoadingPersisted(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      const { user: updatedUser } = await api.updateUserData({
        riskLevel: risk,
        savingsGoal,
        investStyle: style,
      });
      await api.upsertUserData({
        ...(user?.preferences || {}),
        preferences: { riskLevel: risk, savingsGoal, investStyle: style },
      });
      setUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Save failed",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Risk Level */}
      <Card>
        <SectionTitle icon={BarChart2} title="Risk Tolerance" subtitle="How comfortable are you with investment risk?" />
        {loadingPersisted && <p className="mb-3 text-xs text-slate-500">Loading your saved preferences...</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RISK_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRisk(opt.id)}
              className={`rounded-2xl border p-4 text-left transition-all
                ${risk === opt.id ? `${opt.bg} ${opt.border}` : "border-slate-800/60 bg-slate-800/30 hover:border-slate-700/60"}`}
            >
              <p className={`text-sm font-bold mb-1 ${risk === opt.id ? opt.color : "text-slate-400"}`}>{opt.label}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
              <div className="mt-3 flex items-center gap-1">
                {RISK_OPTIONS.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    i <= RISK_OPTIONS.indexOf(opt)
                      ? risk === opt.id ? opt.color.replace("text-", "bg-") : "bg-slate-600"
                      : "bg-slate-800"
                  }`} />
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

      {/* Monthly Savings Goal */}
      <Card>
        <SectionTitle icon={PiggyBank} title="Monthly Savings Goal" subtitle="How much do you aim to save each month?" />
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">{formatINR.format(1000)}</span>
          <span className="text-2xl font-black text-emerald-400">{formatINR.format(savingsGoal)}</span>
          <span className="text-xs text-slate-500">{formatINR.format(100000)}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={100000}
          step={500}
          value={savingsGoal}
          onChange={(e) => setSavings(Number(e.target.value))}
          className="w-full accent-emerald-500 h-2 rounded-full cursor-pointer"
        />
        <div className="flex items-start gap-2 mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
          <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-medium">Beginner tip: </span>
            A common rule is the 50/30/20 method — save at least 20% of your income. On your income, that would be
            <span className="text-emerald-400 font-semibold"> ₹2,490/month</span>.
          </p>
        </div>
      </Card>

      {/* Investment Style */}
      <Card>
        <SectionTitle icon={TrendingUp} title="Investment Style" subtitle="How do you prefer to grow your money?" />
        <div className="space-y-2.5">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStyle(opt.id)}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all
                ${style === opt.id
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "border-slate-800/60 bg-slate-800/30 hover:border-slate-700/60"}`}
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0
                ${style === opt.id ? "bg-emerald-500/20" : "bg-slate-700/50"}`}>
                <opt.icon className={`h-4 w-4 ${style === opt.id ? "text-emerald-400" : "text-slate-500"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${style === opt.id ? "text-emerald-300" : "text-slate-300"}`}>{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${style === opt.id ? "border-emerald-400 bg-emerald-400" : "border-slate-600"}`}>
                {style === opt.id && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
          <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-medium">Beginner tip: </span>
            "Balanced" is great for most investors — it spreads your money across growth assets and stable instruments,
            reducing the impact of market swings.
          </p>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton onClick={handleSave} saved={saved} loading={loading} label="Save Preferences" />
      </div>
    </div>
  );
}

// ─── Security Section ──────────────────────────────────────────────────────────

function SecuritySection() {
  const { user, setUser } = useDashboard();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [twoFA, setTwoFA]         = useState(Boolean(user?.twoFactorEnabled));
  const [pwSaved, setPwSaved]     = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState("");
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [loggedOut, setLoggedOut]       = useState(false);
  const [twoFADialog, setTwoFADialog]   = useState(false);
  const [twoFAPending, setTwoFAPending] = useState(false);

  function handleChangePassword() {
    setPwError("");
    if (!currentPw) return setPwError("Please enter your current password.");
    if (newPw.length < 8) return setPwError("New password must be at least 8 characters.");
    if (newPw !== confirmPw) return setPwError("Passwords don't match.");
    setPwLoading(true);
    setTimeout(() => {
      setPwLoading(false); setPwSaved(true); setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSaved(false), 2500);
    }, 900);
  }

  function handleToggle2FA() {
    if (!twoFA) { setTwoFADialog(true); setTwoFAPending(true); }
    else {
      setTwoFA(false);
      api.updateUserData({ twoFactorEnabled: false })
        .then(({ user: updatedUser }) => setUser(updatedUser))
        .catch(() => {
          toast({
            title: "Update failed",
            description: "Could not disable 2FA preference.",
            variant: "destructive",
          });
        });
    }
  }

  function confirm2FA() {
    setTwoFADialog(false); setTwoFA(true); setTwoFAPending(false);
    api.updateUserData({ twoFactorEnabled: true })
      .then(({ user: updatedUser }) => setUser(updatedUser))
      .catch(() => {
        toast({
          title: "Update failed",
          description: "Could not enable 2FA preference.",
          variant: "destructive",
        });
      });
  }

  function handleLogoutAll() {
    setLogoutDialog(false); setLoggedOut(true);
    setTimeout(() => setLoggedOut(false), 3000);
  }

  return (
    <div className="space-y-5">
      {/* Change Password */}
      <Card>
        <SectionTitle icon={Lock} title="Change Password" subtitle="Use a strong, unique password for your account" />
        <div className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Enter current password" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label helper="Minimum 8 characters">New Password</Label>
              <PasswordInput value={newPw} onChange={setNewPw} placeholder="New password" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
            </div>
          </div>

          {/* Password strength */}
          {newPw.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-500">Password strength</span>
                <span className={`text-[11px] font-semibold ${
                  newPw.length < 8 ? "text-rose-400" : newPw.length < 12 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {newPw.length < 8 ? "Weak" : newPw.length < 12 ? "Fair" : "Strong"}
                </span>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    newPw.length < 8  ? (i === 0 ? "bg-rose-500"   : "bg-slate-800") :
                    newPw.length < 12 ? (i <= 1  ? "bg-amber-400"  : "bg-slate-800") :
                                                    "bg-emerald-500"
                  }`} />
                ))}
              </div>
            </div>
          )}

          {pwError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300">{pwError}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <SaveButton onClick={handleChangePassword} saved={pwSaved} loading={pwLoading} label="Update Password" />
          </div>
        </div>
      </Card>

      {/* 2FA */}
      <Card>
        <SectionTitle icon={Smartphone} title="Two-Factor Authentication" subtitle="Add an extra layer of protection to your account" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {twoFA ? "2FA is enabled" : "2FA is disabled"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {twoFA
                ? "Your account is protected with an authenticator app."
                : "Protect your account beyond just a password."}
            </p>
          </div>
          <button
            onClick={handleToggle2FA}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
              ${twoFA ? "bg-emerald-500" : "bg-slate-700"}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${twoFA ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {twoFA && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300">Two-factor authentication is active. Your account is more secure.</p>
          </div>
        )}
        {!twoFA && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">Without 2FA, your account relies on your password alone. We strongly recommend enabling it.</p>
          </div>
        )}
      </Card>

      {/* Logout all devices */}
      <Card>
        <SectionTitle icon={LogOut} title="Active Sessions" subtitle="Manage where your account is logged in" />
        <div className="space-y-2.5 mb-5">
          {[
            { device: "Chrome on MacBook Pro", location: "Mumbai, IN", current: true,  time: "Active now" },
            { device: "Safari on iPhone 15",   location: "Mumbai, IN", current: false, time: "2 hours ago" },
            { device: "Firefox on Windows PC", location: "Delhi, IN",  current: false, time: "Yesterday" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3">
              <Wifi className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-300 truncate">{s.device}</p>
                <p className="text-[11px] text-slate-600">{s.location} · {s.time}</p>
              </div>
              {s.current && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  This device
                </span>
              )}
            </div>
          ))}
        </div>
        {loggedOut ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-emerald-300">All other sessions have been logged out.</p>
          </div>
        ) : (
          <button
            onClick={() => setLogoutDialog(true)}
            className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout from all other devices
          </button>
        )}
      </Card>

      <ConfirmDialog
        open={twoFADialog}
        title="Enable Two-Factor Authentication?"
        body="You'll need an authenticator app (Google Authenticator, Authy) to complete login. Make sure you have one ready."
        confirmLabel="Enable 2FA"
        onConfirm={confirm2FA}
        onCancel={() => { setTwoFADialog(false); setTwoFAPending(false); }}
      />
      <ConfirmDialog
        open={logoutDialog}
        title="Logout all other devices?"
        body="This will immediately end all sessions except this one. Anyone logged in on other devices will need to sign in again."
        confirmLabel="Logout all"
        danger
        onConfirm={handleLogoutAll}
        onCancel={() => setLogoutDialog(false)}
      />
    </div>
  );
}

// ─── Financial Data Section ────────────────────────────────────────────────────

function DataSection() {
  const [resetDialog,  setResetDialog]  = useState(false);
  const [resetDone,    setResetDone]    = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [exported,     setExported]     = useState(false);
  const [connecting,   setConnecting]   = useState(false);
  const [connected,    setConnected]    = useState<string | null>(null);
  const [bankDialog,   setBankDialog]   = useState<string | null>(null);

  const BANKS = [
    { name: "Chase Bank",           icon: "🏦", color: "bg-blue-500/10 border-blue-500/20"   },
    { name: "Bank of America",      icon: "🔴", color: "bg-rose-500/10 border-rose-500/20"   },
    { name: "Wells Fargo",          icon: "🟡", color: "bg-amber-500/10 border-amber-500/20" },
    { name: "Citibank",             icon: "🔵", color: "bg-sky-500/10 border-sky-500/20"     },
  ];

  function handleReset() {
    setResetDialog(false); setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  }

  function handleExport() {
    setExporting(true);
    setTimeout(() => { setExporting(false); setExported(true); setTimeout(() => setExported(false), 2500); }, 1200);
  }

  function handleConnect(bank: string) {
    setBankDialog(null); setConnecting(true);
    setTimeout(() => { setConnecting(false); setConnected(bank); }, 1500);
  }

  return (
    <div className="space-y-5">
      {/* Export */}
      <Card>
        <SectionTitle icon={Download} title="Export Your Data" subtitle="Download a copy of all your financial activity" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {[
            { label: "Transaction History", desc: "All income & expense records",       rows: "248 records" },
            { label: "Budget Reports",       desc: "Monthly budget vs. actuals",         rows: "12 reports"  },
            { label: "Investment Summary",   desc: "Portfolio & SIP data",               rows: "36 entries"  },
            { label: "Credit Score Log",     desc: "Historical credit score changes",    rows: "24 entries"  },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Download className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{item.label}</p>
                <p className="text-[11px] text-slate-500">{item.desc} · {item.rows}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95
            ${exported
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-700/60 border border-slate-600/60 text-slate-200 hover:bg-slate-700 hover:border-slate-500/60"
            } ${exporting ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {exported ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {exporting ? "Preparing CSV…" : exported ? "Downloaded!" : "Export All as CSV"}
        </button>
      </Card>

      {/* Connect Bank */}
      <Card>
        <SectionTitle icon={Building2} title="Connect Bank Account" subtitle="Sync your real bank data (demo — no actual connection)" />
        {connected ? (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-4 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">{connected} connected</p>
              <p className="text-xs text-slate-500 mt-0.5">Your account is syncing. Data updates every 6 hours.</p>
            </div>
            <button
              onClick={() => setConnected(null)}
              className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : connecting ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4 mb-4">
            <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400">Connecting securely…</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {BANKS.map((b) => (
            <button
              key={b.name}
              onClick={() => setBankDialog(b.name)}
              disabled={!!connected || connecting}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all
                ${connected === b.name ? b.color : "border-slate-800/60 bg-slate-800/30 hover:border-slate-600/60"}
                ${(!!connected || connecting) ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800/50"}`}
            >
              <span className="text-xl">{b.icon}</span>
              <span className="text-xs font-semibold text-slate-300">{b.name}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 ml-auto" />
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500">Your credentials are encrypted and never stored. This is a demo — no real connection is made.</p>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-500/15">
        <SectionTitle icon={AlertTriangle} title="Danger Zone" subtitle="These actions are irreversible — proceed with caution" />
        <div className="flex items-center justify-between rounded-xl border border-rose-500/15 bg-rose-500/5 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-200">Reset All Transactions</p>
            <p className="text-xs text-slate-500 mt-0.5">Permanently delete all income, expense, and budget records.</p>
          </div>
          {resetDone ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Done
            </div>
          ) : (
            <button
              onClick={() => setResetDialog(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/25 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/25 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Data
            </button>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={resetDialog}
        title="Reset all transaction data?"
        body="This will permanently delete all 248 transactions, budget entries, and financial history. This action cannot be undone."
        confirmLabel="Yes, reset everything"
        danger
        onConfirm={handleReset}
        onCancel={() => setResetDialog(false)}
      />
      <ConfirmDialog
        open={!!bankDialog}
        title={`Connect ${bankDialog}?`}
        body="This will initiate a secure read-only connection to your bank. We only access transaction data — never your credentials."
        confirmLabel="Connect securely"
        onConfirm={() => handleConnect(bankDialog!)}
        onCancel={() => setBankDialog(null)}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-8 pb-20 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1.5 font-medium">Manage your profile, preferences, and account security.</p>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-1 mb-6 overflow-x-auto"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 justify-center rounded-xl px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all
              ${activeTab === tab.id
                ? "bg-slate-700/80 text-slate-100 shadow-sm border border-slate-600/50"
                : "text-slate-500 hover:text-slate-300"}`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "profile"     && <ProfileSection />}
          {activeTab === "preferences" && <PreferencesSection />}
          {activeTab === "security"    && <SecuritySection />}
          {activeTab === "data"        && <DataSection />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
