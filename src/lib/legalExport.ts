import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import jsPDF from 'jspdf';

interface ExportData {
  purchaserName: string;
  purchaserEmail: string;
  purchaserAddress: string;
  sellerName: string;
  sellerEmail: string;
  sellerAddress: string;
  pricePerShare: number;
  numberOfShares: number;
  purchaseAmount: number;
  bodyText: string;
  instanceId: string;
  // Certification fields
  isSophisticatedInvestor?: boolean;
  accreditedNetWorth?: boolean;
  accreditedIncome?: boolean;
  accreditedDirector?: boolean;
  accreditedOther?: boolean;
  accreditedOtherText?: string;
  // Signature fields
  sellerSignatureUrl?: string;
  purchaserSignatureUrl?: string;
  chairmanSignatureUrl?: string;
  chairmanName?: string;
  chairmanTitle?: string;
  sellerSignedAt?: string;
  purchaserSignedAt?: string;
  chairmanSignedAt?: string;
}

/**
 * Replace placeholders in body text with actual values
 */
function renderBodyText(bodyText: string, data: ExportData): string {
  // Get current date formatted
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  let text = bodyText
    .replace(/\[PURCHASER_NAME\]/g, data.purchaserName)
    .replace(/\[PURCHASER_EMAIL\]/g, data.purchaserEmail)
    .replace(/\[PURCHASER_ADDRESS\]/g, data.purchaserAddress)
    .replace(/\[SELLER_NAME\]/g, data.sellerName || 'Andrew Appleton')
    .replace(/\[SELLER_EMAIL\]/g, data.sellerEmail || 'appletonab@gmail.com')
    .replace(/\[SELLER_ADDRESS\]/g, data.sellerAddress || '413 Independence Ave SE, Washington DC 20003')
    .replace(/\[PRICE_PER_SHARE\]/g, `$${data.pricePerShare.toFixed(2)}`)
    .replace(/\[NUMBER_OF_SHARES\]/g, data.numberOfShares.toLocaleString())
    .replace(/\[PURCHASE_AMOUNT\]/g, `$${data.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    // Date placeholders - use current date
    .replace(/\[SELLER_DATE\]/g, currentDate)
    .replace(/\[PURCHASER_DATE\]/g, currentDate)
    .replace(/\[CHAIRMAN_DATE\]/g, currentDate)
    // Checkbox placeholders with checkmarks
    .replace(/\[CHECKBOX_NET_WORTH\]/g, data.accreditedNetWorth ? '☑' : '☐')
    .replace(/\[CHECKBOX_INCOME\]/g, data.accreditedIncome ? '☑' : '☐')
    .replace(/\[CHECKBOX_DIRECTOR\]/g, data.accreditedDirector ? '☑' : '☐')
    .replace(/\[CHECKBOX_OTHER\]/g, data.accreditedOther ? '☑' : '☐')
    .replace(/\[ACCREDITED_OTHER_TEXT\]/g, data.accreditedOtherText || '___');
  
  // Replace chairman placeholders
  if (data.chairmanName) {
    text = text.replace(/\[CHAIRMAN_NAME\]/g, data.chairmanName);
  }
  if (data.chairmanTitle) {
    text = text.replace(/\[CHAIRMAN_TITLE\]/g, data.chairmanTitle);
  }
  
  return text;
}

/**
 * Generate filename for exports
 */
function generateFilename(purchaserName: string, instanceId: string, extension: string): string {
  const safeName = purchaserName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const shortId = instanceId.slice(0, 8);
  return `StockPurchaseAgreement_${safeName}_${shortId}.${extension}`;
}

/**
 * Check if a line should be centered
 */
function shouldCenter(line: string): boolean {
  const trimmed = line.trim().toUpperCase();
  const centeredPatterns = [
    /^COMMON STOCK PURCHASE AGREEMENT$/,
    /^RECITALS$/,
    /^AGREEMENT$/,
    /^EXHIBITS?$/,
    /^EXHIBIT [A-Z]$/,
    /^STOCK POWER$/,
    /^JOINDER AGREEMENT$/,
    /^ACCREDITED INVESTOR/,
    /^\[SIGNATURE PAGE/,
    /^\[REMAINDER OF PAGE/,
    /^\[THIS PAGE INTENTIONALLY/,
  ];
  return centeredPatterns.some(p => p.test(trimmed));
}

/**
 * Check if a line is a section header (should be bold)
 */
function isHeader(line: string): boolean {
  const trimmed = line.trim();
  return /^(\d+\.|SECTION|ARTICLE|RECITALS|AGREEMENT|EXHIBIT|STOCK POWER|JOINDER|ACCREDITED|COMMON STOCK|SELLER:|BUYER:|AGREED|IN WITNESS|NOW, THEREFORE)/i.test(trimmed);
}

/**
 * Export agreement as DOCX with proper page breaks
 */
export async function exportToDocx(data: ExportData): Promise<void> {
  const renderedText = renderBodyText(data.bodyText, data);
  
  const paragraphs: Paragraph[] = [];
  
  const lines = renderedText.split('\n');
  let skipNextIfDuplicate = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip duplicate titles (body_text may start with title that we already added)
    if (skipNextIfDuplicate && trimmedLine === skipNextIfDuplicate) {
      skipNextIfDuplicate = '';
      continue;
    }
    
    // Handle page break markers - just add one page break, not two
    if (trimmedLine.includes('[THIS PAGE INTENTIONALLY LEFT BLANK]')) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      paragraphs.push(
        new Paragraph({
          text: "[THIS PAGE INTENTIONALLY LEFT BLANK]",
          alignment: AlignmentType.CENTER,
          spacing: { before: 4000 },
        })
      );
      continue;
    }
    
    if (trimmedLine.includes('[SIGNATURE PAGE') || trimmedLine.includes('[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmedLine, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        })
      );
      continue;
    }
    
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }
    
    const isCentered = shouldCenter(trimmedLine);
    const isBold = isHeader(trimmedLine);
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            bold: isBold,
            size: isBold ? 24 : 22,
          }),
        ],
        alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 200 },
      })
    );
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generateFilename(data.purchaserName, data.instanceId, 'docx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export agreement as PDF with proper page breaks
 */
export async function exportToPdf(data: ExportData): Promise<void> {
  const renderedText = renderBodyText(data.bodyText, data);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 25;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  const lineHeight = 5;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bottomMargin = 25;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const lines = renderedText.split('\n');
  let seenTitle = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines at the very end of the document
    if (i === lines.length - 1 && !trimmedLine) {
      continue;
    }
    
    // Handle the main title specially - only render once and centered
    if (trimmedLine === 'COMMON STOCK PURCHASE AGREEMENT') {
      if (seenTitle) continue; // Skip duplicate
      seenTitle = true;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const titleWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += lineHeight * 3;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      continue;
    }
    
    // Check for intentionally blank page markers - render centered, then continue (no double page break)
    if (trimmedLine.includes('[THIS PAGE INTENTIONALLY LEFT BLANK]')) {
      // Move to next page first
      pdf.addPage();
      yPosition = pageHeight / 2;
      pdf.setFont('helvetica', 'italic');
      const blankText = "[THIS PAGE INTENTIONALLY LEFT BLANK]";
      const blankWidth = pdf.getTextWidth(blankText);
      pdf.text(blankText, (pageWidth - blankWidth) / 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      // Do NOT add another page here - let natural flow continue
      yPosition = pageHeight; // Force next content to new page
      continue;
    }
    
    // Handle signature page markers
    if (trimmedLine.includes('[SIGNATURE PAGE') || trimmedLine.includes('[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]')) {
      pdf.setFont('helvetica', 'italic');
      const sigWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - sigWidth) / 2, yPosition);
      yPosition += lineHeight * 2;
      pdf.setFont('helvetica', 'normal');
      continue;
    }
    
    // Handle empty lines
    if (!trimmedLine) {
      yPosition += lineHeight;
      // Check page break for empty lines too
      if (yPosition > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      continue;
    }
    
    const isCentered = shouldCenter(trimmedLine);
    const isBold = isHeader(trimmedLine);
    
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
      // Check if it's a major section that needs larger font
      if (/^(EXHIBIT [A-Z]|STOCK POWER|JOINDER AGREEMENT|ACCREDITED INVESTOR)$/i.test(trimmedLine)) {
        pdf.setFontSize(12);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
    }
    
    // Split long lines
    const splitLines = pdf.splitTextToSize(trimmedLine, maxWidth);
    
    for (const splitLine of splitLines) {
      // Check if we need a new page
      if (yPosition > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      if (isCentered) {
        const textWidth = pdf.getTextWidth(splitLine);
        pdf.text(splitLine, (pageWidth - textWidth) / 2, yPosition);
      } else {
        pdf.text(splitLine, margin, yPosition);
      }
      yPosition += lineHeight;
    }
    
    // Reset font size after headers
    pdf.setFontSize(10);
    yPosition += lineHeight * 0.3; // Paragraph spacing
  }
  
  pdf.save(generateFilename(data.purchaserName, data.instanceId, 'pdf'));
}
