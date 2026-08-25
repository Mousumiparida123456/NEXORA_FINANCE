import React, { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await api.login({ email, password });
      const userRole = result.user?.role || "PERSONAL_USER";

      // Role-based redirection logic
      if (userRole === "MERCHANT_USER" || userRole === "ADMIN") {
        window.location.href = "/merchant";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handleDemoMerchantAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.startDemoMerchantSession();
      window.location.href = "/merchant";
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to initialize Demo Merchant session.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060c20] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Subtle Radial Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Branding */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full bg-[#070e24] rounded-[11px] flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-lg text-white">
              NEXORA <span className="text-emerald-400 font-extrabold">FINANCE</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Sentinel Security Platform
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-400 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Status: <strong className="text-emerald-400 font-medium">100% Operational</strong></span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-center z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: Login Authentication Card */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/80 relative">
              
              {/* Card Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secure Member Access</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Sign in securely to continue to your Nexora workspace.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Options: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-slate-900"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="/forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation("/forgot-password");
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in securely</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Account Quick-Fill Presets */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Quick Demo Access
                  </span>
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill("demo@nexora.finance", "DemoAccount123!")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 text-left transition-all"
                  >
                    <div className="font-semibold text-emerald-400">Personal User</div>
                    <div className="text-[10px] text-slate-400 truncate">demo@nexora.finance</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill("merchant@nexora.finance", "SentinelMerchant123!")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 text-left transition-all"
                  >
                    <div className="font-semibold text-cyan-400">Merchant User</div>
                    <div className="text-[10px] text-slate-400 truncate">merchant@nexora.finance</div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDemoMerchantAccess}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Launch Demo Merchant Session</span>
                </button>
              </div>

              {/* Register Callout */}
              <div className="mt-5 text-center text-xs text-slate-400">
                Don't have an account?{" "}
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    setLocation("/register");
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Create workspace account
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Security Panel (Desktop Only) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-center">
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md relative">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-inner">
                <Shield className="h-6 w-6" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                Protected by Nexora Sentinel
              </h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Institutional-grade security with continuous fraud detection and real-time transaction protection.
              </p>

              <div className="space-y-3.5 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">Secure Authentication</h3>
                    <p className="text-[11px] text-slate-400">Encrypted token rotation and zero plain-text credential storage.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">Role-Based Access Control</h3>
                    <p className="text-[11px] text-slate-400">Isolated personal and merchant workspaces with backend authorization.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">Real-Time Risk Protection</h3>
                    <p className="text-[11px] text-slate-400">Automated AI anomaly detection guarding every ledger entry.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Cryptographic Protocol</span>
                <span className="font-mono text-emerald-400 text-[10px]">ARGON2ID / BCRYPT-12</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/40 z-10">
        <div>&copy; {new Date().getFullYear()} Nexora Finance. All rights reserved.</div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span>&bull;</span>
          <span className="hover:text-slate-300 cursor-pointer">Security Overview</span>
          <span>&bull;</span>
          <span className="hover:text-slate-300 cursor-pointer">Compliance</span>
        </div>
      </footer>
    </div>
  );
}
