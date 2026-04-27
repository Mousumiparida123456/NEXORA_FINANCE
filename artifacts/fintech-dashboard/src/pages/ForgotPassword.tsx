import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to initiate password reset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#040816] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.1),transparent_22%),radial-gradient(circle_at_78%_14%,rgba(99,102,241,0.1),transparent_24%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black text-white">Reset Vault Key</h1>
            <p className="mt-2 text-sm text-slate-400">Enter your email and we'll send you recovery instructions.</p>
          </div>

          <AnimatePresence mode="wait">
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
                  <p className="font-bold text-emerald-400">Recovery Instructions Sent!</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    If that email exists in our vault, you will receive a secure reset link shortly.
                  </p>
                </div>
                <Link 
                  to="/login"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/5 font-bold text-white transition hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 p-4 text-sm font-medium text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</span>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 focus-within:border-cyan-400/40 transition-colors">
                    <Mail className="h-5 w-5 text-slate-500" />
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 font-black uppercase tracking-widest text-slate-950 shadow-[0_20px_50px_rgba(34,211,238,0.2)] transition hover:brightness-110 disabled:opacity-70"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <Link 
                  to="/login"
                  className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  I remember my password
                </Link>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
