import React, { useState, useEffect } from "react";
// @ts-ignore
import { usePlaidLink } from "react-plaid-link";
import { Button } from "./ui/button";
import { Landmark, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export const PlaidLinkButton = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch link token when component mounts
    const fetchLinkToken = async () => {
      try {
        const response = await api.post<{link_token: string}>("/plaid/create-link-token", {});
        setLinkToken(response.link_token);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Bank connection unavailable.";
        toast.error(message);
      }
    };
    fetchLinkToken();
  }, []);

  const onSuccess = async (public_token: string) => {
    setIsLoading(true);
    try {
      // Exchange public token for access token
      await api.post("/plaid/exchange-public-token", { public_token });
      toast.success("Bank account linked and transactions synchronized.");
      window.dispatchEvent(new Event("nexora:transactions:changed"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to link bank account.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button 
      onClick={() => open()} 
      disabled={!ready || isLoading || !linkToken}
      className="bg-[#2A2B31] text-white hover:bg-[#34363e] border border-gray-700/50 rounded-xl"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Landmark className="w-4 h-4 mr-2 text-cyan-400" />
      )}
      Connect Bank
    </Button>
  );
};
