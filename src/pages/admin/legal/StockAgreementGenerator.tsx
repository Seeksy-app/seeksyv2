import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";

export default function StockAgreementGenerator() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purchaserName: "",
    purchaserAddress: "",
    numberOfShares: "",
    pricePerShare: "0.20",
    agreementDate: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const shares = parseFloat(formData.numberOfShares) || 0;
    const price = parseFloat(formData.pricePerShare) || 0;
    return (shares * price).toFixed(2);
  };

  const handleGenerate = async () => {
    if (!formData.purchaserName || !formData.numberOfShares) {
      toast.error("Please fill in purchaser name and number of shares");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-stock-agreement-docx",
        {
          body: {
            purchaserName: formData.purchaserName,
            purchaserAddress: formData.purchaserAddress,
            numberOfShares: parseInt(formData.numberOfShares),
            pricePerShare: parseFloat(formData.pricePerShare),
            agreementDate: formData.agreementDate,
          },
        }
      );

      if (error) throw error;

      // Convert base64 to blob and download
      const byteCharacters = atob(data.document);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Stock_Purchase_Agreement_${formData.purchaserName.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document generated and downloaded!");
    } catch (err) {
      console.error("Error generating document:", err);
      toast.error("Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Stock Purchase Agreement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agreementDate">Agreement Date</Label>
            <Input
              id="agreementDate"
              value={formData.agreementDate}
              onChange={(e) => handleChange("agreementDate", e.target.value)}
              placeholder="January 1, 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaserName">Purchaser Name</Label>
            <Input
              id="purchaserName"
              value={formData.purchaserName}
              onChange={(e) => handleChange("purchaserName", e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaserAddress">Purchaser Address</Label>
            <Input
              id="purchaserAddress"
              value={formData.purchaserAddress}
              onChange={(e) => handleChange("purchaserAddress", e.target.value)}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfShares">Number of Shares</Label>
              <Input
                id="numberOfShares"
                type="number"
                value={formData.numberOfShares}
                onChange={(e) => handleChange("numberOfShares", e.target.value)}
                placeholder="100000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerShare">Price Per Share ($)</Label>
              <Input
                id="pricePerShare"
                type="number"
                step="0.01"
                value={formData.pricePerShare}
                onChange={(e) => handleChange("pricePerShare", e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Total Purchase Amount:{" "}
              <span className="font-semibold text-foreground">
                ${calculateTotal()}
              </span>
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Generate & Download DOCX
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
