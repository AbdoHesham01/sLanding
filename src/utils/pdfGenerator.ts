import jsPDF from "jspdf";

export interface BookingData {
  bookingId: string;
  tripId: string;
  from: string;
  to: string;
  departure: string;
  flightNumber: string;
  seats: string[];
  passengers: Array<{
    type: "ADULT" | "INFANT";
    name: string;
    passportNumberOrIdNumber: string;
  }>;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  totalAmount: number;
  currency: string;
  bookingDate: string;
  paymentStatus: string;
}

export const generateInvoicePDF = (bookingData: BookingData): void => {
  try {
    if (!bookingData.bookingId || !bookingData.from || !bookingData.to) {
      throw new Error("Missing required booking data for PDF generation");
    }

    const doc = new jsPDF();
    doc.setFont("helvetica");

    // Header
    doc.setFillColor(23, 159, 219);
    doc.rect(0, 0, 210, 40, "F");
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text("Flight Booking System", 20, 25);

    // Invoice title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("BOOKING INVOICE", 20, 55);

    // Invoice info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Invoice Date: " + new Date().toLocaleDateString(), 120, 45);
    doc.text("Booking ID: " + bookingData.bookingId, 120, 52);

    let yPos = 75;
    const lineHeight = 7;

    // Booking Details
    doc.setFontSize(14);
    doc.setTextColor(23, 159, 219);
    doc.text("Booking Details", 20, yPos);
    doc.setLineWidth(1);
    doc.setDrawColor(23, 159, 219);
    doc.line(20, yPos + 5, 190, yPos + 5);

    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Route: " + bookingData.from + "  " + bookingData.to, 20, yPos);
    doc.text(
      "Departure: " + new Date(bookingData.departure).toLocaleString(),
      20,
      yPos + lineHeight
    );
    doc.text(
      "Seats: " + bookingData.seats.join(", "),
      20,
      yPos + lineHeight * 2
    );
    doc.text(
      "Passengers: " + bookingData.passengers.length,
      20,
      yPos + lineHeight * 3
    );

    // Contact Info
    yPos += lineHeight * 5;
    doc.setFontSize(14);
    doc.setTextColor(23, 159, 219);
    doc.text("Contact Information", 20, yPos);
    doc.line(20, yPos + 5, 190, yPos + 5);

    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Name: " + bookingData.bookerName, 20, yPos);
    doc.text("Email: " + bookingData.bookerEmail, 20, yPos + lineHeight);
    doc.text("Phone: " + bookingData.bookerPhone, 20, yPos + lineHeight * 2);

    // Payment Summary
    yPos += lineHeight * 4;
    doc.setFillColor(23, 159, 219);
    doc.rect(20, yPos - 5, 170, 25, "F");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(
      "Total: " + bookingData.totalAmount + " " + bookingData.currency,
      25,
      yPos + 10
    );

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for choosing our flight booking service!", 20, 280);

    // Open PDF
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(pdfUrl, "_blank");

    if (!newWindow) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "Invoice_" + bookingData.bookingId + ".pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 2000);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF invoice. Please try again.");
  }
};

export const openInvoicePDF = (bookingData: BookingData): void => {
  generateInvoicePDF(bookingData);
};
