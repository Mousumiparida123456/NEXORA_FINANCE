import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  Target,
  ArrowRight,
  Bell,
  Search,
  Download,
  CheckCircle2,
  Home,
  CreditCard,
  PieChart,
  MoreHorizontal
} from "lucide-react";

interface CinematicIntroProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

const SESSION_KEY = "nexora_intro_shown";

export function CinematicIntro({ onComplete, forcePlay = false }: CinematicIntroProps) {
  const [phase, setPhase] = useState<"logo" | "showcase" | "transition" | "hidden">("logo");
  const [shouldRender, setShouldRender] = useState<boolean>(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasForceParam = urlParams.get("intro") === "true";
    const hasShown = sessionStorage.getItem(SESSION_KEY);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!forcePlay && !hasForceParam && (hasShown || prefersReducedMotion)) {
      setShouldRender(false);
      onComplete();
      return;
    }

    // Immediately mark as shown in sessionStorage and remove query param so it NEVER runs twice
    sessionStorage.setItem(SESSION_KEY, "true");
    if (hasForceParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setPhase("logo");
    setShouldRender(true);

    // Timeline sequence (~3.4 seconds total for rich experience):
    // 0ms - 500ms: Intro Canvas unrolls
    // 500ms - 2600ms: 3D Slanted Phone & Floating Glass Cards Showcase
    // 2600ms - 3400ms: Golden Light Flare Dissolve
    // 3400ms+: Reveal Dashboard

    const timerShowcase = setTimeout(() => {
      setPhase("showcase");
    }, 500);

    const timerTransition = setTimeout(() => {
      setPhase("transition");
    }, 2600);

    const timerFinish = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "true");
      setPhase("hidden");
      setShouldRender(false);
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(timerShowcase);
      clearTimeout(timerTransition);
      clearTimeout(timerFinish);
    };
  }, [onComplete, forcePlay]);

  const handleSkip = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setPhase("hidden");
    setShouldRender(false);
    onComplete();
  };

  if (!shouldRender || phase === "hidden") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="nexora-3d-slanted-showcase-overlay"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "transition" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f9f6ef] via-[#f3ede1] to-[#e7dcc7] text-slate-900 font-sans selection:bg-emerald-500/20 [perspective:1400px]"
      >
        {/* Ambient Sunrise Landscape & Golden Light Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top Golden Horizon Flare */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-gradient-to-b from-amber-300/40 via-amber-400/20 to-transparent blur-[140px]" />

          {/* Left Emerald Atmosphere */}
          <div className="absolute -top-20 -left-20 h-[700px] w-[700px] rounded-full bg-emerald-400/15 blur-[150px]" />

          {/* Right Warm Golden Atmosphere */}
          <div className="absolute -bottom-20 -right-20 h-[700px] w-[700px] rounded-full bg-amber-400/15 blur-[150px]" />

          {/* 3D Background Golden Arch Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[750px] w-[750px] rounded-full border border-amber-400/20 shadow-[0_0_100px_rgba(245,158,11,0.12)] pointer-events-none transform -rotate-12" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[920px] w-[920px] rounded-full border border-amber-300/10 pointer-events-none transform rotate-6" />

          {/* Pedestal Base Light Surface */}
          <div className="absolute bottom-0 inset-x-0 h-[28vh] bg-gradient-to-t from-[#e1d5c0]/70 via-[#eee4d4]/40 to-transparent blur-md" />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          type="button"
          aria-label="Skip opening animation"
          className="absolute top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-amber-900/15 bg-white/80 px-4 py-2 text-xs font-bold text-slate-800 backdrop-blur-md shadow-lg hover:bg-white hover:shadow-xl cursor-pointer transition-all hover:scale-105"
        >
          <span>Skip Intro</span>
          <span className="text-emerald-600">⚡</span>
        </button>

        {/* MAIN 3D SHOWCASE CONTAINER (Exact Reference Alignment) */}
        <div className="relative z-10 w-full max-w-7xl px-4 sm:px-8 py-4 flex items-center justify-between min-h-[92vh] [transform-style:preserve-3d]">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: BRAND LOGO + SLANTED FINANCIAL CARDS & VISA  */}
          {/* ========================================================= */}
          <div className="flex-1 flex flex-col justify-between h-[82vh] max-w-md z-20 [transform-style:preserve-3d]">
            
            {/* Top-Left Brand Logo & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-start"
            >
              <div className="flex items-center gap-3 mb-2">
                {/* Geometric Floral 8-Circle Logo */}
                <svg className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_6px_16px_rgba(4,78,66,0.2)]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="18" r="7.5" fill="#044e42" />
                  <circle cx="72.6" cy="27.4" r="7.5" fill="#044e42" />
                  <circle cx="82" cy="50" r="7.5" fill="#044e42" />
                  <circle cx="72.6" cy="72.6" r="7.5" fill="#044e42" />
                  <circle cx="50" cy="82" r="7.5" fill="#044e42" />
                  <circle cx="27.4" cy="72.6" r="7.5" fill="#044e42" />
                  <circle cx="18" cy="50" r="7.5" fill="#044e42" />
                  <circle cx="27.4" cy="27.4" r="7.5" fill="#044e42" />
                  <circle cx="50" cy="50" r="8.5" fill="#065f46" />
                </svg>
                <h1 className="text-3xl sm:text-4xl font-light tracking-[0.3em] text-[#044e42] font-serif uppercase">
                  N E X O R A
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-medium tracking-wide text-slate-700 font-sans pl-1">
                Your Money. Your Future. Your Control.
              </p>
            </motion.div>

            {/* Middle & Lower Floating 3D Cards Container */}
            <div className="flex flex-col gap-4 mt-auto mb-4 [transform-style:preserve-3d]">
              
              {/* 3D Slanted Card 1: Total Income */}
              <motion.div
                initial={{ opacity: 0, x: -50, rotateY: -15, rotateX: 6 }}
                animate={{
                  opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
                  x: phase === "showcase" || phase === "transition" ? 0 : -50,
                  y: [0, -6, 0],
                  rotateY: -12,
                  rotateX: 4
                }}
                transition={{
                  y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.75, delay: 0.1 },
                  x: { duration: 0.75, delay: 0.1 }
                }}
                className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.07)] backdrop-blur-xl max-w-[290px] [transform-style:preserve-3d]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-sm">
                      ₹
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Income</p>
                      <p className="text-base font-bold text-slate-900">₹1,00,000</p>
                      <p className="text-[10px] font-semibold text-emerald-600">↗ +8.2% vs last month</p>
                    </div>
                  </div>
                  <svg className="w-12 h-7 text-emerald-500 flex-shrink-0" viewBox="0 0 60 30" fill="none">
                    <path d="M5 25 Q 20 18, 35 12 T 55 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </motion.div>

              {/* 3D Slanted Card 2: Total Expenses */}
              <motion.div
                initial={{ opacity: 0, x: -50, rotateY: -15, rotateX: 6 }}
                animate={{
                  opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
                  x: phase === "showcase" || phase === "transition" ? 0 : -50,
                  y: [0, -8, 0],
                  rotateY: -10,
                  rotateX: 3
                }}
                transition={{
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
                  opacity: { duration: 0.75, delay: 0.25 },
                  x: { duration: 0.75, delay: 0.25 }
                }}
                className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.07)] backdrop-blur-xl max-w-[290px] ml-4 [transform-style:preserve-3d]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</p>
                      <p className="text-base font-bold text-slate-900">₹62,480</p>
                      <p className="text-[10px] font-semibold text-rose-500">↘ -3.1% vs last month</p>
                    </div>
                  </div>
                  <svg className="w-12 h-7 text-rose-400 flex-shrink-0" viewBox="0 0 60 30" fill="none">
                    <path d="M5 10 Q 20 18, 35 20 T 55 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </motion.div>

              {/* 3D Slanted Card 3: Premium NEXORA Metallic Emerald Visa Credit Card */}
              <motion.div
                initial={{ opacity: 0, x: -60, rotateY: 20, rotateX: -10 }}
                animate={{
                  opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
                  x: phase === "showcase" || phase === "transition" ? 0 : -60,
                  y: [0, -10, 0],
                  rotateY: 14,
                  rotateX: -6,
                  rotateZ: -5
                }}
                transition={{
                  y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                  opacity: { duration: 0.85, delay: 0.4 },
                  x: { duration: 0.85, delay: 0.4 }
                }}
                className="relative rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-[#064e3b] via-[#043e35] to-[#022c25] p-5 text-white shadow-[0_30px_60px_rgba(4,78,66,0.4)] overflow-hidden max-w-[310px] [transform-style:preserve-3d]"
              >
                {/* Light Sheen Animation */}
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/15 to-transparent transform -rotate-45 pointer-events-none animate-pulse" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="35" fill="#34d399" />
                    </svg>
                    <span className="text-xs font-bold tracking-widest uppercase text-emerald-200">N E X O R A</span>
                  </div>
                  {/* Metallic Gold Chip */}
                  <div className="h-7 w-9 rounded-md bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-200 shadow-inner border border-amber-100/40" />
                </div>

                <p className="text-sm font-mono tracking-widest text-emerald-100/90 mb-4">
                  •••• •••• •••• 4562
                </p>

                <div className="flex items-center justify-between text-xs text-emerald-200/80">
                  <span className="font-semibold tracking-wider uppercase text-[10px]">PREMIUM MEMBER</span>
                  <span className="text-base font-black italic tracking-tighter text-white">VISA</span>
                </div>
              </motion.div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTER COLUMN: 3D SLANTED SMARTPHONE DEVICE FRAME SHOWCASE */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -15, rotateX: 10 }}
            animate={{
              opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
              scale: phase === "showcase" || phase === "transition" ? 1 : 0.9,
              y: [0, -8, 0],
              rotateY: -8,
              rotateX: 4,
              rotateZ: 1
            }}
            transition={{
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.85, delay: 0.15 },
              scale: { duration: 0.85, delay: 0.15 }
            }}
            className="relative z-30 mx-auto max-w-[320px] sm:max-w-[340px] w-full [transform-style:preserve-3d] drop-shadow-[0_40px_80px_rgba(0,0,0,0.22)]"
          >
            {/* 3D Smartphone Outer Frame */}
            <div className="relative rounded-[46px] border-[9px] border-slate-900 bg-slate-950 p-2 shadow-2xl overflow-hidden ring-1 ring-slate-800">
              
              {/* Phone Speaker Notch / Island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 h-4 w-24 bg-slate-900 rounded-full z-40 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-slate-950" />
              </div>

              {/* PHONE SCREEN CONTENT (Live App Mobile Preview) */}
              <div className="rounded-[36px] bg-[#f8fafc] text-slate-900 pt-7 pb-4 px-4 overflow-hidden font-sans min-h-[580px] flex flex-col justify-between">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-1 mb-2">
                  <span>9:41</span>
                  <div className="flex items-center gap-1 text-slate-800">
                    <span className="text-[10px]">5G</span>
                    <div className="h-2.5 w-4 rounded-xs border border-slate-700 bg-slate-900" />
                  </div>
                </div>

                {/* App Header Bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="18" r="8" fill="#044e42" />
                      <circle cx="72.6" cy="27.4" r="8" fill="#044e42" />
                      <circle cx="82" cy="50" r="8" fill="#044e42" />
                      <circle cx="72.6" cy="72.6" r="8" fill="#044e42" />
                      <circle cx="50" cy="82" r="8" fill="#044e42" />
                      <circle cx="27.4" cy="72.6" r="8" fill="#044e42" />
                      <circle cx="18" cy="50" r="8" fill="#044e42" />
                      <circle cx="27.4" cy="27.4" r="8" fill="#044e42" />
                      <circle cx="50" cy="50" r="9" fill="#065f46" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-[#044e42] uppercase">N E X O R A</p>
                      <p className="text-[9px] text-slate-400 font-medium">Finance command center</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
                      JD
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-400 mb-3">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px]">Search data, reports, or products...</span>
                </div>

                {/* Mobile Emerald Total Balance Card */}
                <div className="rounded-2xl bg-gradient-to-br from-[#044e42] to-[#022c25] p-3.5 text-white shadow-md mb-3">
                  <p className="text-[10px] font-medium text-emerald-200">Total Balance</p>
                  <p className="text-xl font-bold tracking-tight mt-0.5">₹1,48,320</p>
                  <p className="text-[10px] font-semibold text-emerald-300 mt-0.5">↗ +8.2% vs last month</p>

                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-emerald-700/50 text-[10px] text-center font-medium">
                    <div className="rounded-lg bg-white/10 py-1 text-white">₹ INR</div>
                    <div className="rounded-lg bg-white/10 py-1 text-white flex items-center justify-center gap-1">
                      <Download className="h-2.5 w-2.5" /> Export
                    </div>
                    <div className="rounded-lg bg-emerald-500 text-slate-950 font-bold py-1">Admin</div>
                  </div>
                </div>

                {/* Quick Actions & Connection Status */}
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 mb-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-bold text-slate-700">Quick Actions</span>
                    <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Backend Connected
                    </span>
                  </div>
                  <button className="w-full py-1.5 rounded-lg bg-[#044e42] text-white text-[11px] font-bold flex items-center justify-center gap-1">
                    <Download className="h-3 w-3" /> Download Report
                  </button>
                </div>

                {/* Performance Banner */}
                <div className="rounded-xl bg-gradient-to-r from-amber-100 via-emerald-100 to-amber-50 p-2.5 mb-3 border border-amber-200/50">
                  <p className="text-[11px] font-serif font-bold text-[#044e42]">Explore your performance</p>
                  <p className="text-[9px] text-slate-600">Dive into trends and product insights</p>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-1.5 mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Recent Activity</p>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">Salary Credit</p>
                      <p className="text-[9px] text-slate-400">Today, 10:24 AM</p>
                    </div>
                    <span className="font-bold text-emerald-600 text-[11px]">+₹45,000</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">Amazon Purchase</p>
                      <p className="text-[9px] text-slate-400">Today, 08:12 AM</p>
                    </div>
                    <span className="font-bold text-rose-500 text-[11px]">-₹2,499</span>
                  </div>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-200 text-[9px] text-center text-slate-500">
                  <div className="flex flex-col items-center text-emerald-700 font-bold">
                    <Home className="h-3.5 w-3.5" />
                    <span>Home</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Transactions</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <PieChart className="h-3.5 w-3.5" />
                    <span>Reports</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span>More</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: SLANTED 3D GLASSMOPHIC FEATURE BADGES      */}
          {/* ========================================================= */}
          <div className="flex-1 flex flex-col justify-center gap-4 max-w-sm z-20 [transform-style:preserve-3d]">
            
            {/* 3D Slanted Badge 1: Smart Insights */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15, rotateX: -6 }}
              animate={{
                opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
                x: phase === "showcase" || phase === "transition" ? 0 : 50,
                y: [0, -6, 0],
                rotateY: 12,
                rotateX: -4
              }}
              transition={{
                y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.75, delay: 0.2 },
                x: { duration: 0.75, delay: 0.2 }
              }}
              className="flex items-center justify-between rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.07)] backdrop-blur-xl hover:bg-white transition-all [transform-style:preserve-3d]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 flex-shrink-0">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Smart Insights</h3>
                  <p className="text-xs text-slate-500">Get personalized insights to make better decisions.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

            {/* 3D Slanted Badge 2: Fraud Protection */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15, rotateX: -6 }}
              animate={{
                opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
                x: phase === "showcase" || phase === "transition" ? 0 : 50,
                y: [0, -8, 0],
                rotateY: 10,
                rotateX: -3
              }}
              transition={{
                y: { duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
                opacity: { duration: 0.75, delay: 0.35 },
                x: { duration: 0.75, delay: 0.35 }
              }}
              className="flex items-center justify-between rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.07)] backdrop-blur-xl hover:bg-white transition-all [transform-style:preserve-3d]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 flex-shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Fraud Protection</h3>
                  <p className="text-xs text-slate-500">AI-powered risk detection for safer transactions.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

            {/* 3D Slanted Badge 3: Savings Goals */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15, rotateX: -6 }}
              animate={{
                opacity: phase === "showcase" || phase === "transition" ? 1 : 0,
                x: phase === "showcase" || phase === "transition" ? 0 : 50,
                y: [0, -7, 0],
                rotateY: 8,
                rotateX: -2
              }}
              transition={{
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
                opacity: { duration: 0.75, delay: 0.5 },
                x: { duration: 0.75, delay: 0.5 }
              }}
              className="flex items-center justify-between rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.07)] backdrop-blur-xl hover:bg-white transition-all [transform-style:preserve-3d]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 flex-shrink-0">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Savings Goals</h3>
                  <p className="text-xs text-slate-500">Plan today. Achieve tomorrow.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

          </div>

        </div>

        {/* TRANSITION LIGHT BURST */}
        <AnimatePresence>
          {phase === "transition" && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 3.2, opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="absolute pointer-events-none h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-300/60 via-emerald-400/50 to-teal-400/60 blur-3xl"
            />
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}
