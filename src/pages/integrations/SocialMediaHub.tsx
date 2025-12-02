import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Facebook, Link as LinkIcon, CheckCircle2, Twitter, Youtube, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SocialIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  connected: boolean;
  gradient: string;
  available: boolean;
}

export default function SocialMediaHub() {
  const navigate = useNavigate();

  // Check connected Meta accounts
  const { data: metaIntegrations } = useQuery({
    queryKey: ['meta-integrations-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('meta_integrations')
        .select('platform')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  const hasInstagram = metaIntegrations?.some(i => i.platform === 'instagram');
  const hasFacebook = metaIntegrations?.some(i => i.platform === 'facebook');

  const integrations: SocialIntegration[] = [
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Sync followers, engagement metrics, and post performance from your Instagram Business account',
      icon: <Instagram className="h-6 w-6 text-white" />,
      path: '/integrations/meta',
      connected: hasInstagram || false,
      gradient: 'from-purple-500 to-pink-500',
      available: true,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Connect your Facebook Page to sync insights, audience data, and post analytics',
      icon: <Facebook className="h-6 w-6 text-white" />,
      path: '/integrations/meta',
      connected: hasFacebook || false,
      gradient: 'from-blue-600 to-blue-500',
      available: true,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Import your TikTok videos, analytics, and audience demographics',
      icon: <Music className="h-6 w-6 text-white" />,
      path: '#',
      connected: false,
      gradient: 'from-black to-gray-800',
      available: false,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Sync your YouTube channel videos, views, and subscriber data',
      icon: <Youtube className="h-6 w-6 text-white" />,
      path: '#',
      connected: false,
      gradient: 'from-red-600 to-red-500',
      available: false,
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      description: 'Connect your Twitter account to track tweets, engagement, and follower growth',
      icon: <Twitter className="h-6 w-6 text-white" />,
      path: '#',
      connected: false,
      gradient: 'from-sky-500 to-sky-400',
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Social Media</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your social media accounts to sync data, track performance, and expand your reach
          </p>
        </div>

        {/* Available Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Card 
              key={integration.id} 
              className={`border-2 transition-all ${integration.available ? 'hover:shadow-lg cursor-pointer' : 'opacity-60'}`}
              onClick={() => integration.available && navigate(integration.path)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${integration.gradient}`}>
                    {integration.icon}
                  </div>
                  {integration.connected ? (
                    <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : integration.available ? (
                    <Badge variant="outline">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <CardTitle>{integration.name}</CardTitle>
                <CardDescription className="min-h-[60px]">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant={integration.connected ? "outline" : "default"}
                  disabled={!integration.available}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (integration.available) {
                      navigate(integration.path);
                    }
                  }}
                >
                  {!integration.available ? 'Coming Soon' : integration.connected ? 'Manage' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
