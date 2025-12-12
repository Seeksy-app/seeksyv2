import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LegalDocPreview } from "@/components/legal/LegalDocPreview";
import { LegalDocForm } from "@/components/legal/LegalDocForm";
import { SignaturePad } from "@/components/legal/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, FileDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Json } from "@/integrations/supabase/types";
import { exportToDocx, exportToPdf } from "@/lib/legalExport";
import { sendLegalAgreementEmail } from "@/lib/legal/emails";


interface FieldValues {
  purchaser_name?: string;
  input_mode?: "amount" | "shares";
  purchase_amount?: number;
  number_of_shares?: number;
  [key: string]: any;
}

interface ComputedValues {
  price_per_share?: number;
  rounding_mode?: "whole_share" | "two_decimals";
  min_investment_amount?: number;
  min_shares?: number;
  computed_purchase_amount?: number;
  computed_number_of_shares?: number;
  [key: string]: any;
}

export default function StockPurchaseAgreement() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [fieldValues, setFieldValues] = useState<FieldValues>({
    input_mode: "amount",
  });
  const [computedValues, setComputedValues] = useState<ComputedValues>({
    rounding_mode: "whole_share",
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        setIsAdmin(roles?.some(r => r.role === "admin" || r.role === "super_admin") || false);
      }
    };
    checkAdmin();
  }, []);

  // Fetch template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["legal-template", "common-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_templates")
        .select("*")
        .eq("name", "Common Stock Purchase Agreement")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch instance if editing
  const { data: instance, isLoading: instanceLoading } = useQuery({
    queryKey: ["legal-instance", instanceId],
    queryFn: async () => {
      if (!instanceId || instanceId === "new") return null;
      
      const { data, error } = await supabase
        .from("legal_doc_instances")
        .select("*")
        .eq("id", instanceId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!instanceId && instanceId !== "new",
  });

  // Load instance data
  useEffect(() => {
    if (instance) {
      const fv = instance.field_values_json as FieldValues || {};
      const cv = instance.computed_values_json as ComputedValues || {};
      setFieldValues({
        input_mode: "amount",
        ...fv,
      });
      setComputedValues({
        rounding_mode: "whole_share",
        ...cv,
      });
    }
  }, [instance]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { status?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        template_id: template?.id,
        purchaser_user_id: user.id,
        purchaser_email: user.email,
        field_values_json: fieldValues,
        computed_values_json: computedValues,
        status: data.status || "draft",
      };

      if (instanceId && instanceId !== "new") {
        const { data: result, error } = await supabase
          .from("legal_doc_instances")
          .update(payload)
          .eq("id", instanceId)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from("legal_doc_instances")
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance"] });
      toast({
        title: variables.status === "submitted" ? "Submitted for Review" : "Saved",
        description: variables.status === "submitted" 
          ? "Your agreement has been submitted for admin review."
          : "Your draft has been saved.",
      });
      
      if (!instanceId || instanceId === "new") {
        navigate(`/legal/stock-purchase/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!instanceId) throw new Error("No instance to finalize");
      
      const { data, error } = await supabase
        .from("legal_doc_instances")
        .update({
          status: "finalized",
          field_values_json: fieldValues,
          computed_values_json: computedValues,
        })
        .eq("id", instanceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance"] });
      
      // Send emails to purchaser and chairman
      const purchaserEmail = fieldValues.purchaser_email || data.purchaser_email;
      const chairmanEmail = fieldValues.chairman_email;
      const purchaserLink = data.invite_token ? `${window.location.origin}/legal/purchaser/${data.invite_token}` : undefined;
      const chairmanLink = data.invite_token ? `${window.location.origin}/legal/chairman/${data.invite_token}` : undefined;
      
      if (purchaserEmail || chairmanEmail) {
        await sendLegalAgreementEmail({
          type: "finalize",
          purchaserEmail: purchaserEmail || "",
          purchaserName: fieldValues.purchaser_name,
          sellerName: fieldValues.seller_name,
          chairmanEmail: chairmanEmail,
          chairmanName: fieldValues.chairman_name,
          purchaserLink,
          chairmanLink,
          numberOfShares: fieldValues.number_of_shares,
          purchaseAmount: fieldValues.purchase_amount,
          pricePerShare: computedValues.price_per_share,
        });
      }
      
      toast({
        title: "Agreement Finalized",
        description: "The agreement has been finalized. Emails sent to signers.",
      });
    },
  });

  // Seller signature mutation
  const signMutation = useMutation({
    mutationFn: async (signatureUrl: string) => {
      if (!instanceId) throw new Error("No instance");
      
      const { error } = await supabase
        .from("legal_doc_instances")
        .update({
          seller_signature_url: signatureUrl,
          seller_signed_at: new Date().toISOString(),
        })
        .eq("id", instanceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance"] });
      toast({ title: "Seller signature saved" });
    },
  });

  const handleFieldChange = (field: keyof FieldValues, value: any) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const handleComputedChange = (field: keyof ComputedValues, value: any) => {
    setComputedValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    saveMutation.mutate({ status: "draft" });
  };

  const handleSubmitForReview = () => {
    saveMutation.mutate({ status: "submitted" });
  };

  const handleFinalize = () => {
    finalizeMutation.mutate();
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!template || !instanceId) return;
    
    // Format addresses
    const formatAddress = (street?: string, city?: string, state?: string, zip?: string) => {
      const parts = [];
      if (street) parts.push(street);
      if (city || state || zip) {
        const cityStateZip = [city, state].filter(Boolean).join(", ") + (zip ? " " + zip : "");
        if (cityStateZip.trim()) parts.push(cityStateZip.trim());
      }
      return parts.join(", ");
    };
    
    const exportData = {
      purchaserName: fieldValues.purchaser_name || 'Unknown',
      purchaserEmail: fieldValues.purchaser_email || '',
      purchaserAddress: formatAddress(fieldValues.purchaser_street, fieldValues.purchaser_city, fieldValues.purchaser_state, fieldValues.purchaser_zip),
      sellerName: fieldValues.seller_name || 'Andrew Appleton',
      sellerEmail: fieldValues.seller_email || 'appletonab@gmail.com',
      sellerAddress: formatAddress(fieldValues.seller_street, fieldValues.seller_city, fieldValues.seller_state, fieldValues.seller_zip) || '413 Independence Ave SE, Washington DC 20003',
      pricePerShare: computedValues.price_per_share || 0,
      numberOfShares: fieldValues.number_of_shares ?? computedValues.computed_number_of_shares ?? 0,
      purchaseAmount: fieldValues.purchase_amount ?? computedValues.computed_purchase_amount ?? 0,
      bodyText: template.body_text,
      instanceId: instanceId,
      // Certification fields
      isSophisticatedInvestor: fieldValues.is_sophisticated_investor,
      accreditedNetWorth: fieldValues.accredited_net_worth,
      accreditedIncome: fieldValues.accredited_income,
      accreditedDirector: fieldValues.accredited_director,
      accreditedOther: fieldValues.accredited_other,
      accreditedOtherText: fieldValues.accredited_other_text,
    };
    
    try {
      if (format === 'pdf') {
        await exportToPdf(exportData);
      } else {
        await exportToDocx(exportData);
      }
      toast({ title: `Exported as ${format.toUpperCase()}` });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (templateLoading || instanceLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Template not found</p>
      </div>
    );
  }

  const status = instance?.status || "draft";
  const canExport = status === "finalized" || (isAdmin && (status === "submitted" || status === "admin_review"));

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Common Stock Purchase Agreement</h1>
          <p className="text-sm text-muted-foreground">
            {instanceId === "new" ? "New Agreement" : `Instance: ${instanceId?.slice(0, 8)}...`}
          </p>
        </div>
        {canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Two-Panel Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Document Preview */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col">
            <div className="border-b px-4 py-2 bg-muted/50">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Agreement Preview
              </h2>
            </div>
            <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-950">
              <LegalDocPreview
                bodyText={template.body_text}
                fieldValues={fieldValues}
                computedValues={computedValues}
                highlightPlaceholders={true}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Form + Signatures */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-y-auto bg-muted/30">
            <LegalDocForm
              fieldValues={fieldValues}
              computedValues={computedValues}
              isAdmin={isAdmin}
              status={status}
              onFieldChange={handleFieldChange}
              onComputedChange={handleComputedChange}
              onSaveDraft={handleSaveDraft}
              onSubmitForReview={handleSubmitForReview}
              onFinalize={isAdmin ? handleFinalize : undefined}
              onExport={handleExport}
              isSaving={saveMutation.isPending || finalizeMutation.isPending}
            />
            
            {/* Signature Section for Admin */}
            {isAdmin && instance && (status === "admin_review" || status === "submitted" || instance.seller_signature_url) && (
              <div className="p-6 border-t">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Signatures</CardTitle>
                    <CardDescription>
                      {instance.seller_signature_url && instance.purchaser_signature_url && instance.chairman_signature_url
                        ? "All signatures collected - Agreement fully executed"
                        : "Sign the agreement as seller"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Seller Signature */}
                    <div>
                      <p className="text-sm font-medium mb-2">1. Seller Signature</p>
                      {instance.seller_signature_url ? (
                        <div className="border rounded-md p-3 bg-muted/30">
                          <img src={instance.seller_signature_url} alt="Seller Signature" className="max-h-20 mx-auto" />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Signed {new Date(instance.seller_signed_at!).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <SignaturePad
                          title="Your Signature (Seller)"
                          onSign={(sig) => signMutation.mutate(sig)}
                        />
                      )}
                    </div>
                    <Separator />
                    {/* Purchaser Signature */}
                    <div>
                      <p className="text-sm font-medium mb-2">2. Purchaser Signature (Buyer)</p>
                      {instance.purchaser_signature_url ? (
                        <div className="border rounded-md p-3 bg-muted/30">
                          <img src={instance.purchaser_signature_url} alt="Purchaser Signature" className="max-h-20 mx-auto" />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Signed {new Date(instance.purchaser_signed_at!).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                          Awaiting purchaser signature via invite link
                        </div>
                      )}
                    </div>
                    <Separator />
                    {/* Chairman Signature - Only shows when both B/S have signed */}
                    <div>
                      <p className="text-sm font-medium mb-2">3. Chairman Signature (Agreed & Acknowledged)</p>
                      {instance.chairman_signature_url ? (
                        <div className="border rounded-md p-3 bg-muted/30">
                          <img src={instance.chairman_signature_url} alt="Chairman Signature" className="max-h-20 mx-auto" />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Signed {new Date(instance.chairman_signed_at!).toLocaleDateString()}
                          </p>
                        </div>
                      ) : instance.seller_signature_url && instance.purchaser_signature_url ? (
                        <div className="space-y-2">
                          <div className="border rounded-md p-4 bg-amber-50 dark:bg-amber-950/30 text-center">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              Ready for Chairman signature
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {fieldValues.chairman_name ? `${fieldValues.chairman_name} (${fieldValues.chairman_email || 'no email'})` : 'No chairman configured'}
                            </p>
                          </div>
                          {fieldValues.chairman_email && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                const chairmanLink = `${window.location.origin}/legal/chairman/${instance.invite_token}`;
                                navigator.clipboard.writeText(chairmanLink);
                                toast({ title: "Chairman link copied" });
                              }}
                            >
                              Copy Chairman Signature Link
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                          Awaiting Buyer & Seller signatures first
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
