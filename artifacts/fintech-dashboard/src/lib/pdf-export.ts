import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportDashboardToPDF(elementId: string, filename: string = "Nexora_Monthly_Report.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Add a temporary class to the element to apply specific print styles if needed
    element.classList.add("exporting-pdf");
    
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: "#060c20", // Default dark mode background
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    element.classList.remove("exporting-pdf");

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    
    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    const canvasRatio = canvas.width / canvas.height;
    const pdfRatio = pdfWidth / pdfHeight;
    
    let finalWidth = pdfWidth;
    let finalHeight = pdfHeight;
    
    if (canvasRatio > pdfRatio) {
      finalHeight = pdfWidth / canvasRatio;
    } else {
      finalWidth = pdfHeight * canvasRatio;
    }
    
    // Center the image
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    const pdf = new jsPDF({
      orientation: canvasRatio > 1 ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return false;
  }
}
