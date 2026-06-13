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
} from "lucide-react";
import { api } from "@/lib/api";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
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
    // Convenience: Load remembered email
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
        setSuccess("Account created! You can now sign in.");
        setIsLogin(true);
        setConfirmPassword("");
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
      // First try to login
      const loginResult = await api.login({ email: demoEmail, password: demoPassword });
      if (loginResult.accessToken) {
        api.setAccessToken(loginResult.accessToken);
        window.location.replace("/dashboard");
        return;
      }
    } catch (err: any) {
      // If login fails (user doesn't exist), register them
      try {
        const registerResult = await api.register({ 
          email: demoEmail, 
          password: demoPassword, 
          firstName: "Demo",
          lastName: "User" 
        });
        
        if (registerResult.accessToken) {
          api.setAccessToken(registerResult.accessToken);
          // Insert some fake data into user-data via upsert immediately so they have a profile
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
    <main className="min-h-screen supports-[height:100dvh]:min-h-dvh overflow-hidden bg-[#040816] text-[#d6e7f6]">
      <div className="grid min-h-screen supports-[height:100dvh]:min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex items-center justify-center overflow-hidden border-b border-cyan-400/10 px-6 py-10 lg:border-b-0 lg:border-r lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.15),transparent_22%),radial-gradient(circle_at_78%_14%,rgba(99,102,241,0.18),transparent_24%),radial-gradient(circle_at_32%_85%,rgba(34,197,94,0.10),transparent_22%),linear-gradient(180deg,#050a17_0%,#091425_100%)]" />
          <div className="absolute inset-[14px] rounded-[34px] border border-white/8 bg-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_140px_rgba(1,8,20,0.75)]" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-[520px]"
          >
            <header className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.36em] text-cyan-300/80">Nexora Vault</p>
                  <p className="mt-1 text-sm text-slate-400">Production Identity Gateway</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  {demoLoading ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Demo
                </button>
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold transition hover:bg-white/10"
                >
                  {isLogin ? <UserPlus className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                  {isLogin ? "Register" : "Login"}
                </button>
              </div>
            </header>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_32px_120px_rgba(2,8,23,0.72)] backdrop-blur-2xl sm:p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-black text-white">{isLogin ? "Welcome Back" : "Join Nexora"}</h1>
                <p className="mt-2 text-sm text-slate-400">{isLogin ? "Access your financial command center." : "Create your secure financial identity."}</p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</span>
                    <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="h-full w-full bg-transparent text-sm outline-none"
                        required
                      />
                    </div>
                  </label>
                )}

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="h-full w-full bg-transparent text-sm outline-none"
                      required
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</span>
                    {isLogin && <a href="/forgot-password" className="text-xs text-cyan-400 hover:underline">Forgot?</a>}
                  </div>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40">
                    <LockKeyhole className="h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-full w-full bg-transparent text-sm outline-none"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                {!isLogin && (
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</span>
                    <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40">
                      <LockKeyhole className="h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="h-full w-full bg-transparent text-sm outline-none"
                        required
                      />
                    </div>
                  </label>
                )}

                {isLogin && (
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-slate-950"
                    />
                    <label htmlFor="rememberMe" className="text-xs font-medium text-slate-400 cursor-pointer">Remember me</label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-70"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <>
                      {isLogin ? "Sign In Securely" : "Create Account"}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identity Providers</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleContinue}
                disabled={googleLoading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 font-semibold transition hover:bg-white/10"
              >
                <GoogleMark />
                {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
              </button>
            </div>
          </motion.div>
        </section>

        <section className="relative hidden overflow-hidden lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[#060913]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,0.13),transparent_20%),radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.17),transparent_22%),radial-gradient(circle_at_50%_76%,rgba(16,185,129,0.14),transparent_24%)]" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[520px] px-10"
          >
            <div className="rounded-[34px] border border-white/10 bg-white/[0.045] p-8 backdrop-blur-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Institutional Security
              </div>
              <h2 className="text-3xl font-black leading-tight text-white">AI-Powered Wealth Intelligence</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Experience the next generation of financial management. Our secure vault combines 
                biometric-grade identity verification with real-time AI decision support.
              </p>
              
              <div className="mt-8 space-y-4">
                {[
                  { title: "Bcrypt Vault", desc: "Military-grade password hashing ensures your credentials never touch the wire in plain text.", icon: ShieldCheck },
                  { title: "Session Guard", desc: "Stateless JWT tokens with HttpOnly refresh cycles keep your sessions locked and private.", icon: LockKeyhole }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 rounded-3xl border border-white/5 bg-slate-950/40 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{feature.title}</p>
                      <p className="mt-1 text-xs text-slate-500 leading-normal">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
