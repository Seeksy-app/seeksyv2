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
}

/**
 * Replace placeholders in body text with actual values
 */
function renderBodyText(bodyText: string, data: ExportData): string {
  return bodyText
    .replace(/\[PURCHASER_NAME\]/g, data.purchaserName)
    .replace(/\[PURCHASER_EMAIL\]/g, data.purchaserEmail)
    .replace(/\[PURCHASER_ADDRESS\]/g, data.purchaserAddress)
    .replace(/\[SELLER_NAME\]/g, data.sellerName || 'Andrew Appleton')
    .replace(/\[SELLER_EMAIL\]/g, data.sellerEmail || 'appletonab@gmail.com')
    .replace(/\[SELLER_ADDRESS\]/g, data.sellerAddress || '413 Independence Ave SE, Washington DC 20003')
    .replace(/\[PRICE_PER_SHARE\]/g, `$${data.pricePerShare.toFixed(2)}`)
    .replace(/\[NUMBER_OF_SHARES\]/g, data.numberOfShares.toLocaleString())
    .replace(/\[PURCHASE_AMOUNT\]/g, `$${data.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    // Replace checkbox placeholders with checked/unchecked boxes
    .replace(/\[ \] Individual with net worth/g, data.accreditedNetWorth ? '[X] Individual with net worth' : '[ ] Individual with net worth')
    .replace(/\[ \] Individual with income exceeding/g, data.accreditedIncome ? '[X] Individual with income exceeding' : '[ ] Individual with income exceeding')
    .replace(/\[ \] Director, executive officer/g, data.accreditedDirector ? '[X] Director, executive officer' : '[ ] Director, executive officer')
    .replace(/\[ \] Other \(please specify\)/g, data.accreditedOther ? `[X] Other (please specify): ${data.accreditedOtherText || ''}` : '[ ] Other (please specify):');
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
 * Export agreement as DOCX with proper page breaks
 */
export async function exportToDocx(data: ExportData): Promise<void> {
  const renderedText = renderBodyText(data.bodyText, data);
  
  const paragraphs: Paragraph[] = [];
  
  // Title
  paragraphs.push(
    new Paragraph({
      text: "COMMON STOCK PURCHASE AGREEMENT",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );
  
  const lines = renderedText.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle page break markers
    if (trimmedLine.includes('[THIS PAGE INTENTIONALLY LEFT BLANK]')) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      paragraphs.push(
        new Paragraph({
          text: "[THIS PAGE INTENTIONALLY LEFT BLANK]",
          alignment: AlignmentType.CENTER,
          spacing: { before: 4000 },
        })
      );
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
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
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      continue;
    }
    
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }
    
    // Check if it's a section header
    const isHeader = /^(\d+\.|SECTION|ARTICLE|EXHIBIT|RECITALS|AGREEMENT)/i.test(trimmedLine);
    const isCentered = /^(EXHIBIT|RECITALS|AGREEMENT|STOCK POWER|JOINDER AGREEMENT|ACCREDITED INVESTOR)/i.test(trimmedLine);
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            bold: isHeader,
            size: isHeader ? 24 : 22,
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
  
  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const title = "COMMON STOCK PURCHASE AGREEMENT";
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += lineHeight * 3;
  
  // Body
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const lines = renderedText.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for page break markers
    if (trimmedLine.includes('[THIS PAGE INTENTIONALLY LEFT BLANK]')) {
      pdf.addPage();
      yPosition = pageHeight / 2;
      pdf.setFont('helvetica', 'italic');
      const blankText = "[THIS PAGE INTENTIONALLY LEFT BLANK]";
      const blankWidth = pdf.getTextWidth(blankText);
      pdf.text(blankText, (pageWidth - blankWidth) / 2, yPosition);
      pdf.addPage();
      yPosition = margin;
      pdf.setFont('helvetica', 'normal');
      continue;
    }
    
    if (trimmedLine.includes('[SIGNATURE PAGE') || trimmedLine.includes('[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]')) {
      // Add signature page marker and force new page
      pdf.setFont('helvetica', 'italic');
      const sigText = trimmedLine;
      const sigWidth = pdf.getTextWidth(sigText);
      pdf.text(sigText, (pageWidth - sigWidth) / 2, yPosition);
      yPosition += lineHeight * 2;
      pdf.addPage();
      yPosition = margin;
      pdf.setFont('helvetica', 'normal');
      continue;
    }
    
    if (!trimmedLine) {
      yPosition += lineHeight;
      continue;
    }
    
    // Check if it's a section header
    const isHeader = /^(\d+\.|SECTION|ARTICLE|RECITALS|AGREEMENT|EXHIBIT|STOCK POWER|JOINDER|ACCREDITED)/i.test(trimmedLine);
    const isCentered = /^(EXHIBIT|RECITALS|AGREEMENT|STOCK POWER|JOINDER AGREEMENT|ACCREDITED INVESTOR)/i.test(trimmedLine);
    
    if (isHeader) {
      pdf.setFont('helvetica', 'bold');
      yPosition += lineHeight; // Extra space before headers
    } else {
      pdf.setFont('helvetica', 'normal');
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
    
    yPosition += lineHeight * 0.5; // Paragraph spacing
  }
  
  pdf.save(generateFilename(data.purchaserName, data.instanceId, 'pdf'));
}