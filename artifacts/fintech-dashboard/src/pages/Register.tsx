import React, { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Building2, UserCheck } from "lucide-react";
import { api } from "@/lib/api";

export function Register() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"PERSONAL_USER" | "MERCHANT_USER">("PERSONAL_USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get("role");
    if (requestedRole === "merchant" || requestedRole === "MERCHANT" || requestedRole === "MERCHANT_USER") {
      setRole("MERCHANT_USER");
    }
    const prefilledEmail = params.get("email");
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMsg("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMsg("Password must contain at least one symbol.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await api.register({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        role,
      });

      // Clear any session tokens and redirect to Sign In with registration success query param
      api.clearAccessToken();
      const targetW = role === "MERCHANT_USER" ? "merchant" : "personal";
      window.location.href = `/login?registered=true&workspace=${targetW}&switch=true&email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      setErrorMsg(err.message || "An account with this email already exists. Please sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060c20] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-[1px]">
            <div className="h-full w-full bg-[#070e24] rounded-[11px] flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-lg text-white">
            NEXORA <span className="text-emerald-400">FINANCE</span>
          </span>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 w-full max-w-lg mx-auto px-6 py-8 flex items-center justify-center z-10">
        <div className="w-full bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create your workspace account
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select your primary account type and register for secure financial intelligence.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Select Workspace Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("PERSONAL_USER")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === "PERSONAL_USER"
                      ? "bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className={`h-4 w-4 ${role === "PERSONAL_USER" ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">Personal Account</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Personal finance management, savings, transactions & AI wealth guidance.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("MERCHANT_USER")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === "MERCHANT_USER"
                      ? "bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`h-4 w-4 ${role === "MERCHANT_USER" ? "text-cyan-400" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">Merchant Sentinel</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    B2B merchant protection, Sentinel risk engine, audit logs & dispute defense.
                  </p>
                </button>
              </div>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, symbol"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Workspace Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                setLocation("/login");
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Sign in
            </a>
          </div>

        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-400 z-10">
        &copy; {new Date().getFullYear()} Nexora Finance. All rights reserved.
      </footer>
    </div>
  );
}
