import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

function checkPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", text: "text-red-400" };
  if (score <= 4) return { label: "Medium", color: "bg-amber-500", text: "text-amber-400" };
  return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
}

export function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setErrorMsg("Missing or invalid password reset token.");
    }
  }, []);

  const strength = checkPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Invalid reset token.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await api.resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060c20] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

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
          
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Set new password
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Create a strong, secure password for your Nexora workspace account.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Strength</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: newPassword.length >= 8 ? "33%" : "10%" }} />
                        <div className={`h-full transition-all duration-300 ${/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? strength.color : "bg-transparent"}`} style={{ width: "33%" }} />
                        <div className={`h-full transition-all duration-300 ${strength.label === "Strong" ? strength.color : "bg-transparent"}`} style={{ width: "34%" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300 mb-1">Password Requirements:</div>
                  <div className="flex items-center gap-1.5">
                    <span className={newPassword.length >= 8 ? "text-emerald-400 font-bold" : "text-slate-600"}>&bull;</span>
                    <span>At least 8 characters long</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>&bull;</span>
                    <span>Uppercase & lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>&bull;</span>
                    <span>Number & special character</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? <span>Updating password...</span> : <span>Reset Password</span>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password reset complete</h2>
              <p className="text-xs text-slate-400 mb-6">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Sign in now
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
