import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { UploadCloud, FileType, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

interface BankSimulationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankSimulation({ open, onOpenChange }: BankSimulationProps) {
  const { theme } = useDashboard();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const activeTheme = theme === "dark";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({ title: "Invalid File", description: "Please upload a valid CSV file.", variant: "destructive" });
      return;
    }
    setFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 3)); // Show top 3 rows as preview
      },
      error: (error) => {
        toast({ title: "Parsing Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let imported = 0;
        
        for (const row of rows) {
          try {
            // Expected columns: Date, Amount, Category, Type, Description
            const amount = parseFloat(row.Amount || row.amount);
            const dateStr = row.Date || row.date;
            const type = (row.Type || row.type || "expense").toLowerCase();
            const category = row.Category || row.category || "Uncategorized";
            const description = row.Description || row.description || "Imported transaction";

            if (!isNaN(amount) && dateStr) {
              await addTransaction({
                amount: amount.toString(),
                date: new Date(dateStr).toISOString(),
                type: type === "income" ? "income" : "expense",
                category,
                description,
              });
              imported++;
            }
          } catch (e) {
            console.error("Skipping invalid row", row);
          }
        }

        setIsProcessing(false);
        toast({ title: "Import Successful", description: `Successfully imported ${imported} transactions.` });
        setTimeout(() => {
          setFile(null);
          setPreview([]);
          onOpenChange(false);
        }, 500);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", activeTheme ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900")}>
        <DialogHeader>
          <DialogTitle>Import Bank Statement</DialogTitle>
          <DialogDescription className={activeTheme ? "text-slate-400" : "text-slate-500"}>
            Upload a CSV file containing your bank transactions. Expected columns: Date, Amount, Category, Type, Description.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
              isDragging 
                ? "border-emerald-500 bg-emerald-500/10" 
                : activeTheme ? "border-slate-800 bg-slate-900/50 hover:bg-slate-900" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={cn("h-10 w-10 mb-3", activeTheme ? "text-slate-500" : "text-slate-400")} />
            <p className="text-sm font-medium">Click or drag CSV file to upload</p>
            <p className="text-xs mt-1 text-slate-500">Only .csv files are supported</p>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className={cn("flex items-center gap-3 p-3 rounded-lg border", activeTheme ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50")}>
              <FileType className="h-8 w-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); }} className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">Remove</Button>
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Preview Data</p>
                <div className={cn("rounded-md border text-xs overflow-hidden", activeTheme ? "border-slate-800" : "border-slate-200")}>
                  <table className="w-full">
                    <thead className={activeTheme ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-500"}>
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-left font-medium">Amount</th>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {preview.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 truncate max-w-[80px]">{row.Date || row.date || "N/A"}</td>
                          <td className="px-3 py-2">{row.Amount || row.amount || "0"}</td>
                          <td className="px-3 py-2 truncate max-w-[120px]">{row.Description || row.description || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <p>Verify column names match expected headers before importing.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className={activeTheme ? "border-slate-700 hover:bg-slate-800 text-slate-300" : ""}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isProcessing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Import Transactions</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
