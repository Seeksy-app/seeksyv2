import { supabase } from "@/integrations/supabase/client";

interface SendLegalEmailParams {
  type: "invite" | "finalize" | "completed";
  purchaserEmail: string;
  purchaserName?: string;
  sellerName?: string;
  chairmanEmail?: string;
  chairmanName?: string;
  purchaserLink?: string;
  chairmanLink?: string;
  numberOfShares?: number;
  purchaseAmount?: number;
  pricePerShare?: number;
}

export async function sendLegalAgreementEmail(params: SendLegalEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-legal-agreement-email', {
      body: params
    });

    if (error) {
      console.error('Failed to send legal agreement email:', error);
      return { success: false, error: error.message };
    }

    console.log('Legal agreement email sent:', data);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
