import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TemplateInfo {
  name: string;
  size: number;
  updated_at: string;
}

export default function TemplateUpload() {
  const [uploading, setUploading] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplateInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("legal-templates")
        .list("", { limit: 10 });

      if (error) throw error;

      const template = data?.find(f => f.name === "stock-purchase-agreement.docx");
      if (template) {
        setTemplateInfo({
          name: template.name,
          size: template.metadata?.size || 0,
          updated_at: template.updated_at || template.created_at || "",
        });
      }
    } catch (err) {
      console.error("Error fetching template info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplateInfo();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }

    setUploading(true);
    try {
      // Upload to storage (overwrite if exists)
      const { error } = await supabase.storage
        .from("legal-templates")
        .upload("stock-purchase-agreement.docx", file, {
          upsert: true,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

      if (error) throw error;

      toast.success("Template uploaded successfully");
      await fetchTemplateInfo();
    } catch (err: any) {
      console.error("Error uploading template:", err);
      toast.error(err.message || "Failed to upload template");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Stock Purchase Agreement Template
        </CardTitle>
        <CardDescription>
          Upload your Word template with placeholders for dynamic content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Template Placeholders</AlertTitle>
          <AlertDescription>
            Use these placeholders in your Word document (with square brackets):
            <ul className="mt-2 space-y-1 text-sm">
              <li><code className="bg-muted px-1 rounded">[PURCHASER_NAME]</code> - Investor's full name</li>
              <li><code className="bg-muted px-1 rounded">[PURCHASER_ADDRESS]</code> - Full address</li>
              <li><code className="bg-muted px-1 rounded">[NUMBER_OF_SHARES]</code> - Number of shares</li>
              <li><code className="bg-muted px-1 rounded">[PRICE_PER_SHARE]</code> - Price per share</li>
              <li><code className="bg-muted px-1 rounded">[PURCHASE_AMOUNT]</code> - Total investment amount</li>
              <li><code className="bg-muted px-1 rounded">[AGREEMENT_DATE]</code> - Date of agreement</li>
            </ul>
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking for existing template...
          </div>
        ) : templateInfo ? (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{templateInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {templateInfo.updated_at && 
                    `Updated ${format(new Date(templateInfo.updated_at), "MMM d, yyyy 'at' h:mm a")}`
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">No template uploaded</p>
                <p className="text-sm text-muted-foreground">
                  Upload your Word template to generate agreements
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleUpload}
          className="hidden"
        />

        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {templateInfo ? "Upload New Template" : "Upload Template"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
