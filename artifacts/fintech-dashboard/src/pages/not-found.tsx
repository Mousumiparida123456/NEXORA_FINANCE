import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 text-slate-100">
      <Card className="w-full max-w-md mx-4 bg-slate-900 border-slate-800 text-slate-100">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h1 className="text-2xl font-bold text-slate-100">404 Page Not Found</h1>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Did you forget to add the page to the router?
          </p>

          <div className="mt-4 p-3 bg-slate-950 text-slate-300 rounded-lg text-xs font-mono space-y-1 border border-slate-800">
            <p><span className="text-slate-500">wouter location:</span> <span className="text-emerald-400 font-bold">{location}</span></p>
            <p><span className="text-slate-500">window.location:</span> <span className="text-blue-400 font-bold">{typeof window !== "undefined" ? window.location.pathname : ""}</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
