import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, AlertTriangle, BarChart3, Target, TrendingUp, Video, FileText, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { MarketOverviewTab } from '@/components/board/gtm/MarketOverviewTab';
import { GTMStrategyTab } from '@/components/board/gtm/GTMStrategyTab';
import { KeyMetricsTab } from '@/components/board/gtm/KeyMetricsTab';

interface InvestorLink {
  id: string;
  token: string;
  passcode: string;
  investor_name: string | null;
  data_mode: string;
  scope: string[];
  allow_ai: boolean;
  status: string;
  expires_at: string | null;
}

export default function InvestorPortal() {
  const { token } = useParams<{ token: string }>();
  const [linkData, setLinkData] = useState<InvestorLink | null>(null);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkData();
  }, [token]);

  const fetchLinkData = async () => {
    if (!token) {
      setError('Invalid link');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('investor_links')
        .select('*')
        .eq('token', token)
        .single();

      if (fetchError || !data) {
        setError('This investor link is no longer active. Please contact your Seeksy board contact for an updated link.');
        setIsLoading(false);
        return;
      }

      if (data.status === 'revoked') {
        setError('This investor link has been revoked. Please contact your Seeksy board contact for an updated link.');
        setIsLoading(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This investor link has expired. Please contact your Seeksy board contact for an updated link.');
        setIsLoading(false);
        return;
      }

      setLinkData(data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load investor view');
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!linkData) return;

    if (passcode !== linkData.passcode) {
      toast.error('Invalid access code');
      return;
    }

    // Log activity
    await supabase.from('investor_link_activity').insert({
      link_id: linkData.id,
      event_type: 'authenticated',
    });

    // Update view count
    await supabase
      .from('investor_links')
      .update({ 
        last_viewed_at: new Date().toISOString(),
        total_views: (linkData as any).total_views + 1 
      })
      .eq('id', linkData.id);

    setIsAuthenticated(true);
    toast.success('Access granted');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Link Unavailable</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Seeksy Investor View</CardTitle>
            <p className="text-slate-500 text-sm mt-2">
              Enter the access code provided by your Seeksy board contact
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Input
                type="text"
                placeholder="Enter 6-digit access code"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>
            <Button className="w-full" onClick={handleAuthenticate} disabled={passcode.length !== 6}>
              <Lock className="w-4 h-4 mr-2" />
              Access Investor View
            </Button>
            <p className="text-xs text-slate-400 text-center">
              This is a secure, time-limited view of Seeksy's business metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated view
  const scopeIcons: Record<string, React.ElementType> = {
    dashboard: LayoutDashboard,
    'business-model': BarChart3,
    gtm: Target,
    forecasts: TrendingUp,
    videos: Video,
    documents: FileText,
  };

  const availableTabs = linkData?.scope || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner */}
      <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm">
        <Shield className="w-4 h-4 inline-block mr-2" />
        You're viewing a secure investor snapshot of Seeksy. Metrics and projections are for evaluation purposes only.
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Seeksy Investor View</h1>
              <p className="text-xs text-slate-500">
                {linkData?.data_mode === 'demo' ? 'Demo Data' : 'Live Data'} • Read-only access
              </p>
            </div>
          </div>
          {linkData?.investor_name && (
            <span className="text-sm text-slate-500">Welcome, {linkData.investor_name}</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue={availableTabs[0]} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
            {availableTabs.includes('dashboard') && (
              <TabsTrigger value="dashboard" className="rounded-lg">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
            )}
            {availableTabs.includes('gtm') && (
              <TabsTrigger value="gtm" className="rounded-lg">
                <Target className="w-4 h-4 mr-2" />
                GTM Strategy
              </TabsTrigger>
            )}
            {availableTabs.includes('forecasts') && (
              <TabsTrigger value="forecasts" className="rounded-lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                Forecasts
              </TabsTrigger>
            )}
          </TabsList>

          {availableTabs.includes('dashboard') && (
            <TabsContent value="dashboard">
              <KeyMetricsTab />
            </TabsContent>
          )}

          {availableTabs.includes('gtm') && (
            <TabsContent value="gtm">
              <div className="space-y-8">
                <MarketOverviewTab />
                <GTMStrategyTab />
              </div>
            </TabsContent>
          )}

          {availableTabs.includes('forecasts') && (
            <TabsContent value="forecasts">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-8 text-center text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>3-Year Forecasts content will be displayed here based on selected data mode.</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
