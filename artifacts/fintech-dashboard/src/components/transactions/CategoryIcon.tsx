import {
  UtensilsCrossed,
  Plane,
  Home,
  ShoppingBag,
  Heart,
  Clapperboard,
  Car,
  Briefcase,
  Laptop,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import type { Category } from "./transactionData";

const iconMap: Record<Category, React.ElementType> = {
  "Food & Dining": UtensilsCrossed,
  "Travel": Plane,
  "Rent & Housing": Home,
  "Shopping": ShoppingBag,
  "Health": Heart,
  "Entertainment": Clapperboard,
  "Transport": Car,
  "Salary": Briefcase,
  "Freelance": Laptop,
  "Investment": TrendingUp,
  "Other": MoreHorizontal,
};

const colorMap: Record<Category, { bg: string; text: string }> = {
  "Food & Dining":  { bg: "bg-orange-500/15",  text: "text-orange-400" },
  "Travel":         { bg: "bg-sky-500/15",      text: "text-sky-400" },
  "Rent & Housing": { bg: "bg-violet-500/15",   text: "text-violet-400" },
  "Shopping":       { bg: "bg-pink-500/15",      text: "text-pink-400" },
  "Health":         { bg: "bg-rose-500/15",      text: "text-rose-400" },
  "Entertainment":  { bg: "bg-purple-500/15",    text: "text-purple-400" },
  "Transport":      { bg: "bg-amber-500/15",     text: "text-amber-400" },
  "Salary":         { bg: "bg-emerald-500/15",   text: "text-emerald-400" },
  "Freelance":      { bg: "bg-teal-500/15",      text: "text-teal-400" },
  "Investment":     { bg: "bg-blue-500/15",      text: "text-blue-400" },
  "Other":          { bg: "bg-slate-500/15",     text: "text-slate-400" },
};

interface CategoryIconProps {
  category: Category;
  size?: "sm" | "md" | "lg";
}

export function CategoryIcon({ category, size = "md" }: CategoryIconProps) {
  const Icon = iconMap[category] ?? MoreHorizontal;
  const { bg, text } = colorMap[category] ?? { bg: "bg-slate-500/15", text: "text-slate-400" };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-5 w-5",
  };

  return (
    <div className={`${sizeClasses[size]} ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${iconSizes[size]} ${text}`} />
    </div>
  );
}

export { colorMap, iconMap };
