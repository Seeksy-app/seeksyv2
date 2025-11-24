import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, FileSpreadsheet, TrendingUp, Settings } from "lucide-react";
import { ForecastTab } from "@/components/cfo/ForecastTab";
import { InteractiveSpreadsheet } from "@/components/cfo/InteractiveSpreadsheet";
import { CFOAIChat } from "@/components/cfo/CFOAIChat";

export default function InvestorPortal() {
  const [searchParams] = useSearchParams();
  const [accessCode, setAccessCode] = useState(searchParams.get("code") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [investorEmail, setInvestorEmail] = useState("");

  useEffect(() => {
    // Check if code is in URL and auto-validate
    const code = searchParams.get("code");
    if (code) {
      setAccessCode(code);
    }
  }, [searchParams]);

  const validateAccessCode = async () => {
    if (!accessCode) {
      toast.error("Please enter an access code");
      return;
    }

    setLoading(true);
    try {
      // Validate access code
      const { data, error } = await supabase
        .from('investor_access')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast.error("Invalid or expired access code");
        return;
      }

      // Update access tracking
      await supabase
        .from('investor_access')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (data.access_count || 0) + 1,
        })
        .eq('id', data.id);

      setInvestorEmail(data.email);
      setIsAuthenticated(true);
      toast.success("Access granted! Welcome to the financial portal.");
    } catch (error: any) {
      console.error("Error validating access:", error);
      toast.error("Failed to validate access code");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
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
        <Tabs defaultValue="forecast" className="space-y-6">
          <TabsList>
            <TabsTrigger value="forecast">
              <TrendingUp className="h-4 w-4 mr-2" />
              3-Year Forecast
            </TabsTrigger>
            <TabsTrigger value="models">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Financial Models
            </TabsTrigger>
            <TabsTrigger value="assumptions">
              <Settings className="h-4 w-4 mr-2" />
              Assumptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-6">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Data Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This forecast is based on <strong>custom assumptions</strong> configured by the CFO team. 
                  These projections reflect Seeksy's specific growth strategy, pricing models, and cost structures.
                </p>
              </CardContent>
            </Card>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ForecastTab isReadOnly={true} />
              </div>
              <div>
                <CFOAIChat />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveSpreadsheet />
              </div>
              <div>
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
      </div>
    </div>
  );
}
