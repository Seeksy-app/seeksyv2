import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, FileSpreadsheet, TrendingUp, Settings, ShieldCheck } from "lucide-react";
import { ForecastTab } from "@/components/cfo/ForecastTab";
import { InteractiveSpreadsheet } from "@/components/cfo/InteractiveSpreadsheet";
import { CFOAIChat } from "@/components/cfo/CFOAIChat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InvestorPortal() {
  const [searchParams] = useSearchParams();
  const [accessCode, setAccessCode] = useState(searchParams.get("code") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [investorEmail, setInvestorEmail] = useState("");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [pendingAccessData, setPendingAccessData] = useState<any>(null);

  useEffect(() => {
    // Check if code is in URL and auto-validate
    const code = searchParams.get("code");
    if (code && code.length === 8) {
      setAccessCode(code);
      // Auto-validate when code is in URL
      validateAccessCodeFromURL(code);
    }
  }, [searchParams]);

  const validateAccessCodeFromURL = async (code: string) => {
    setLoading(true);
    try {
      console.log('Validating access code:', code.toUpperCase());
      
      const { data, error } = await supabase
        .from('investor_shares')
        .select('*')
        .eq('access_code', code.toUpperCase())
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        toast.error("Error validating access code");
        return;
      }

      if (!data) {
        toast.error("Invalid, expired, or revoked access code");
        return;
      }

      setPendingAccessData(data);
      setShowDisclosure(true);
    } catch (error: any) {
      console.error("Error validating access:", error);
      toast.error("Failed to validate access code");
    } finally {
      setLoading(false);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode) {
      toast.error("Please enter an access code");
      return;
    }

    setLoading(true);
    try {
      console.log('Validating access code:', accessCode.toUpperCase());
      
      const { data, error } = await supabase
        .from('investor_shares')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        toast.error("Error validating access code");
        return;
      }

      if (!data) {
        toast.error("Invalid, expired, or revoked access code");
        return;
      }

      setPendingAccessData(data);
      setShowDisclosure(true);
    } catch (error: any) {
      console.error("Error validating access:", error);
      toast.error("Failed to validate access code");
    } finally {
      setLoading(false);
    }
  };

  const acceptDisclosure = () => {
    if (pendingAccessData) {
      setInvestorEmail(pendingAccessData.investor_email);
      setIsAuthenticated(true);
      setShowDisclosure(false);
      toast.success("Access granted! Welcome to the financial portal.");
    }
  };

  const declineDisclosure = () => {
    setShowDisclosure(false);
    setPendingAccessData(null);
    toast.info("Access declined. You must accept the agreement to continue.");
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Seeksy Investor Portal</CardTitle>
              <CardDescription>
                Enter your access code to view financial forecasts and models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Access Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 8-character code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono text-lg text-center"
                />
              </div>
              <Button
                onClick={validateAccessCode}
                disabled={loading || accessCode.length !== 8}
                className="w-full"
              >
                {loading ? "Validating..." : "Access Portal"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                If you don't have an access code, please contact the Seeksy team
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Confidentiality Agreement Dialog */}
        <AlertDialog open={showDisclosure} onOpenChange={setShowDisclosure}>
          <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-2xl text-center">
                Confidentiality & Non-Disclosure Agreement
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-4 pt-4">
                <p className="text-base">
                  By accessing this financial information, you acknowledge and agree to the following terms:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">1. Confidential Information</h4>
                    <p className="text-sm">
                      All financial forecasts, models, assumptions, projections, and business information 
                      (collectively, "Confidential Information") shared through this portal are proprietary 
                      and confidential to Seeksy and its stakeholders.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-1">2. Non-Disclosure Obligation</h4>
                    <p className="text-sm">
                      You agree to maintain the confidentiality of all Confidential Information and not to 
                      disclose, share, distribute, or make available such information to any third party 
                      without prior written consent from Seeksy.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-1">3. Limited Use</h4>
                    <p className="text-sm">
                      The Confidential Information is provided solely for your evaluation purposes as a 
                      potential or current investor. You may not use this information for any other purpose, 
                      including competitive analysis or business development.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-1">4. No Guarantees</h4>
                    <p className="text-sm">
                      All projections and forecasts are based on assumptions and estimates. Actual results 
                      may differ materially. This information does not constitute investment advice or a 
                      recommendation to invest.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-1">5. Read-Only Access</h4>
                    <p className="text-sm">
                      Your access is read-only and for viewing purposes only. You may not download, copy, 
                      reproduce, or create derivative works from the Confidential Information without 
                      express written permission.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-1">6. Access Termination</h4>
                    <p className="text-sm">
                      Seeksy reserves the right to revoke your access at any time. Upon termination or 
                      expiration of access, you agree to cease all use of the Confidential Information.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-foreground">
                    By clicking "I Accept" below, you confirm that you have read, understood, and agree 
                    to be bound by these terms and will maintain the confidentiality of all information 
                    accessed through this portal.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={declineDisclosure}>
                Decline
              </AlertDialogCancel>
              <AlertDialogAction onClick={acceptDisclosure}>
                I Accept
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Seeksy Financial Portal</h1>
              <p className="text-sm text-muted-foreground">Read-only access for {investorEmail}</p>
            </div>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="forecast" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12 bg-accent/50">
            <TabsTrigger value="forecast" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-5 w-5 mr-2" />
              3-Year Forecast
            </TabsTrigger>
            <TabsTrigger value="models" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Financial Models
            </TabsTrigger>
            <TabsTrigger value="assumptions" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-5 w-5 mr-2" />
              Assumptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ForecastTab isReadOnly={true} />
              </div>
              <div className="flex flex-col">
                <CFOAIChat />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveSpreadsheet />
              </div>
              <div className="flex flex-col">
                <CFOAIChat />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assumptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Model Assumptions</CardTitle>
                <CardDescription>
                  Key assumptions driving the 3-year financial projections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Subscription Pricing */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Subscription Pricing</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Podcaster Basic</p>
                      <p className="text-2xl font-bold">$19<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Podcaster Pro</p>
                      <p className="text-2xl font-bold">$49<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Enterprise</p>
                      <p className="text-2xl font-bold">$199<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">My Page Basic</p>
                      <p className="text-2xl font-bold">$9<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">My Page Pro</p>
                      <p className="text-2xl font-bold">$29<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Event Creator</p>
                      <p className="text-2xl font-bold">$29<span className="text-sm font-normal">/mo</span></p>
                    </div>
                  </div>
                </div>

                {/* Growth & Users */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Growth & Customer Acquisition</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Starting Users</p>
                      <p className="text-2xl font-bold">20</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Monthly Growth</p>
                      <p className="text-2xl font-bold">25<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Monthly Churn</p>
                      <p className="text-2xl font-bold">5<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Customer CAC</p>
                      <p className="text-2xl font-bold">$45</p>
                    </div>
                  </div>
                </div>

                {/* Ad Revenue */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Ad Revenue Model</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Average CPM</p>
                      <p className="text-2xl font-bold">$25</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Ad Fill Rate</p>
                      <p className="text-2xl font-bold">80<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Platform Share</p>
                      <p className="text-2xl font-bold">30<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Episodes/Mo</p>
                      <p className="text-2xl font-bold">4</p>
                    </div>
                  </div>
                </div>

                {/* Cost Structure */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Cost Structure</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">AI Compute</p>
                      <p className="text-2xl font-bold">$2.50<span className="text-sm font-normal">/user</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Storage</p>
                      <p className="text-2xl font-bold">$0.023<span className="text-sm font-normal">/GB</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Bandwidth</p>
                      <p className="text-2xl font-bold">$0.05<span className="text-sm font-normal">/GB</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Streaming</p>
                      <p className="text-2xl font-bold">$0.15<span className="text-sm font-normal">/hr</span></p>
                    </div>
                  </div>
                </div>

                {/* Tier Distribution */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Customer Tier Distribution</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Podcaster Basic</p>
                      <p className="text-2xl font-bold">40<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Podcaster Pro</p>
                      <p className="text-2xl font-bold">45<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Enterprise</p>
                      <p className="text-2xl font-bold">15<span className="text-sm font-normal">%</span></p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> These assumptions are configured by the Seeksy CFO team and drive all financial projections. 
                    The Custom 3-Year Pro Forma model uses these values to calculate monthly and annual forecasts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-6">
          <p>For questions or additional information, please contact <a href="mailto:Hello@Seeksy.io" className="text-primary hover:underline font-medium">Hello@Seeksy.io</a></p>
        </div>
      </div>
    </div>
  );
}
