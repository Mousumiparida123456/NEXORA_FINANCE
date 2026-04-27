import { Link, useLocation } from "wouter";
import { PieChart, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/credit-score", label: "Credit Score" },
  { href: "/invest", label: "Invest" },
];

export function Header() {
  const [location] = useLocation();

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <PieChart className="h-5 w-5" />
            </div>
            <span className="hidden font-bold text-lg text-slate-50 tracking-tight sm:inline-block">NEXORA</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-slate-400 hover:text-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden relative md:block w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-full bg-slate-900 border-slate-800/60 pl-9 text-slate-300 focus-visible:ring-emerald-500 focus-visible:border-emerald-500/50 h-9"
            />
          </div>
          <button className="relative p-2 text-slate-400 hover:text-slate-50 transition-colors rounded-full hover:bg-slate-800/50">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
          </button>
          <Avatar className="h-8 w-8 border border-slate-700 cursor-pointer ring-2 ring-transparent hover:ring-emerald-500/30 transition-all">
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" />
            <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
