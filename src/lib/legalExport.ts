import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import jsPDF from 'jspdf';

interface ExportData {
  purchaserName: string;
  pricePerShare: number;
  numberOfShares: number;
  purchaseAmount: number;
  bodyText: string;
  instanceId: string;
}

/**
 * Replace placeholders in body text with actual values
 */
function renderBodyText(bodyText: string, data: ExportData): string {
  return bodyText
    .replace(/\[PURCHASER_NAME\]/g, data.purchaserName)
    .replace(/\[PRICE_PER_SHARE\]/g, `$${data.pricePerShare.toFixed(2)}`)
    .replace(/\[NUMBER_OF_SHARES\]/g, data.numberOfShares.toLocaleString())
    .replace(/\[PURCHASE_AMOUNT\]/g, `$${data.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
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
 * Export agreement as DOCX
 */
export async function exportToDocx(data: ExportData): Promise<void> {
  const renderedText = renderBodyText(data.bodyText, data);
  const lines = renderedText.split('\n');
  
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
  
  // Body text - preserve paragraphs
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }
    
    // Check if it's a section header (numbered like 1., 2., etc. or contains "SECTION")
    const isHeader = /^(\d+\.|SECTION|ARTICLE)/i.test(trimmedLine);
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            bold: isHeader,
            size: isHeader ? 24 : 22,
          }),
        ],
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
 * Export agreement as PDF
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
  pdf.setFontSize(16);
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
    
    if (!trimmedLine) {
      yPosition += lineHeight;
      continue;
    }
    
    // Check if it's a section header
    const isHeader = /^(\d+\.|SECTION|ARTICLE)/i.test(trimmedLine);
    
    if (isHeader) {
      pdf.setFont('helvetica', 'bold');
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
      
      pdf.text(splitLine, margin, yPosition);
      yPosition += lineHeight;
    }
    
    yPosition += lineHeight * 0.5; // Paragraph spacing
  }
  
  pdf.save(generateFilename(data.purchaserName, data.instanceId, 'pdf'));
}
