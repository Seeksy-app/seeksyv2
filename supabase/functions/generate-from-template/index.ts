import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - Deno import
import Docxtemplater from "https://esm.sh/docxtemplater@3.47.0";
// @ts-ignore - Deno import
import PizZip from "https://esm.sh/pizzip@3.1.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  templateName?: string;
  purchaserName: string;
  purchaserAddress: string;
  purchaserEmail?: string;
  sellerName?: string;
  sellerAddress?: string;
  sellerEmail?: string;
  chairmanName?: string;
  chairmanTitle?: string;
  companyName?: string;
  numberOfShares: number;
  pricePerShare: number;
  agreementDate?: string;
  investorCertification?: string;
  // Checkbox markers for investor certification
  certNetWorth?: string;
  certIncome?: string;
  certDirector?: string;
  certSophisticated?: string;
}

// Convert number to words (for shares)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  return num.toLocaleString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { 
      templateName = "stock-purchase-agreement.docx",
      purchaserName, 
      purchaserAddress,
      purchaserEmail = "",
      sellerName = "Seeksy, Inc.",
      sellerAddress = "",
      sellerEmail = "",
      chairmanName = "",
      chairmanTitle = "Chairman of the Board",
      companyName = "Seeksy, Inc.",
      numberOfShares, 
      pricePerShare, 
      agreementDate,
      investorCertification = "",
    } = body;

    // Determine which certification checkbox should be checked
    const isSophisticated = investorCertification.includes("Sophisticated Investor") || investorCertification.includes("Section 4(a)(1)");
    const isNetWorth = investorCertification.includes("net worth");
    const isIncome = investorCertification.includes("income");
    const isDirector = investorCertification.includes("Director") || investorCertification.includes("executive officer");
    
    // Unicode checkbox characters: ☑ (checked) or ☐ (unchecked)
    const certSophisticated = isSophisticated ? "☑" : "☐";
    const certNetWorth = isNetWorth && !isSophisticated ? "☑" : "☐";
    const certIncome = isIncome && !isSophisticated ? "☑" : "☐";
    const certDirector = isDirector && !isSophisticated ? "☑" : "☐";

    // Construct template path - check if it's in the investment-documents folder
    const templatePath = templateName.includes('/') 
      ? templateName 
      : `investment-documents/${templateName}`;

    console.log("Generating document from template for:", purchaserName);
    console.log("Template path:", templatePath);

    // Calculate total amount
    const totalAmount = numberOfShares * pricePerShare;
    const sharesInWords = numberToWords(numberOfShares);

    // Download template from storage
    const { data: templateBlob, error: downloadError } = await supabase.storage
      .from("legal-templates")
      .download(templatePath);

    if (downloadError || !templateBlob) {
      console.error("Template download error:", downloadError);
      return new Response(
        JSON.stringify({ 
          error: "Template not found. Please upload your Word template first.",
          details: downloadError?.message 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Template downloaded, size:", templateBlob.size);

    // Convert blob to array buffer
    const templateBuffer = await templateBlob.arrayBuffer();
    const templateArray = new Uint8Array(templateBuffer);

    // Load the template with PizZip
    const zip = new PizZip(templateArray);
    
    // Create docxtemplater instance with square bracket delimiters
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "[",
        end: "]"
      }
    });

    // Format the date
    const formattedDate = agreementDate || new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Set template data - matches placeholders like [PURCHASER_NAME]
    const templateData = {
      // Buyer/Purchaser placeholders (used on multiple signature pages)
      PURCHASER_NAME: purchaserName,
      PURCHASER_ADDRESS: purchaserAddress,
      PURCHASER_EMAIL: purchaserEmail,
      BUYER_NAME: purchaserName,
      BUYER_ADDRESS: purchaserAddress,
      BUYER_EMAIL: purchaserEmail,
      
      // Seller placeholders
      SELLER_NAME: sellerName,
      SELLER_ADDRESS: sellerAddress,
      SELLER_EMAIL: sellerEmail,
      
      // Chairman and Company placeholders (for Joinder Agreement)
      CHAIRMAN_NAME: chairmanName,
      CHAIRMAN_TITLE: chairmanTitle,
      COMPANY_NAME: companyName,
      
      // Share/Amount placeholders
      NUMBER_OF_SHARES: numberOfShares.toLocaleString(),
      NUMBER_OF_SHARES_WORDS: sharesInWords,
      PRICE_PER_SHARE: pricePerShare.toFixed(2),
      PURCHASE_AMOUNT: totalAmount.toFixed(2),
      TOTAL_AMOUNT: totalAmount.toFixed(2),
      AGREEMENT_DATE: formattedDate,
      DATE: formattedDate,
      
      // Investor certification placeholder and checkboxes
      INVESTOR_CERTIFICATION: investorCertification || "N/A",
      CERT_NET_WORTH: certNetWorth,
      CERT_INCOME: certIncome,
      CERT_DIRECTOR: certDirector,
      CERT_SOPHISTICATED: certSophisticated,
      
      // Transferee name for Stock Power (Exhibit A)
      TRANSFEREE_NAME: purchaserName,
      
      // Alternative formats users might use (camelCase)
      purchaserName,
      purchaserAddress,
      purchaserEmail,
      sellerName,
      sellerAddress,
      sellerEmail,
      chairmanName,
      chairmanTitle,
      companyName,
      numberOfShares: numberOfShares.toLocaleString(),
      numberOfSharesWords: sharesInWords,
      pricePerShare: pricePerShare.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      purchaseAmount: totalAmount.toFixed(2),
      agreementDate: formattedDate,
      date: formattedDate,
      investorCertification: investorCertification || "N/A",
      certNetWorth,
      certIncome,
      certDirector,
      certSophisticated,
      transfereeName: purchaserName,
    };

    console.log("Rendering document with data:", JSON.stringify(templateData, null, 2));

    // Render the document
    doc.render(templateData);

    // Generate output as base64
    const output = doc.getZip().generate({
      type: "base64",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    console.log("Document generated successfully from template");

    return new Response(
      JSON.stringify({ 
        document: output,
        filename: `Stock_Purchase_Agreement_${purchaserName.replace(/\s+/g, "_")}.docx`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating document from template:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
