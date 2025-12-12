import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LegalDocPreview } from "@/components/legal/LegalDocPreview";
import { LegalDocForm } from "@/components/legal/LegalDocForm";
import { SignaturePad } from "@/components/legal/SignaturePad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface FieldValues {
  purchaser_name?: string;
  purchaser_email?: string;
  purchaser_street?: string;
  purchaser_city?: string;
  purchaser_state?: string;
  purchaser_zip?: string;
  seller_name?: string;
  seller_email?: string;
  seller_street?: string;
  seller_city?: string;
  seller_state?: string;
  seller_zip?: string;
  input_mode?: "amount" | "shares";
  purchase_amount?: number;
  number_of_shares?: number;
  // Investor certification fields
  is_sophisticated_investor?: boolean;
  accredited_net_worth?: boolean;
  accredited_income?: boolean;
  accredited_director?: boolean;
  accredited_other?: boolean;
  accredited_other_text?: string;
}

interface ComputedValues {
  price_per_share?: number;
  rounding_mode?: "whole_share" | "two_decimals";
  computed_purchase_amount?: number;
  computed_number_of_shares?: number;
}

export default function PurchaserAgreementPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [computedValues, setComputedValues] = useState<ComputedValues>({});

  // Fetch instance by token
  const { data: instance, isLoading, error } = useQuery({
    queryKey: ["legal-instance-purchaser", token],
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

  // Initialize field values from instance
  useEffect(() => {
    if (instance) {
      const fv = instance.field_values_json as FieldValues || {};
      const cv = instance.computed_values_json as ComputedValues || {};
      setFieldValues(fv);
      setComputedValues(cv);
    }
  }, [instance]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { fieldValues: FieldValues; computedValues: ComputedValues }) => {
      const { error } = await supabase
        .from("legal_doc_instances")
        .update({
          field_values_json: JSON.parse(JSON.stringify(data.fieldValues)),
          computed_values_json: JSON.parse(JSON.stringify(data.computedValues)),
        })
        .eq("id", instance?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance-purchaser", token] });
      toast.success("Progress saved");
    },
    onError: () => {
      toast.error("Failed to save");
    }
  });

  // Submit for review mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("legal_doc_instances")
        .update({
          field_values_json: JSON.parse(JSON.stringify(fieldValues)),
          computed_values_json: JSON.parse(JSON.stringify(computedValues)),
          status: "admin_review",
        })
        .eq("id", instance?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance-purchaser", token] });
      toast.success("Agreement submitted for review");
    },
    onError: () => {
      toast.error("Failed to submit");
    }
  });

  // Signature mutation
  const signMutation = useMutation({
    mutationFn: async (signatureUrl: string) => {
      const { error } = await supabase
        .from("legal_doc_instances")
        .update({
          purchaser_signature_url: signatureUrl,
          purchaser_signed_at: new Date().toISOString(),
          status: instance?.seller_signature_url ? "finalized" : "purchaser_signed",
        })
        .eq("id", instance?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance-purchaser", token] });
      toast.success("Signature saved");
    },
    onError: () => {
      toast.error("Failed to save signature");
    }
  });

  const handleFieldChange = (field: keyof FieldValues, value: any) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const handleComputedChange = (field: keyof ComputedValues, value: any) => {
    setComputedValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    saveMutation.mutate({ fieldValues, computedValues });
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const handleSign = (signatureDataUrl: string) => {
    signMutation.mutate(signatureDataUrl);
  };

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
              This agreement link is no longer valid. Please contact the sender for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const template = instance.legal_templates as { name: string; body_text: string } | null;
  const isFinalized = instance.status === "finalized";
  const isPurchaserSigned = !!instance.purchaser_signature_url;
  const isSellerSigned = !!instance.seller_signature_url;
  const canSign = instance.status === "purchaser_signed" || (isSellerSigned && !isPurchaserSigned);
  const canEdit = instance.status === "submitted" && !isPurchaserSigned;

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
                  Review and sign your agreement
                </p>
              </div>
            </div>
            <Badge variant={isFinalized ? "default" : "secondary"}>
              {isFinalized && <CheckCircle className="h-3 w-3 mr-1" />}
              {instance.status.replace("_", " ")}
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
              <CardDescription>Review the agreement terms</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              {template?.body_text && (
                <LegalDocPreview
                  bodyText={template.body_text}
                  fieldValues={fieldValues}
                  computedValues={computedValues}
                />
              )}
            </CardContent>
          </Card>

          {/* Form / Signature */}
          <div className="space-y-6">
            {!isFinalized && canEdit && (
              <LegalDocForm
                fieldValues={fieldValues}
                computedValues={computedValues}
                isAdmin={false}
                status={instance.status}
                onFieldChange={handleFieldChange}
                onComputedChange={handleComputedChange}
                onSaveDraft={handleSaveDraft}
                onSubmitForReview={handleSubmit}
                isSaving={saveMutation.isPending || submitMutation.isPending}
              />
            )}

            {/* Signature Section */}
            {(instance.status === "admin_review" || isSellerSigned || isPurchaserSigned || isFinalized) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Signatures</CardTitle>
                  <CardDescription>
                    {isFinalized 
                      ? "This agreement has been fully executed"
                      : "Sign below to complete the agreement"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seller Signature */}
                  <div>
                    <p className="text-sm font-medium mb-2">Seller Signature</p>
                    {isSellerSigned ? (
                      <div className="border rounded-md p-3 bg-muted/30">
                        <img 
                          src={instance.seller_signature_url!} 
                          alt="Seller Signature" 
                          className="max-h-20 mx-auto"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Signed {new Date(instance.seller_signed_at!).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                        Awaiting seller signature
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Purchaser Signature */}
                  <div>
                    <p className="text-sm font-medium mb-2">Purchaser Signature</p>
                    {isPurchaserSigned ? (
                      <div className="border rounded-md p-3 bg-muted/30">
                        <img 
                          src={instance.purchaser_signature_url!} 
                          alt="Purchaser Signature" 
                          className="max-h-20 mx-auto"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Signed {new Date(instance.purchaser_signed_at!).toLocaleDateString()}
                        </p>
                      </div>
                    ) : isSellerSigned ? (
                      <SignaturePad
                        title="Your Signature"
                        onSign={handleSign}
                        disabled={signMutation.isPending}
                      />
                    ) : (
                      <div className="border rounded-md p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                        Waiting for seller to sign first
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {isFinalized && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Agreement Finalized</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    This agreement has been signed by all parties and is now in effect.
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