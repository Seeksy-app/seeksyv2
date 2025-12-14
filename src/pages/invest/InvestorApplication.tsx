import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, CheckCircle, DollarSign, Hash, Lock, Shield, Clock, AlertTriangle } from "lucide-react";

interface InvestorSettings {
  name: string;
  price_per_share: number;
  price_per_share_tier2: number | null;
  tier2_start_date: string | null;
  allowed_emails: string[];
  is_active: boolean;
  minimum_investment: number;
  maximum_investment: number | null;
  confidentiality_notice: string;
}

export default function InvestorApplication() {
  const { slug } = useParams<{ slug?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [investmentMode, setInvestmentMode] = useState<"shares" | "amount">("shares");
  const [settings, setSettings] = useState<InvestorSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Email gating state
  const [emailVerified, setEmailVerified] = useState(false);
  const [gateEmail, setGateEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    numberOfShares: "",
    investmentAmount: "",
    investorCertification: "",
  });

  // Countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchSettings();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!settings?.tier2_start_date) return;
    
    const tier2Date = new Date(settings.tier2_start_date);
    const today = new Date();
    if (today >= tier2Date) return; // Already past tier 2 date
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = tier2Date.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings?.tier2_start_date]);

  const fetchSettings = async () => {
    try {
      let query = supabase
        .from("investor_application_settings")
        .select("*");
      
      if (slug) {
        query = query.eq("slug", slug);
      } else {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          name: data.name || "Investment Application",
          price_per_share: Number(data.price_per_share),
          price_per_share_tier2: data.price_per_share_tier2 ? Number(data.price_per_share_tier2) : null,
          tier2_start_date: data.tier2_start_date || null,
          allowed_emails: data.allowed_emails || [],
          is_active: data.is_active ?? true,
          confidentiality_notice: data.confidentiality_notice || "",
          minimum_investment: Number(data.minimum_investment) || 100,
          maximum_investment: data.maximum_investment ? Number(data.maximum_investment) : null,
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Determine active PPS based on tier date
  const getActivePricePerShare = () => {
    if (!settings) return 0.20;
    
    // If tier 2 date is set and we're past it, use tier 2 price
    if (settings.tier2_start_date && settings.price_per_share_tier2) {
      const tier2Date = new Date(settings.tier2_start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      tier2Date.setHours(0, 0, 0, 0);
      
      if (today >= tier2Date) {
        return settings.price_per_share_tier2;
      }
    }
    
    return settings.price_per_share;
  };
  
  const pricePerShare = getActivePricePerShare();

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

  const handleVerifyEmail = async () => {
    if (!gateEmail.trim() || !validateEmail(gateEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setVerifyingEmail(true);
    try {
      const normalizedEmail = gateEmail.trim().toLowerCase();
      const allowedEmails = (settings?.allowed_emails || []).map(e => e.toLowerCase());
      
      if (allowedEmails.length === 0 || allowedEmails.includes(normalizedEmail)) {
        // Log access
        await supabase.from("investor_application_access_logs").insert({
          email: normalizedEmail,
          user_agent: navigator.userAgent,
        });
        
        setEmailVerified(true);
        setFormData(prev => ({ ...prev, email: normalizedEmail }));
        toast.success("Email verified. Please continue with your application.");
      } else {
        toast.error("This email is not authorized to access this page.");
      }
    } catch (err) {
      console.error("Error verifying email:", err);
      toast.error("Failed to verify email");
    } finally {
      setVerifyingEmail(false);
    }
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
    const totalAmount = parseFloat(calculateTotal());
    if (shares <= 0) {
      toast.error("Please enter a valid investment amount or number of shares");
      return;
    }
    
    const minInvestment = settings?.minimum_investment || 100;
    if (totalAmount < minInvestment) {
      toast.error(`Minimum investment amount is $${minInvestment.toLocaleString()}`);
      return;
    }
    
    const maxInvestment = settings?.maximum_investment;
    if (maxInvestment && totalAmount > maxInvestment) {
      toast.error(`Maximum investment amount is $${maxInvestment.toLocaleString()} for this tier`);
      return;
    }

    setIsSubmitting(true);

    try {
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
          investorCertification: formData.investorCertification || "Individual with net worth or joint net worth with spouse exceeding $1 million",
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

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings?.is_active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Applications Closed</h2>
            <p className="text-muted-foreground">
              Investment applications are not currently being accepted. 
              Please check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Application Received</h2>
            <p className="text-muted-foreground">
              Thank you for your investment application. You will receive a confirmation email 
              with an e-signature document to sign within 24–48 hours.
            </p>
            <p className="text-sm text-muted-foreground">
              Check your email ({formData.email}) for next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email Gate Screen
  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Investment Application</CardTitle>
            <CardDescription>
              Please verify your email to access the investment application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Confidentiality Notice */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Confidentiality Notice</p>
              <p className="text-muted-foreground">
                {settings?.confidentiality_notice || 
                  "All information provided is strictly confidential and will only be used for the purpose of processing your investment application."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptDisclosure"
                  checked={acceptedDisclosure}
                  onChange={(e) => setAcceptedDisclosure(e.target.checked)}
                  className="mt-1"
                />
                <Label htmlFor="acceptDisclosure" className="text-sm cursor-pointer">
                  I acknowledge that all information I provide will be kept confidential 
                  and used solely for processing my investment application.
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateEmail">Your Email Address</Label>
                <Input
                  id="gateEmail"
                  type="email"
                  value={gateEmail}
                  onChange={(e) => setGateEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={!acceptedDisclosure}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyEmail}
                disabled={!acceptedDisclosure || verifyingEmail}
              >
                {verifyingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if we're still in tier 1 pricing
  const isTier1Active = () => {
    if (!settings?.tier2_start_date || !settings?.price_per_share_tier2) return true;
    const tier2Date = new Date(settings.tier2_start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tier2Date.setHours(0, 0, 0, 0);
    return today < tier2Date;
  };

  const showCountdown = isTier1Active() && settings?.tier2_start_date && settings?.price_per_share_tier2;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invest in Seeksy</CardTitle>
          <CardDescription>
            Complete the form below to apply for stock purchase. 
            You'll receive a formal agreement for e-signature after review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pricing Tiers Display with FOMO */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center gap-2 text-primary font-medium">
                <AlertTriangle className="h-4 w-4" />
                {settings?.price_per_share_tier2 && settings?.tier2_start_date 
                  ? "Limited Time Pricing" 
                  : "Investment Opportunity"}
              </div>
              
              {/* Investment Limits - FOMO Display */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-background rounded-lg border">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Minimum Investment</div>
                  <div className="text-xl font-bold text-green-600">
                    ${(settings?.minimum_investment || 100).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Maximum Investment</div>
                  <div className="text-xl font-bold text-amber-600">
                    {settings?.maximum_investment 
                      ? `$${settings.maximum_investment.toLocaleString()}`
                      : "No limit"}
                  </div>
                </div>
              </div>
              
              {settings?.price_per_share_tier2 && settings?.tier2_start_date && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-lg p-3 ${isTier1Active() ? 'bg-green-500/10 border-2 border-green-500' : 'bg-muted border border-muted'}`}>
                      <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                      <div className={`text-2xl font-bold ${isTier1Active() ? 'text-green-600' : 'text-muted-foreground line-through'}`}>
                        ${settings.price_per_share.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">per share</div>
                      {isTier1Active() && (
                        <Badge className="mt-2 bg-green-500">Active Now</Badge>
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${!isTier1Active() ? 'bg-amber-500/10 border-2 border-amber-500' : 'bg-muted border border-muted'}`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {isTier1Active() ? 'After ' + format(new Date(settings.tier2_start_date), 'MMM d') : 'Current Price'}
                      </div>
                      <div className={`text-2xl font-bold ${!isTier1Active() ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        ${settings.price_per_share_tier2.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">per share</div>
                      {!isTier1Active() && (
                        <Badge className="mt-2 bg-amber-500">Active Now</Badge>
                      )}
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  {showCountdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0) && (
                    <div className="text-center space-y-2">
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        Price increases in:
                      </div>
                      <div className="flex justify-center gap-2">
                        <div className="bg-background rounded-lg p-2 min-w-[60px] text-center border">
                          <div className="text-xl font-bold">{countdown.days}</div>
                          <div className="text-xs text-muted-foreground">days</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 min-w-[60px] text-center border">
                          <div className="text-xl font-bold">{countdown.hours}</div>
                          <div className="text-xs text-muted-foreground">hours</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 min-w-[60px] text-center border">
                          <div className="text-xl font-bold">{countdown.minutes}</div>
                          <div className="text-xs text-muted-foreground">min</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 min-w-[60px] text-center border">
                          <div className="text-xl font-bold">{countdown.seconds}</div>
                          <div className="text-xs text-muted-foreground">sec</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Single tier - show current price prominently */}
              {(!settings?.price_per_share_tier2 || !settings?.tier2_start_date) && (
                <div className="text-center p-3 bg-green-500/10 border-2 border-green-500 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Price Per Share</div>
                  <div className="text-3xl font-bold text-green-600">
                    ${pricePerShare.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

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
                  disabled
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

            <Separator />

            {/* Investor Certification */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Investor Certification</h3>
              <p className="text-xs text-muted-foreground">
                Please select the statement that applies to you as a sophisticated investor:
              </p>
              <RadioGroup
                value={formData.investorCertification}
                onValueChange={(v) => handleChange("investorCertification", v)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Individual with net worth or joint net worth with spouse exceeding $1 million" id="cert1" className="mt-0.5" />
                  <Label htmlFor="cert1" className="text-sm cursor-pointer">
                    Individual with net worth or joint net worth with spouse exceeding $1 million (excluding primary residence)
                  </Label>
                </div>
                <div className="flex items-start space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Individual with income exceeding $200,000 in each of the two most recent years" id="cert2" className="mt-0.5" />
                  <Label htmlFor="cert2" className="text-sm cursor-pointer">
                    Individual with income exceeding $200,000 in each of the two most recent years (or $300,000 combined income with spouse)
                  </Label>
                </div>
                <div className="flex items-start space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Director, executive officer, or general partner of the issuer" id="cert3" className="mt-0.5" />
                  <Label htmlFor="cert3" className="text-sm cursor-pointer">
                    Director, executive officer, or general partner of the issuer
                  </Label>
                </div>
                <div className="flex items-start space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Buyer is acquiring the Shares as a Sophisticated Investor in a private shareholder-to-shareholder transaction exempt under Section 4(a)(1) of the Securities Act of 1933" id="cert4" className="mt-0.5" />
                  <Label htmlFor="cert4" className="text-sm cursor-pointer">
                    Buyer is acquiring the Shares as a Sophisticated Investor in a private shareholder-to-shareholder transaction exempt under Section 4(a)(1) of the Securities Act of 1933
                  </Label>
                </div>
              </RadioGroup>
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