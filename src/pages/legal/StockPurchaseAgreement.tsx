import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LegalDocPreview } from "@/components/legal/LegalDocPreview";
import { LegalDocForm } from "@/components/legal/LegalDocForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Json } from "@/integrations/supabase/types";
import { exportToDocx, exportToPdf } from "@/lib/legalExport";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-instance"] });
      toast({
        title: "Agreement Finalized",
        description: "The agreement has been finalized and locked.",
      });
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
    
    const exportData = {
      purchaserName: fieldValues.purchaser_name || 'Unknown',
      pricePerShare: computedValues.price_per_share || 0,
      numberOfShares: fieldValues.number_of_shares ?? computedValues.computed_number_of_shares ?? 0,
      purchaseAmount: fieldValues.purchase_amount ?? computedValues.computed_purchase_amount ?? 0,
      bodyText: template.body_text,
      instanceId: instanceId,
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

        {/* Right: Form */}
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
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
