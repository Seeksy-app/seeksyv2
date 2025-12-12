import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LegalDocPreview } from "@/components/legal/LegalDocPreview";
import { SignaturePad } from "@/components/legal/SignaturePad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { sendLegalAgreementEmail } from "@/lib/legal/emails";

interface ChairmanFieldValues {
  chairman_name?: string;
  chairman_title?: string;
  [key: string]: any;
}

interface ChairmanComputedValues {
  price_per_share?: number;
  [key: string]: any;
}

export default function ChairmanSignaturePage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  // Fetch instance by token
  const { data: instance, isLoading, error } = useQuery({
    queryKey: ["legal-instance-chairman", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_doc_instances")
        .select(`
          *,
          legal_templates (name, body_text)
        `)
        .eq("invite_token", token)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  // Chairman signature mutation
  const signMutation = useMutation({
    mutationFn: async (signatureUrl: string) => {
      const { error } = await supabase
        .from("legal_doc_instances")
        .update({
          chairman_signature_url: signatureUrl,
          chairman_signed_at: new Date().toISOString(),
          status: "finalized",
        })
        .eq("id", instance?.id);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance-chairman", token] });
      
      // Send completion emails
      const fv = instance?.field_values_json as any || {};
      const cv = instance?.computed_values_json as any || {};
      const viewLink = `${window.location.origin}/legal/purchaser/${token}`;
      
      await sendLegalAgreementEmail({
        type: "completed",
        purchaserEmail: fv.purchaser_email || instance?.purchaser_email || "",
        purchaserName: fv.purchaser_name,
        sellerName: fv.seller_name,
        chairmanEmail: fv.chairman_email,
        chairmanName: fv.chairman_name,
        purchaserLink: viewLink,
        numberOfShares: fv.number_of_shares,
        purchaseAmount: fv.purchase_amount,
        pricePerShare: cv.price_per_share,
      });
      
      toast.success("Signature saved - Agreement finalized. Confirmation emails sent.");
    },
    onError: () => {
      toast.error("Failed to save signature");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              This agreement link is no longer valid. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if both buyer and seller have signed
  const buyerSigned = !!instance.purchaser_signature_url;
  const sellerSigned = !!instance.seller_signature_url;
  const chairmanSigned = !!instance.chairman_signature_url;
  const canSign = buyerSigned && sellerSigned && !chairmanSigned;

  if (!buyerSigned || !sellerSigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Awaiting Signatures</h2>
            <p className="text-muted-foreground">
              The Buyer and Seller must both sign before you can sign as Chairman.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const template = instance.legal_templates as { name: string; body_text: string } | null;
  const fieldValues = instance.field_values_json as ChairmanFieldValues || {};
  const computedValues = instance.computed_values_json as ChairmanComputedValues || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-semibold">{template?.name || "Stock Purchase Agreement"}</h1>
                <p className="text-sm text-muted-foreground">
                  Chairman Signature - Agreed & Acknowledged
                </p>
              </div>
            </div>
            <Badge variant={chairmanSigned ? "default" : "secondary"}>
              {chairmanSigned && <CheckCircle className="h-3 w-3 mr-1" />}
              {chairmanSigned ? "Finalized" : "Awaiting Your Signature"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Preview */}
          <Card className="lg:sticky lg:top-6 lg:h-[calc(100vh-120px)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Agreement Preview</CardTitle>
              <CardDescription>Review the fully signed agreement</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              {template?.body_text && (
                <LegalDocPreview
                  bodyText={template.body_text}
                  fieldValues={fieldValues as any}
                  computedValues={computedValues as any}
                />
              )}
            </CardContent>
          </Card>

          {/* Signature Section */}
          <div className="space-y-6">
            {/* Existing Signatures */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signatures Collected</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seller Signature */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Seller Signature
                  </p>
                  <div className="border rounded-md p-3 bg-muted/30">
                    <img src={instance.seller_signature_url!} alt="Seller Signature" className="max-h-16 mx-auto" />
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Signed {new Date(instance.seller_signed_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Separator />
                {/* Purchaser Signature */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Purchaser Signature
                  </p>
                  <div className="border rounded-md p-3 bg-muted/30">
                    <img src={instance.purchaser_signature_url!} alt="Purchaser Signature" className="max-h-16 mx-auto" />
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Signed {new Date(instance.purchaser_signed_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chairman Signature */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Signature</CardTitle>
                <CardDescription>
                  Sign as {fieldValues.chairman_name || "Chairman"}, {fieldValues.chairman_title || "Chairman of the Board"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chairmanSigned ? (
                  <div className="border rounded-md p-3 bg-green-50 dark:bg-green-950/30">
                    <img src={instance.chairman_signature_url!} alt="Chairman Signature" className="max-h-20 mx-auto" />
                    <p className="text-xs text-center text-green-700 dark:text-green-300 mt-2">
                      Signed {new Date(instance.chairman_signed_at!).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <SignaturePad
                    title="Chairman Signature"
                    onSign={(sig) => signMutation.mutate(sig)}
                    disabled={signMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>

            {chairmanSigned && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Agreement Fully Executed</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    All three signatures have been collected. The agreement is now in effect.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}