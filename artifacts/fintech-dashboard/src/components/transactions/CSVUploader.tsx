import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileText, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

type ParsedRow = {
  Date: string;
  Description: string;
  Amount: string;
  Type: string;
  Category?: string;
};

export function CSVUploader({ onImport }: { onImport: (data: any[]) => Promise<void> }) {
  const { theme } = useDashboard();
  const isDark = theme === "dark";
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data.slice(0, 5)); // show max 5 preview rows
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setLoading(true);
    
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const payload = results.data.map(row => {
          // Normalization logic
          const amt = Math.abs(parseFloat(row.Amount.replace(/[^0-9.-]+/g,"")));
          let type = row.Type?.toLowerCase() === "income" || Number(row.Amount) > 0 ? "income" : "expense";
          if (row.Type && row.Type.toLowerCase().includes("credit")) type = "income";
          
          return {
            date: new Date(row.Date || Date.now()).toISOString(),
            description: row.Description || "Imported Transaction",
            amount: isNaN(amt) ? 0 : amt,
            type: type,
            category: row.Category || "Other",
          };
        });

        await onImport(payload);
        setLoading(false);
        setFile(null);
        setPreviewData([]);
      }
    });
  };

  return (
    <div className={cn("rounded-2xl border p-4 sm:p-6 mb-6", isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
      {!file ? (
        <div 
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all",
            dragActive ? (isDark ? "border-emerald-500 bg-emerald-500/10" : "border-emerald-500 bg-emerald-50") : (isDark ? "border-slate-700 hover:bg-slate-800/50" : "border-slate-300 hover:bg-slate-100")
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
          <Upload className={cn("mb-3 h-8 w-8", isDark ? "text-slate-400" : "text-slate-500")} />
          <p className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>
            Click to upload or drag & drop CSV
          </p>
          <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-500")}>
            Headers should be: Date, Description, Amount, Type, Category
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isDark ? "bg-slate-800" : "bg-white border")}>
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>{file.name}</p>
                <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-500")}>Previewing first 5 rows</p>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setPreviewData([]); }}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/50 mb-4">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className={cn("uppercase", isDark ? "bg-slate-800/50" : "bg-slate-100 text-slate-500")}>
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {previewData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{row.Date || "-"}</td>
                    <td className="px-4 py-2">{row.Description || "-"}</td>
                    <td className="px-4 py-2">{row.Amount || "-"}</td>
                    <td className="px-4 py-2">{row.Type || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setFile(null); setPreviewData([]); }}>Cancel</Button>
            <Button onClick={handleConfirmImport} disabled={loading} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Importing..." : "Confirm & Import"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
