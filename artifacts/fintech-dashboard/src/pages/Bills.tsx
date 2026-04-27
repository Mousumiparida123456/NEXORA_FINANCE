import { useMemo, useState } from "react";
import { CreditCard, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

type BillItem = {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  amount: number;
  status: "overdue" | "upcoming" | "paid";
  frequency: string;
};

const bills: BillItem[] = [
  {
    id: "water-bill",
    title: "Water Bill",
    category: "Utilities",
    dueDate: "2026-03-28",
    amount: 450,
    status: "overdue",
    frequency: "monthly",
  },
  {
    id: "house-rent",
    title: "House Rent",
    category: "Housing",
    dueDate: "2026-04-01",
    amount: 12000,
    status: "overdue",
    frequency: "monthly",
  },
  {
    id: "electricity-bill",
    title: "Electricity Bill",
    category: "Utilities",
    dueDate: "2026-04-05",
    amount: 1800,
    status: "overdue",
    frequency: "monthly",
  },
  {
    id: "internet",
    title: "Internet",
    category: "Utilities",
    dueDate: "2026-04-10",
    amount: 999,
    status: "upcoming",
    frequency: "monthly",
  },
  {
    id: "health-insurance",
    title: "Health Insurance",
    category: "Health",
    dueDate: "2026-04-15",
    amount: 3500,
    status: "upcoming",
    frequency: "monthly",
  },
  {
    id: "netflix-subscription",
    title: "Netflix Subscription",
    category: "Entertainment",
    dueDate: "2026-04-20",
    amount: 649,
    status: "upcoming",
    frequency: "monthly",
  },
  {
    id: "gym-membership",
    title: "Gym Membership",
    category: "Health",
    dueDate: "2026-04-25",
    amount: 1200,
    status: "upcoming",
    frequency: "monthly",
  },
  {
    id: "car-insurance",
    title: "Car Insurance",
    category: "Transport",
    dueDate: "2026-06-01",
    amount: 8500,
    status: "upcoming",
    frequency: "yearly",
  },
];

const statusStyles = {
  overdue: "bg-rose-500/10 text-rose-500 border border-rose-500/10",
  upcoming: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/10",
  paid: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10",
};

type BillEditForm = {
  title: string;
  category: string;
  dueDate: string;
  amount: string;
  frequency: string;
};

const categories = ["Utilities", "Housing", "Health", "Entertainment", "Transport"];
const frequencies = ["monthly", "yearly", "weekly", "one-time"];

export function Bills() {
  const { theme, formatCurrency } = useDashboard();
  const isDark = theme === "dark";
  const [billItems, setBillItems] = useState<BillItem[]>(bills);
  const [editBillId, setEditBillId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<BillEditForm>({
    title: "",
    category: "Utilities",
    dueDate: "",
    amount: "",
    frequency: "monthly",
  });

  const unpaidTotal = useMemo(
    () => billItems.filter((bill) => bill.status !== "paid").reduce((sum, bill) => sum + bill.amount, 0),
    [billItems],
  );

  const overdueCount = useMemo(
    () => billItems.filter((bill) => bill.status === "overdue").length,
    [billItems],
  );

  const handleMarkPaid = (billId: string) => {
    setBillItems((current) =>
      current.map((bill) =>
        bill.id === billId
          ? { ...bill, status: "paid" }
          : bill,
      ),
    );
  };

  const handleDelete = (billId: string) => {
    setBillItems((current) => current.filter((bill) => bill.id !== billId));
  };

  const openEditModal = (billId: string) => {
    const bill = billItems.find((item) => item.id === billId);
    if (!bill) return;

    setEditBillId(bill.id);
    setEditForm({
      title: bill.title,
      category: bill.category,
      dueDate: bill.dueDate,
      amount: bill.amount.toString(),
      frequency: bill.frequency,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editBillId) return;
    setBillItems((current) =>
      current.map((bill) =>
        bill.id === editBillId
          ? {
              ...bill,
              title: editForm.title.trim() || bill.title,
              category: editForm.category,
              dueDate: editForm.dueDate,
              amount: Number(editForm.amount) || bill.amount,
              frequency: editForm.frequency,
            }
          : bill,
      ),
    );
    setEditOpen(false);
    setEditBillId(null);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditBillId(null);
  };

  return (
    <main className={cn("container mx-auto px-4 py-8 pb-16", isDark ? "" : "")}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-950")}>Bill Reminders</h1>
          <p className={cn("mt-1.5 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
            Stay on top of upcoming bills and overdue payments.
          </p>
        </div>

        <div className="rounded-3xl border p-4 text-sm font-semibold shadow-sm transition-colors" style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: isDark ? "rgba(148,163,184,0.12)" : "rgba(226,232,240,1)" }}>
          <div className="flex items-center gap-2 text-slate-500">
            <CreditCard className="h-4 w-4" />
            Unpaid total
          </div>
          <p className={cn("mt-1 text-2xl font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{formatCurrency(unpaidTotal)}</p>
          <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>{overdueCount} overdue</p>
        </div>
      </div>

      <div className="space-y-4">
        {billItems.map((bill) => (
          <Card key={bill.id} className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={cn("text-base font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>
                      {bill.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>{bill.category}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>{bill.frequency}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>Due: {bill.dueDate}</span>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[bill.status])}>
                    {bill.status === "overdue" ? "Overdue" : bill.status === "upcoming" ? "Upcoming" : "Paid"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkPaid(bill.id)}
                    disabled={bill.status === "paid"}
                  >
                    {bill.status === "paid" ? "Paid" : "Mark Paid"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(bill.id)}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(bill.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p
                  className={cn(
                    "text-lg font-semibold",
                    bill.status === "overdue"
                      ? "text-rose-500"
                      : isDark
                        ? "text-slate-100"
                        : "text-slate-900",
                  )}
                >
                  {formatCurrency(bill.amount)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditBillId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
            <DialogDescription>Update the bill details and save changes.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="bill-title">Title</Label>
              <Input
                id="bill-title"
                value={editForm.title}
                onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bill-category">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="bill-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bill-frequency">Frequency</Label>
              <Select
                value={editForm.frequency}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger id="bill-frequency">
                  <SelectValue placeholder="Select a frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      {frequency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bill-due-date">Due Date</Label>
              <Input
                id="bill-due-date"
                type="date"
                value={editForm.dueDate}
                onChange={(event) => setEditForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bill-amount">Amount</Label>
              <Input
                id="bill-amount"
                type="number"
                min="0"
                step="0.01"
                value={editForm.amount}
                onChange={(event) => setEditForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleCloseEdit} type="button">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} type="button">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
