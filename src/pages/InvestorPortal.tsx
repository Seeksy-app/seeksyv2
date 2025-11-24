import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, FileSpreadsheet, TrendingUp } from "lucide-react";
import { ForecastTab } from "@/components/cfo/ForecastTab";
import { InteractiveSpreadsheet } from "@/components/cfo/InteractiveSpreadsheet";

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
          </TabsList>

          <TabsContent value="forecast">
            <ForecastTab isReadOnly={true} />
          </TabsContent>

          <TabsContent value="models">
            <InteractiveSpreadsheet />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}