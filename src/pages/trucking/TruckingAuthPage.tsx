import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Shield, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InviteData {
  id: string;
  email: string;
  role: string;
  agency_id: string;
  status: string;
}

export default function TruckingAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const isSignupRoute = location.pathname.includes("/signup");
  const defaultTab = inviteToken || isSignupRoute ? "signup" : (searchParams.get("tab") || "login");
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    email: "",
    password: "",
  });

  // Validate invite token on mount
  useEffect(() => {
    if (inviteToken) {
      validateInvite(inviteToken);
    }
  }, [inviteToken]);

  const validateInvite = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('trucking_user_invites')
        .select('id, email, role, agency_id, status, expires_at')
        .eq('invite_token', token)
        .maybeSingle();

      if (error || !data) {
        toast({ title: "Invalid invite link", variant: "destructive" });
        setInviteLoading(false);
        return;
      }

      if (data.status !== 'pending') {
        toast({ title: "This invite has already been used or revoked", variant: "destructive" });
        setInviteLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast({ title: "This invite has expired", variant: "destructive" });
        setInviteLoading(false);
        return;
      }

      setInviteData(data);
      setFormData(prev => ({ ...prev, email: data.email }));
      setInviteLoading(false);
    } catch (err) {
      console.error('Error validating invite:', err);
      setInviteLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      toast({ title: "Welcome back!" });
      navigate("/trucking/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            company_name: formData.company_name || "D & L Logistics",
          },
        },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;

      // If this is an invite signup, create the admin user entry
      if (inviteData && userId) {
        // Create trucking_admin_users entry with the invited role
        const { error: adminError } = await supabase
          .from('trucking_admin_users')
          .insert({
            user_id: userId,
            email: formData.email,
            full_name: formData.full_name,
            agency_id: inviteData.agency_id,
            role: inviteData.role,
            is_active: true,
          });

        if (adminError) {
          console.error('Error creating admin user:', adminError);
          // Don't throw - user is created, just admin entry failed
        }

        // Mark invite as accepted
        await supabase
          .from('trucking_user_invites')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', inviteData.id);

        toast({ title: "Account created!", description: `Welcome to D & L Logistics as ${inviteData.role}.` });
      } else {
        toast({ title: "Account created!", description: "You can now sign in." });
      }

      navigate("/trucking/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F8FB' }}>
        <Card className="w-full max-w-[420px] shadow-xl border-0">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Validating invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F8FB' }}>
      <Card className="w-full max-w-[420px] shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FF9F1C' }}>
            <Truck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: '#1D3557' }}>AITrucking</CardTitle>
          <CardDescription>D & L Logistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={loading}
                style={{ backgroundColor: '#FF9F1C' }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {inviteData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">You've been invited!</p>
                    <p className="text-green-700">Role: <span className="capitalize font-medium">{inviteData.role}</span></p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name *</Label>
                <Input
                  id="signup-name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-company">Company</Label>
                <Input
                  id="signup-company"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="D & L Logistics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  disabled={!!inviteData}
                  className={inviteData ? "bg-muted" : ""}
                />
                {inviteData && (
                  <p className="text-xs text-muted-foreground">Email is pre-filled from your invite</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password *</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSignup}
                disabled={loading}
                style={{ backgroundColor: '#FF9F1C' }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <p>Your loads, calls, and carrier info stay private. You're in control of every booking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
