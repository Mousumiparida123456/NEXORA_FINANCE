import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.45c-.24 1.25-.95 2.3-2 3.01l3.23 2.5c1.88-1.73 2.97-4.27 2.97-7.3 0-.7-.06-1.39-.18-2.05H12Z"
      />
      <path
        fill="#4285F4"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.75-5.59-4.1l-3.34 2.58C4.72 19.79 8.08 22 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.93a5.97 5.97 0 0 1 0-3.85l-3.34-2.58a9.97 9.97 0 0 0 0 9l3.34-2.57Z"
      />
      <path
        fill="#34A853"
        d="M12 5.97c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.95 2.93 14.7 2 12 2 8.08 2 4.72 4.21 3.07 7.5l3.34 2.58c.8-2.35 3-4.1 5.59-4.1Z"
      />
    </svg>
  );
}

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("nexora_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    const oauthToken = params.get("token");

    if (oauthError) {
      setError("Google sign-in failed. Please try again.");
    } else if (oauthToken) {
      api.setAccessToken(oauthToken);
      window.location.replace("/dashboard");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const loginResult = await api.login({ email, password });
        if (loginResult.accessToken) {
          api.setAccessToken(loginResult.accessToken);
        }
        if (rememberMe) {
          window.localStorage.setItem("nexora_remembered_email", email);
        } else {
          window.localStorage.removeItem("nexora_remembered_email");
        }
        window.location.replace("/dashboard");
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/.test(password)) {
          setError("Use 8+ chars with uppercase, lowercase, number, and symbol.");
          return;
        }
        const registerResult = await api.register({ email, password, firstName });
        if (registerResult.accessToken) {
          api.setAccessToken(registerResult.accessToken);
        }
        setSuccess("Account created successfully! Entering dashboard...");
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 500);
      }
    } catch (err: any) {
      console.error("❌ AUTH_ERROR_DETAILS:", err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true);
    setError("");
    const demoEmail = "demo@nexora.finance";
    const demoPassword = "DemoAccount123!";
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    try {
      const loginResult = await api.login({ email: demoEmail, password: demoPassword });
      if (loginResult.accessToken) {
        api.setAccessToken(loginResult.accessToken);
        window.location.replace("/dashboard");
        return;
      }
    } catch (err: any) {
      try {
        const registerResult = await api.register({ 
          email: demoEmail, 
          password: demoPassword, 
          firstName: "Demo",
          lastName: "User" 
        });
        
        if (registerResult.accessToken) {
          api.setAccessToken(registerResult.accessToken);
          await api.upsertUserData({
             profile: { name: "Demo User", email: demoEmail, income: "8500", goals: "Buy a house in 2 years" },
             preferences: { riskLevel: "medium", savingsGoal: 20000, investStyle: "balanced" }
          });
          window.location.replace("/dashboard");
          return;
        }
      } catch (registerErr: any) {
        setError(registerErr.message || "Demo account creation failed.");
      }
    } finally {
      setDemoLoading(false);
    }
  }

  function handleGoogleContinue() {
    setGoogleLoading(true);
    window.location.assign(`${api.baseUrl}/auth/google`);
  }

  return (
    <main className="relative min-h-screen supports-[height:100dvh]:min-h-dvh flex items-center justify-center overflow-hidden bg-[#050814] text-slate-100 px-4 py-8 select-none">
      
      {/* Animated Ambient Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 40, -40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]"
        />

        {/* Subtle Geometric Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Main Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px]"
      >
        <div className="relative rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden">
          
          {/* Subtle top glow bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1px]" />

          {/* Header Section */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 12, scale: 1.05 }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                <TrendingUp className="h-5 w-5" />
              </motion.div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Nexora <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">Finance</span>
                </span>
                <p className="text-xs text-slate-400">Wealth Intelligence Gateway</p>
              </div>
            </div>

            {/* Quick Demo Login Pill */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {demoLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Demo
            </motion.button>
          </header>

          {/* Switch Tabs (Sign In vs Register) */}
          <div className="relative mb-6 flex rounded-2xl bg-slate-950/60 p-1 border border-white/5">
            <button
              onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
              className={`relative flex-1 py-2.5 text-xs font-bold transition-colors duration-200 z-10 ${
                isLogin ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
              className={`relative flex-1 py-2.5 text-xs font-bold transition-colors duration-200 z-10 ${
                !isLogin ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {!isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Create Account
            </button>
          </div>

          {/* Title Banner */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isLogin ? "Welcome back" : "Join Nexora Finance"}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {isLogin
                ? "Enter your credentials to access your financial dashboard."
                : "Create a secure account to track, invest & grow your wealth."}
            </p>
          </div>

          {/* Prominent Google OAuth Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleContinue}
            disabled={googleLoading}
            className="relative group mb-6 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 font-semibold text-xs text-slate-200 backdrop-blur-md transition duration-200 hover:bg-white/10 hover:border-white/25 hover:text-white shadow-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-white/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <GoogleMark />
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </motion.button>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Error / Success Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5"
              >
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  First Name
                </label>
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 transition focus-within:border-cyan-400/50 focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-400/20">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="h-full w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                    required
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 transition focus-within:border-cyan-400/50 focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-400/20">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="h-full w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {isLogin && (
                  <a
                    href="/forgot-password"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition hover:underline"
                  >
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 transition focus-within:border-cyan-400/50 focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-400/20">
                <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-full w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5"
              >
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 transition focus-within:border-cyan-400/50 focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-400/20">
                  <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="h-full w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                    required
                  />
                </div>
              </motion.div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">
                    Remember me
                  </span>
                </label>
              </div>
            )}

            {/* Primary Action Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={submitting}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-xs font-bold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:brightness-110 disabled:opacity-60 mt-4"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In to Dashboard" : "Create My Account"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Security Badge */}
          <footer className="mt-8 text-center pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400/70" />
            <span>Protected by 256-bit Bank-Grade Encryption</span>
          </footer>
        </div>
      </motion.div>
    </main>
  );
}
