import { getSupabaseClient } from "@/lib/supabase-client";

type Unsubscribe = () => void;

export function subscribeToTransactionsRealtime(onChange: () => void): Unsubscribe {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel("nexora-transactions-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions" },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

