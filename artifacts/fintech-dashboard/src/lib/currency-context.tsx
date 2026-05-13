import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "INR" | "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amount: number, compact?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CONVERSION_RATES: Record<Currency, number> = {
  INR: 1,      // Base
  USD: 0.012,  // 1 INR = 0.012 USD
  EUR: 0.011,  // 1 INR = 0.011 EUR
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("INR");

  useEffect(() => {
    const saved = localStorage.getItem("nexora_currency") as Currency | null;
    if (saved && ["INR", "USD", "EUR"].includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("nexora_currency", c);
    window.dispatchEvent(new Event("nexora_currency_changed")); // Optional event if needed
  };

  const formatCurrency = (amount: number, compact = false) => {
    const rate = CONVERSION_RATES[currency];
    const converted = amount * rate;
    
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: compact ? 0 : 0,
      notation: compact ? "compact" : "standard",
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
