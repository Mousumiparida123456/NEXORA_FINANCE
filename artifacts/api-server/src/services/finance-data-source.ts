export type FinanceDataMode = "CONNECTED" | "DEMO";

export function resolveFinanceDataMode(value: unknown): FinanceDataMode {
  return value === "DEMO" ? "DEMO" : "CONNECTED";
}
