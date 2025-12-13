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
  purchaserName: string;
  purchaserAddress: string;
  numberOfShares: number;
  pricePerShare: number;
  agreementDate?: string;
  templatePath?: string;
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
      purchaserName, 
      purchaserAddress, 
      numberOfShares, 
      pricePerShare, 
      agreementDate,
      templatePath = "stock-purchase-agreement.docx" 
    } = body;

    console.log("Generating document from template for:", purchaserName);
    console.log("Template path:", templatePath);

    // Calculate total amount
    const totalAmount = numberOfShares * pricePerShare;

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
      // Primary placeholders (uppercase with underscores)
      PURCHASER_NAME: purchaserName,
      PURCHASER_ADDRESS: purchaserAddress,
      NUMBER_OF_SHARES: numberOfShares.toLocaleString(),
      PRICE_PER_SHARE: pricePerShare.toFixed(2),
      PURCHASE_AMOUNT: totalAmount.toFixed(2),
      TOTAL_AMOUNT: totalAmount.toFixed(2),
      AGREEMENT_DATE: formattedDate,
      
      // Alternative formats users might use
      purchaserName,
      purchaserAddress,
      numberOfShares: numberOfShares.toLocaleString(),
      pricePerShare: pricePerShare.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      purchaseAmount: totalAmount.toFixed(2),
      agreementDate: formattedDate,
      
      // Variations
      Purchaser_Name: purchaserName,
      Purchaser_Address: purchaserAddress,
      Number_of_Shares: numberOfShares.toLocaleString(),
      Price_Per_Share: pricePerShare.toFixed(2),
      Purchase_Amount: totalAmount.toFixed(2),
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
