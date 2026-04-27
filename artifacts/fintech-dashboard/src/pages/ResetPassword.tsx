import { useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#040816] p-6 text-center">
        <div className="space-y-6 max-w-md">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Invalid Reset Link</h1>
          <p className="text-slate-400 text-sm leading-relaxed">The link you followed is invalid or has expired. Please request a new one.</p>
          <Link to="/forgot-password" className="inline-block px-8 py-3 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition">Request New Link</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#040816] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.1),transparent_22%),radial-gradient(circle_at_78%_14%,rgba(16,185,129,0.1),transparent_24%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black text-white">Secure New Key</h1>
            <p className="mt-2 text-sm text-slate-400">Create a strong password for your Nexora account.</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-4 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-emerald-400">Password Updated!</p>
                <p className="text-xs text-slate-500 leading-relaxed">Your account is now secured with your new password.</p>
              </div>
              <Link 
                to="/login"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-black uppercase tracking-widest text-slate-950 shadow-xl transition hover:brightness-110"
              >
                Sign In Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 p-4 text-sm font-medium text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">New Password</span>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40">
                  <LockKeyhole className="h-5 w-5 text-slate-500" />
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

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirm Password</span>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40">
                  <LockKeyhole className="h-5 w-5 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-full w-full bg-transparent text-sm outline-none"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest shadow-xl transition hover:bg-slate-200 disabled:opacity-70"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
}
