import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type AccountType } from '@/hooks/useAccountType';
import { ArrowLeft, ArrowRight, Mic, Podcast, Calendar, Image, Instagram, PieChart, Layout, Users, Megaphone, Target, Zap, FileText, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardPreviewStepProps {
  accountType: AccountType;
  tools: string[];
  onContinue: () => void;
  onBack: () => void;
}

const dashboardConfigs: Record<AccountType, {
  title: string;
  description: string;
  widgets: Array<{ name: string; icon: any; color: string }>;
  quickActions: string[];
}> = {
  creator: {
    title: 'Creator Dashboard',
    description: 'Your command center for content creation',
    widgets: [
      { name: 'Social Analytics', icon: PieChart, color: 'bg-purple-500' },
      { name: 'Media Library', icon: Image, color: 'bg-blue-500' },
      { name: 'My Page', icon: Layout, color: 'bg-green-500' },
      { name: 'Clips', icon: Play, color: 'bg-orange-500' },
    ],
    quickActions: ['Record Episode', 'Create Clip', 'View Analytics'],
  },
  podcaster: {
    title: 'Podcaster Dashboard',
    description: 'Everything you need to grow your show',
    widgets: [
      { name: 'Studio', icon: Mic, color: 'bg-blue-500' },
      { name: 'Episodes', icon: Podcast, color: 'bg-purple-500' },
      { name: 'Bookings', icon: Calendar, color: 'bg-green-500' },
      { name: 'Media', icon: Image, color: 'bg-orange-500' },
    ],
    quickActions: ['Start Recording', 'New Episode', 'Schedule Guest'],
  },
  advertiser: {
    title: 'Advertiser Dashboard',
    description: 'Launch and track your campaigns',
    widgets: [
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-blue-500' },
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
      { name: 'Segments', icon: Target, color: 'bg-purple-500' },
    ],
    quickActions: ['New Campaign', 'Find Creators', 'View Reports'],
  },
  agency: {
    title: 'Agency Dashboard',
    description: 'Manage your creators and campaigns',
    widgets: [
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Team', icon: Users, color: 'bg-blue-500' },
      { name: 'Proposals', icon: FileText, color: 'bg-purple-500' },
    ],
    quickActions: ['Add Creator', 'New Proposal', 'Team Overview'],
  },
  event_planner: {
    title: 'Event Dashboard',
    description: 'Create and manage your events',
    widgets: [
      { name: 'Events', icon: Calendar, color: 'bg-purple-500' },
      { name: 'Contacts', icon: Users, color: 'bg-blue-500' },
      { name: 'Automations', icon: Zap, color: 'bg-orange-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-green-500' },
    ],
    quickActions: ['Create Event', 'View RSVPs', 'Send Reminders'],
  },
  brand: {
    title: 'Brand Dashboard',
    description: 'Explore Seeksy capabilities',
    widgets: [
      { name: 'Social Connect', icon: Instagram, color: 'bg-pink-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-blue-500' },
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
    ],
    quickActions: ['Connect Socials', 'Browse Creators', 'Start Campaign'],
  },
  studio_team: {
    title: 'Studio Dashboard',
    description: 'Collaborate on productions',
    widgets: [
      { name: 'Studio', icon: Mic, color: 'bg-blue-500' },
      { name: 'Media', icon: Image, color: 'bg-purple-500' },
      { name: 'Team', icon: Users, color: 'bg-green-500' },
      { name: 'Clips', icon: Play, color: 'bg-orange-500' },
    ],
    quickActions: ['New Session', 'Upload Media', 'Team Tasks'],
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'Platform management tools',
    widgets: [
      { name: 'Team', icon: Users, color: 'bg-blue-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-purple-500' },
      { name: 'Contacts', icon: Users, color: 'bg-green-500' },
      { name: 'Settings', icon: Zap, color: 'bg-orange-500' },
    ],
    quickActions: ['Manage Users', 'View Reports', 'Settings'],
  },
};

export function DashboardPreviewStep({ accountType, tools, onContinue, onBack }: DashboardPreviewStepProps) {
  const config = dashboardConfigs[accountType];

  return (
    <Card className="p-8 shadow-xl border-border/50">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Preview Your Dashboard</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Here's what your personalized workspace will look like
          </p>
        </div>

        {/* Mock Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl border-2 border-border/50 bg-muted/30 overflow-hidden"
        >
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-6 bg-background rounded px-3 flex items-center text-xs text-muted-foreground">
                seeksy.io/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{config.title}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
              <div className="flex gap-2">
                {config.quickActions.slice(0, 2).map((action, i) => (
                  <div
                    key={action}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium",
                      i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {config.widgets.map((widget, index) => {
                const Icon = widget.icon;
                return (
                  <motion.div
                    key={widget.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-background rounded-xl p-4 border border-border/50 shadow-sm"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", widget.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-medium text-sm">{widget.name}</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", widget.color)} 
                        style={{ width: `${60 + index * 10}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Preview badge */}
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                ✨ This is a preview — your real data will appear after setup
              </span>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onContinue} className="gap-2">
            Activate My Tools
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
