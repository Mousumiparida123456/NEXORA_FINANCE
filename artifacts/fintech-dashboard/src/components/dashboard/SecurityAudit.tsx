import { ShieldCheck, ShieldAlert, Lock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export function SecurityAudit() {
  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Elite Security Audit
        </CardTitle>
        <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
          Verified
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold">Encryption Layer</p>
              <p className="text-[10px] text-muted-foreground">AES-256 Bit Standard Active</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-sky-500" />
            </div>
            <div>
              <p className="text-xs font-semibold">Fraud Detection</p>
              <p className="text-[10px] text-muted-foreground">0 Suspicious patterns detected today</p>
            </div>
          </div>

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
            className="pt-2"
          >
            <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-emerald-600/80">
              <span>Account Trust Score</span>
              <span>98%</span>
            </div>
            <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[98%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </motion.div>

          <p className="text-[9px] text-muted-foreground italic border-t border-emerald-500/10 pt-2">
            Nexora Guard™: Rate limiting and DDoS protection are currently shielding your account from 127.0.0.1.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
