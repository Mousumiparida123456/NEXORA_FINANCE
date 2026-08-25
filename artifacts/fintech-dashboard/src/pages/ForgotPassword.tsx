import React, { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Mail, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.forgotPassword(email);
      setIsSubmitted(true);
      if (res.devResetLink) {
        setDevLink(res.devResetLink);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060c20] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

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
      <main className="flex-1 w-full max-w-md mx-auto px-6 py-12 flex items-center justify-center z-10">
        <div className="w-full bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </button>

          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Reset password
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your email address and we'll send you secure instructions to reset your account password.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Enter your registered email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Sending instructions...</span>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                If an account exists for <strong className="text-white">{email}</strong>, a password reset link has been sent.
              </p>

              {devLink && (
                <div className="mb-6 p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-left">
                  <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    Development Reset Link
                  </div>
                  <a
                    href={devLink}
                    onClick={(e) => {
                      e.preventDefault();
                      const url = new URL(devLink);
                      setLocation(url.pathname + url.search);
                    }}
                    className="text-xs text-cyan-400 hover:underline break-all"
                  >
                    {devLink}
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Return to sign in
              </button>
            </div>
          )}

        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-400 z-10">
        &copy; {new Date().getFullYear()} Nexora Finance. All rights reserved.
      </footer>
    </div>
  );
}
