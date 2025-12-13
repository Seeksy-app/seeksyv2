import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, DollarSign, Hash } from "lucide-react";

export default function InvestorApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [investmentMode, setInvestmentMode] = useState<"shares" | "amount">("shares");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    numberOfShares: "",
    investmentAmount: "",
  });

  // Default price per share (admin can configure later)
  const pricePerShare = 0.20;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    if (investmentMode === "shares") {
      const shares = parseFloat(formData.numberOfShares) || 0;
      return (shares * pricePerShare).toFixed(2);
    } else {
      return parseFloat(formData.investmentAmount).toFixed(2) || "0.00";
    }
  };

  const calculateShares = () => {
    if (investmentMode === "amount") {
      const amount = parseFloat(formData.investmentAmount) || 0;
      return Math.floor(amount / pricePerShare);
    } else {
      return parseInt(formData.numberOfShares) || 0;
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.street.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip.trim()) {
      toast.error("Please complete your full address");
      return;
    }
    
    const shares = calculateShares();
    if (shares <= 0) {
      toast.error("Please enter a valid investment amount or number of shares");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call edge function to submit investment application (bypasses RLS)
      const response = await supabase.functions.invoke("submit-investment-application", {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
          numberOfShares: shares,
          pricePerShare: pricePerShare,
          totalAmount: parseFloat(calculateTotal()),
          investmentMode,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to submit application");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Submission failed");
      }

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Application Received</h2>
            <p className="text-muted-foreground">
              Thank you for your interest in investing with Seeksy. Our team will review your 
              application and send you the stock purchase agreement for e-signature shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              Check your email ({formData.email}) for next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invest in Seeksy</CardTitle>
          <CardDescription>
            Complete the form below to apply for stock purchase. 
            You'll receive a formal agreement for e-signature after review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Investment Type Selection */}
            <div className="space-y-3">
              <Label>How would you like to invest?</Label>
              <RadioGroup
                value={investmentMode}
                onValueChange={(v) => setInvestmentMode(v as "shares" | "amount")}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="shares" id="shares" />
                  <Label htmlFor="shares" className="flex items-center gap-2 cursor-pointer">
                    <Hash className="h-4 w-4" />
                    Number of Shares
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="amount" id="amount" />
                  <Label htmlFor="amount" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4" />
                    Investment Amount
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Investment Input */}
            <div className="space-y-2">
              {investmentMode === "shares" ? (
                <>
                  <Label htmlFor="numberOfShares">Number of Shares *</Label>
                  <Input
                    id="numberOfShares"
                    type="number"
                    min="1"
                    value={formData.numberOfShares}
                    onChange={(e) => handleChange("numberOfShares", e.target.value)}
                    placeholder="e.g., 10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Price per share: ${pricePerShare.toFixed(2)}
                  </p>
                </>
              ) : (
                <>
                  <Label htmlFor="investmentAmount">Investment Amount (USD) *</Label>
                  <Input
                    id="investmentAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.investmentAmount}
                    onChange={(e) => handleChange("investmentAmount", e.target.value)}
                    placeholder="e.g., 2000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Price per share: ${pricePerShare.toFixed(2)} ({calculateShares()} shares)
                  </p>
                </>
              )}
            </div>

            {/* Total Display */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Shares:</span>
                <span className="font-medium">{calculateShares().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Total Investment:</span>
                <span className="font-semibold text-lg">${parseFloat(calculateTotal()).toLocaleString()}</span>
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Your Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Legal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  The stock purchase agreement will be sent to this email
                </p>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Mailing Address</h3>
              
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="w-1/2">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By submitting, you agree to receive the Stock Purchase Agreement 
              for review and e-signature. This is not a binding commitment until 
              you sign the formal agreement.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
