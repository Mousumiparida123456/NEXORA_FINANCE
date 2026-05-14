import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Exports a DOM element to PDF using html2canvas and jsPDF.
 * Optimized for Nexora's dark theme and complex charts.
 */
export async function exportDashboardToPDF(elementId: string, filename: string = "Nexora_Monthly_Report.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[PDF Export] Element with id ${elementId} not found`);
    return false;
  }

  try {
    // 1. Prepare element for export
    element.classList.add("exporting-pdf");
    
    // Give a small delay for any animations or state changes to settle
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Capture with html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High DPI
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#020617", // Matches Slate-950 (Nexora default)
      onclone: (clonedDoc) => {
        // You can manipulate the cloned DOM here if needed
        const el = clonedDoc.getElementById(elementId);
        if (el) {
          el.style.padding = "20px";
          el.style.borderRadius = "0";
        }
      }
    });

    element.classList.remove("exporting-pdf");

    // 3. Process image data
    const imgData = canvas.toDataURL("image/png"); // PNG handles transparency/colors better than JPEG for UI
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    // Calculate scaling to fit A4
    const ratio = Math.min(pdfWidth / (imgWidth / 4), pdfHeight / (imgHeight / 4)); // Adjusted for scale:2
    const finalWidth = (imgWidth / 4) * ratio;
    const finalHeight = (imgHeight / 4) * ratio;

    // 4. Generate PDF
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    // Center on page
    const x = (pdf.internal.pageSize.getWidth() - finalWidth) / 2;
    const y = 10; // Small top margin

    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight, undefined, 'FAST');
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error("[PDF Export] Failed:", error);
    if (element) element.classList.remove("exporting-pdf");
    return false;
  }
}
