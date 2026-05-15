import { jsPDF } from "jspdf";
import { format } from "date-fns";

export interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    healthScore: number;
  };
  expenses: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  investments: {
    totalInvested: number;
    netGain: number;
    roiPercent: number;
    breakdown: { name: string; amount: number }[];
  };
  insights: string[];
  milestone: {
    title: string;
    remaining: string;
    progressPct: number;
  };
}

/**
 * Generates a professional PDF report from financial data.
 */
export async function generateFinancialReport(data: ReportData, filename: string = "Nexora_Financial_Report.pdf") {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // --- Helper Functions ---
    const addSectionTitle = (title: string) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text(title, margin, y);
      y += 5;
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.line(margin, y, margin + contentWidth, y);
      y += 10;
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    };

    // --- Header ---
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, 40, "F");
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text("NEXORA FINANCE", margin, 20);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(203, 213, 225); // slate-300
    pdf.text(`REPORT GENERATED ON: ${format(new Date(), "PPpp")}`, margin, 30);
    
    y = 55;

    // --- Executive Summary ---
    addSectionTitle("EXECUTIVE SUMMARY");
    
    const summaryBoxWidth = contentWidth / 4;
    const items = [
      { label: "TOTAL INCOME", value: formatCurrency(data.summary.totalIncome), color: [16, 185, 129] },
      { label: "TOTAL EXPENSES", value: formatCurrency(data.summary.totalExpenses), color: [239, 68, 68] },
      { label: "NET SAVINGS", value: formatCurrency(data.summary.savings), color: [59, 130, 246] },
      { label: "HEALTH SCORE", value: `${data.summary.healthScore}/100`, color: [139, 92, 246] },
    ];

    items.forEach((item, i) => {
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(item.label, margin + (i * summaryBoxWidth), y);
      
      pdf.setFontSize(12);
      pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
      pdf.text(item.value, margin + (i * summaryBoxWidth), y + 7);
    });

    y += 20;

    // --- Expense Breakdown ---
    addSectionTitle("EXPENSE ANALYSIS");
    
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85); // slate-700
    pdf.text("TOP EXPENDITURE CATEGORIES", margin, y);
    y += 8;

    data.expenses.slice(0, 5).forEach((exp, i) => {
      // Category Name
      pdf.setFont("helvetica", "bold");
      pdf.text(exp.name, margin, y);
      
      // Progress Bar Background
      pdf.setDrawColor(241, 245, 249); // slate-100
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin + 50, y - 4, 80, 4, "F");
      
      // Progress Bar Fill
      pdf.setFillColor(239, 68, 68); // rose-500
      pdf.rect(margin + 50, y - 4, (exp.percentage / 100) * 80, 4, "F");
      
      // Amount and %
      pdf.setFont("helvetica", "normal");
      pdf.text(`${formatCurrency(exp.amount)} (${Math.round(exp.percentage)}%)`, margin + 140, y);
      
      y += 10;
    });

    y += 10;

    // --- Investment Summary ---
    addSectionTitle("INVESTMENT PERFORMANCE");
    
    const investGrid = [
      { label: "Total Invested", value: formatCurrency(data.investments.totalInvested) },
      { label: "Net Gain/Loss", value: formatCurrency(data.investments.netGain) },
      { label: "ROI Percentage", value: `${data.investments.roiPercent.toFixed(2)}%` },
    ];

    investGrid.forEach((item, i) => {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(item.label, margin + (i * 60), y);
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.value, margin + (i * 60), y + 6);
    });

    y += 15;
    pdf.setFontSize(10);
    pdf.text("PORTFOLIO ALLOCATION", margin, y);
    y += 8;

    data.investments.breakdown.forEach((item, i) => {
      pdf.setFontSize(9);
      pdf.text(`• ${item.name}: ${formatCurrency(item.amount)}`, margin + 5, y);
      y += 7;
    });

    y += 10;

    // --- Smart Insights ---
    addSectionTitle("NEXORA AI INSIGHTS");
    
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);
    
    data.insights.slice(0, 4).forEach((insight, i) => {
      const splitText = pdf.splitTextToSize(insight, contentWidth - 10);
      pdf.text(">", margin, y);
      pdf.text(splitText, margin + 5, y);
      y += (splitText.length * 6) + 2;
    });

    y += 5;

    // --- Milestone ---
    addSectionTitle("FINANCIAL GOALS & MILESTONES");
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(data.milestone.title, margin, y);
    y += 6;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Target Remaining: ${data.milestone.remaining}`, margin, y);
    
    // Progress Bar
    y += 5;
    pdf.setDrawColor(241, 245, 249);
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, contentWidth, 6, "F");
    
    pdf.setFillColor(34, 197, 94); // emerald-500
    pdf.rect(margin, y, (data.milestone.progressPct / 100) * contentWidth, 6, "F");
    
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${Math.round(data.milestone.progressPct)}% COMPLETE`, margin + 5, y + 4);

    // --- Footer ---
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    const footerText = "This report is generated by Nexora Finance AI Engine. For informational purposes only.";
    pdf.text(footerText, (pageWidth - pdf.getTextWidth(footerText)) / 2, 285);

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("[PDF Export] Failed:", error);
    return false;
  }
}

// Keep the old function for backward compatibility if needed, but marked as deprecated or updated
export async function exportDashboardToPDF(elementId: string, filename: string = "Nexora_Monthly_Report.pdf") {
    // This is now a wrapper or can be kept as the legacy screenshot method
    // For now, let's keep it but ideally we should transition to data-driven
    console.warn("Legacy exportDashboardToPDF called. Consider using generateFinancialReport.");
    return false; // Force usage of the new one by returning false to trigger the fallback in Dashboard.tsx if not updated
}
