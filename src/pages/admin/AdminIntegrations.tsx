import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Puzzle, 
  Database, 
  Cloud, 
  Mail, 
  CreditCard, 
  Video, 
  Mic, 
  Bot,
  Webhook,
  Key,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  Zap,
  Globe,
  MessageSquare,
  Calendar as CalendarIcon,
  Folder as FolderIcon,
  Box as BoxIcon,
  Search,
  Unplug,
  PlugZap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'not_connected' | 'error';
  category: string;
  configPath?: string;
}

const integrations: Integration[] = [
  // Core Infrastructure
  {
    id: 'supabase',
    name: 'Supabase (Lovable Cloud)',
    description: 'Database, auth, storage, and edge functions',
    icon: <Database className="w-5 h-5" />,
    status: 'connected',
    category: 'Infrastructure',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Stream',
    description: 'Video streaming and processing',
    icon: <Cloud className="w-5 h-5" />,
    status: 'connected',
    category: 'Infrastructure',
  },
  // Google Integrations
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Calendar sync and event management',
    icon: <CalendarIcon className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Google',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Email integration and inbox sync',
    icon: <Mail className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Google',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'File storage and document sync',
    icon: <FolderIcon className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Google',
  },
  // Storage
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud storage and file import',
    icon: <BoxIcon className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Storage',
  },
  // Communication
  {
    id: 'resend',
    name: 'Resend',
    description: 'Transactional email delivery',
    icon: <Mail className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and voice communications',
    icon: <MessageSquare className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  // AI & Media
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Voice synthesis and cloning',
    icon: <Mic className="w-5 h-5" />,
    status: 'connected',
    category: 'AI & Media',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models and Whisper transcription',
    icon: <Bot className="w-5 h-5" />,
    status: 'connected',
    category: 'AI & Media',
  },
  {
    id: 'shotstack',
    name: 'Shotstack',
    description: 'Video rendering and clip generation',
    icon: <Video className="w-5 h-5" />,
    status: 'connected',
    category: 'AI & Media',
  },
  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    icon: <CreditCard className="w-5 h-5" />,
    status: 'connected',
    category: 'Payments',
  },
  // External APIs
  {
    id: 'polygon',
    name: 'Polygon Network',
    description: 'Blockchain identity and NFT minting',
    icon: <Globe className="w-5 h-5" />,
    status: 'connected',
    category: 'Blockchain',
  },
  {
    id: 'daily',
    name: 'Daily.co',
    description: 'Video conferencing and rooms',
    icon: <Video className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Meeting integration and recordings',
    icon: <Video className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  // Webhooks & Automation
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Custom webhook endpoints',
    icon: <Webhook className="w-5 h-5" />,
    status: 'connected',
    category: 'Automation',
    configPath: '/admin/webhooks',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Workflow automation',
    icon: <Zap className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Automation',
  },
];

const categoryOrder = ['Infrastructure', 'Google', 'Storage', 'AI & Media', 'Communication', 'Payments', 'Blockchain', 'Automation'];

export default function AdminIntegrations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, Integration['status']>>(
    integrations.reduce((acc, i) => ({ ...acc, [i.id]: i.status }), {})
  );

  const handleConnect = (integrationId: string, integrationName: string) => {
    // Simulate connection
    toast.success(`Connecting to ${integrationName}...`);
    setIntegrationStatuses(prev => ({ ...prev, [integrationId]: 'connected' }));
  };

  const handleDisconnect = (integrationId: string, integrationName: string) => {
    toast.success(`Disconnected from ${integrationName}`);
    setIntegrationStatuses(prev => ({ ...prev, [integrationId]: 'not_connected' }));
  };

  const handleRefresh = (integrationName: string) => {
    toast.success(`Refreshing ${integrationName}...`);
  };

  const filteredIntegrations = integrations.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedIntegrations = categoryOrder.reduce((acc, category) => {
    acc[category] = filteredIntegrations.filter(i => i.category === category);
    return acc;
  }, {} as Record<string, Integration[]>);

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500">
            Not Connected
          </Badge>
        );
    }
  };

  const connectedCount = Object.values(integrationStatuses).filter(s => s === 'connected').length;
  const availableCount = Object.values(integrationStatuses).filter(s => s === 'not_connected').length;
  const errorCount = Object.values(integrationStatuses).filter(s => s === 'error').length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Puzzle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Integrations</h1>
            <p className="text-muted-foreground">Manage third-party services and API connections</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/keys-vault')}>
          <Key className="w-4 h-4 mr-2" />
          Manage API Keys
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{availableCount}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{errorCount}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{categoryOrder.length}</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Groups */}
      {categoryOrder.map(category => {
        const categoryIntegrations = groupedIntegrations[category];
        if (!categoryIntegrations?.length) return null;

        return (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map(integration => {
                const currentStatus = integrationStatuses[integration.id];
                return (
                  <Card key={integration.id} className="bg-card border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {integration.icon}
                        </div>
                        {getStatusBadge(currentStatus)}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                      <div className="flex gap-2">
                        {integration.configPath ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => navigate(integration.configPath!)}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        ) : currentStatus === 'connected' ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleRefresh(integration.name)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Refresh
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDisconnect(integration.id, integration.name)}
                            >
                              <Unplug className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleConnect(integration.id, integration.name)}
                          >
                            <PlugZap className="w-3 h-3 mr-1" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        API keys and secrets are managed securely via the Keys Vault. Contact support for enterprise integrations.
      </p>
    </div>
  );
}