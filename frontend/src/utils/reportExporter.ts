import { jsPDF } from 'jspdf';
import { Booking, Payment } from '../types';

/**
 * Escapes CSV values to handle quotes, commas, and line-breaks correctly.
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Exports data to a CSV file and triggers a browser download.
 * Prepends a UTF-8 Byte Order Mark (BOM) to support correct character encoding (ETB symbols, etc.) in Excel.
 */
export function exportToCSV(headers: string[], rows: any[][], fileName: string) {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const rowLines = rows.map(row => row.map(escapeCsvValue).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Programmatically constructs a high-impact, beautifully styled business statement PDF report.
 */
export function exportToPDF({
  type,
  title,
  subtitle,
  userEmail,
  userName,
  summaryMetrics,
  tableHeaders,
  tableRows,
  fileName
}: {
  type: 'owner' | 'admin';
  title: string;
  subtitle: string;
  userEmail: string;
  userName: string;
  summaryMetrics: { label: string; value: string }[];
  tableHeaders: string[];
  tableRows: string[][];
  fileName: string;
}) {
  // Initialize standard A4 PDF document (portrait, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let currentY = 22;

  // Add Background Tint (Slight neutral background overlay)
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // --- BRAND HEADER ---
  doc.setTextColor(24, 24, 27); // Charcoal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ETHIOVEHICLES RENT', margin, currentY);

  // Subtitle/Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 115, 115); // Gray-500
  doc.text('PREMIUM SECURE VEHICLE RESOURCING PLATFORM', margin, currentY + 5);

  // Elegant Divider Line: Gold Highlight
  doc.setDrawColor(212, 175, 55); // #D4AF37 Gold
  doc.setLineWidth(1);
  doc.line(margin, currentY + 9, pageWidth - margin, currentY + 9);

  currentY += 18;

  // --- REPORT TITLE & METADATA ---
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 115, 115);
  doc.text(subtitle, margin, currentY + 5);

  currentY += 12;

  // Metadata Box (Generated Date, Authorized User)
  doc.setFillColor(244, 244, 245); // Zinc-100
  doc.rect(margin, currentY, pageWidth - (margin * 2), 16, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(82, 82, 91); // Zinc-600
  doc.text('ISSUED TO:', margin + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userName} (${userEmail})`, margin + 28, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE GENERATED:', margin + 4, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC`, margin + 34, currentY + 11);

  currentY += 24;

  // --- SUMMARY STATS CARDS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text('FINANCIAL METRICS SUMMARY', margin, currentY);
  currentY += 5;

  const cardWidth = (pageWidth - (margin * 2) - 10) / summaryMetrics.length;
  summaryMetrics.forEach((metric, index) => {
    const cardX = margin + (index * (cardWidth + 5));
    // Draw Stat Card Frame
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 228, 231); // Zinc-200
    doc.setLineWidth(0.3);
    doc.rect(cardX, currentY, cardWidth, 22, 'FD');

    // Mini gold emphasis block on left of stat card
    doc.setFillColor(212, 175, 55);
    doc.rect(cardX, currentY, 1.5, 22, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text(metric.label.toUpperCase(), cardX + 5, currentY + 7);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text(metric.value, cardX + 5, currentY + 16);
  });

  currentY += 32;

  // --- TRANS_TABLE SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text('TRANSACTION LEDGER & AUDIT TRAIL', margin, currentY);
  currentY += 5;

  // Table Headers Background
  const tableWidth = pageWidth - (margin * 2);
  const colWidths = getColWidths(tableHeaders.length, tableWidth);

  doc.setFillColor(24, 24, 27); // Dark Charcoal header
  doc.rect(margin, currentY, tableWidth, 9, 'F');

  // Print Header Labels
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  let currentHeaderX = margin;
  tableHeaders.forEach((th, idx) => {
    let paddingLeft = 4;
    // Align last column header to terms right if it makes sense
    if (idx === tableHeaders.length - 1) {
      doc.text(th, currentHeaderX + colWidths[idx] - 4, currentY + 6, { align: 'right' });
    } else {
      doc.text(th, currentHeaderX + paddingLeft, currentY + 6);
    }
    currentHeaderX += colWidths[idx];
  });

  currentY += 9;

  // Draw Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  tableRows.forEach((row, rowIdx) => {
    // Page check: Avoid overflowing past page height
    if (currentY + 10 > pageHeight - 15) {
      // Add Footer on current page before adding a new one
      drawFooter(doc, pageHeight, pageWidth, margin);
      doc.addPage();
      // Draw background on new page too
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      currentY = 25;

      // Repeat Table Headers on new page
      doc.setFillColor(24, 24, 27);
      doc.rect(margin, currentY, tableWidth, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      let rHeaderX = margin;
      tableHeaders.forEach((th, idx) => {
        if (idx === tableHeaders.length - 1) {
          doc.text(th, rHeaderX + colWidths[idx] - 4, currentY + 6, { align: 'right' });
        } else {
          doc.text(th, rHeaderX + 4, currentY + 6);
        }
        rHeaderX += colWidths[idx];
      });
      currentY += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Alternating Rows background
    if (rowIdx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 248, 249); // Zinc-50
    }
    doc.rect(margin, currentY, tableWidth, 8, 'F');

    // Horizontal bottom line
    doc.setDrawColor(244, 244, 245);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + 8, margin + tableWidth, currentY + 8);

    doc.setTextColor(63, 63, 70); // Zinc-700
    let rowX = margin;
    row.forEach((cell, idx) => {
      // Highlight reference or amount
      if (idx === 0) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      if (idx === tableHeaders.length - 1) {
        // Status Column or last column - format beautifully
        const statusClean = String(cell).toLowerCase();
        if (statusClean === 'verified' || statusClean === 'completed') {
          doc.setTextColor(34, 197, 94); // Green
        } else if (statusClean === 'pending') {
          doc.setTextColor(234, 179, 8); // Yellow/Orange
        } else if (statusClean === 'rejected' || statusClean === 'failed' || statusClean === 'cancelled') {
          doc.setTextColor(239, 68, 68); // Red
        } else {
          doc.setTextColor(63, 63, 70);
        }
        doc.text(cell, rowX + colWidths[idx] - 4, currentY + 5.5, { align: 'right' });
      } else {
        // Highlight Currency Columns
        if (cell.includes('ETB')) {
          doc.setTextColor(24, 24, 27);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(63, 63, 70);
        }
        
        // Truncate if too long to prevent overflowing into adjacent columns
        let textToPrint = cell;
        const maxChars = Math.floor(colWidths[idx] * 0.45);
        if (textToPrint.length > maxChars) {
          textToPrint = textToPrint.substring(0, maxChars - 2) + '...';
        }

        doc.text(textToPrint, rowX + 4, currentY + 5.5);
      }
      rowX += colWidths[idx];
    });

    currentY += 8;
  });

  // Draw final footer
  drawFooter(doc, pageHeight, pageWidth, margin);

  // Trigger Save/Download
  doc.save(`${fileName}.pdf`);
}

/**
 * Helper to divide total table width across columns proportionally.
 */
function getColWidths(numCols: number, totalWidth: number): number[] {
  // We can hardcode standard column ratios based on average column count (e.g. 5 columns)
  if (numCols === 5) {
    return [
      totalWidth * 0.15, // Ref/Id
      totalWidth * 0.35, // Vehicle/Owner/Desc
      totalWidth * 0.20, // Date
      totalWidth * 0.15, // Amount
      totalWidth * 0.15  // Status
    ];
  }
  // Generic distribution
  const single = totalWidth / numCols;
  return Array(numCols).fill(single);
}

/**
 * Draws footer with official system stamp and page numbers.
 */
function drawFooter(doc: jsPDF, pageHeight: number, pageWidth: number, margin: number) {
  // Draw divider line
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170); // Zinc-400
  doc.text('This is an automated platform financial statement generated securely on Ethiovehicles Rent app.', margin, pageHeight - 8);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 8, { align: 'right' });
}
