import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type AccountType } from '@/hooks/useAccountType';
import { ArrowLeft, ArrowRight, Mic, Podcast, Calendar, Image, Instagram, PieChart, Layout, Users, Megaphone, Target, Zap, FileText, Play, Star, CheckCircle, Video } from 'lucide-react';
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
  gradient: string;
  widgets: Array<{ name: string; icon: any; color: string }>;
  quickActions: string[];
  checklist: string[];
}> = {
  creator: {
    title: 'Creator Dashboard',
    description: 'Your command center for content creation',
    gradient: 'from-purple-500 to-pink-500',
    widgets: [
      { name: 'Social Analytics', icon: PieChart, color: 'bg-purple-500' },
      { name: 'Media Library', icon: Image, color: 'bg-blue-500' },
      { name: 'My Page', icon: Layout, color: 'bg-green-500' },
      { name: 'Clips', icon: Play, color: 'bg-orange-500' },
    ],
    quickActions: ['Record Episode', 'Create Clip', 'View Analytics'],
    checklist: ['Connect socials', 'Upload first media', 'Build your page'],
  },
  podcaster: {
    title: 'Podcaster Dashboard',
    description: 'Everything you need to grow your show',
    gradient: 'from-blue-500 to-cyan-500',
    widgets: [
      { name: 'Studio', icon: Mic, color: 'bg-blue-500' },
      { name: 'Episodes', icon: Podcast, color: 'bg-purple-500' },
      { name: 'Bookings', icon: Calendar, color: 'bg-green-500' },
      { name: 'Media', icon: Image, color: 'bg-orange-500' },
    ],
    quickActions: ['Start Recording', 'New Episode', 'Schedule Guest'],
    checklist: ['Import your podcast', 'Record an episode', 'Invite a guest'],
  },
  influencer: {
    title: 'Influencer Dashboard',
    description: 'Grow your audience and monetize',
    gradient: 'from-amber-500 to-yellow-500',
    widgets: [
      { name: 'Social Stats', icon: PieChart, color: 'bg-amber-500' },
      { name: 'Brand Deals', icon: Star, color: 'bg-pink-500' },
      { name: 'Media Library', icon: Image, color: 'bg-blue-500' },
      { name: 'My Page', icon: Layout, color: 'bg-green-500' },
    ],
    quickActions: ['Sync Socials', 'View Analytics', 'Create Content'],
    checklist: ['Connect Instagram', 'Build your page', 'Verify identity'],
  },
  advertiser: {
    title: 'Advertiser Dashboard',
    description: 'Launch and track your campaigns',
    gradient: 'from-orange-500 to-red-500',
    widgets: [
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-blue-500' },
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
      { name: 'Segments', icon: Target, color: 'bg-purple-500' },
    ],
    quickActions: ['New Campaign', 'Find Creators', 'View Reports'],
    checklist: ['Set up company profile', 'Create first campaign', 'Browse creators'],
  },
  agency: {
    title: 'Agency Dashboard',
    description: 'Manage your creators and campaigns',
    gradient: 'from-green-500 to-emerald-500',
    widgets: [
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Team', icon: Users, color: 'bg-blue-500' },
      { name: 'Proposals', icon: FileText, color: 'bg-purple-500' },
    ],
    quickActions: ['Add Creator', 'New Proposal', 'Team Overview'],
    checklist: ['Add your first creator', 'Invite team members', 'Create proposal'],
  },
  event_planner: {
    title: 'Event Dashboard',
    description: 'Create and manage your events',
    gradient: 'from-indigo-500 to-purple-500',
    widgets: [
      { name: 'Events', icon: Calendar, color: 'bg-purple-500' },
      { name: 'Contacts', icon: Users, color: 'bg-blue-500' },
      { name: 'Automations', icon: Zap, color: 'bg-orange-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-green-500' },
    ],
    quickActions: ['Create Event', 'View RSVPs', 'Send Reminders'],
    checklist: ['Create your first event', 'Set up registration', 'Invite attendees'],
  },
  brand: {
    title: 'Explorer Dashboard',
    description: 'Discover Seeksy capabilities',
    gradient: 'from-slate-500 to-gray-500',
    widgets: [
      { name: 'Social Connect', icon: Instagram, color: 'bg-pink-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-blue-500' },
      { name: 'Campaigns', icon: Megaphone, color: 'bg-orange-500' },
      { name: 'Creators', icon: Users, color: 'bg-green-500' },
    ],
    quickActions: ['Connect Socials', 'Browse Creators', 'Start Campaign'],
    checklist: ['Explore features', 'Connect a social account', 'Try the studio'],
  },
  studio_team: {
    title: 'Studio Dashboard',
    description: 'Collaborate on productions',
    gradient: 'from-rose-500 to-pink-500',
    widgets: [
      { name: 'Studio', icon: Video, color: 'bg-rose-500' },
      { name: 'Media', icon: Image, color: 'bg-purple-500' },
      { name: 'Team', icon: Users, color: 'bg-green-500' },
      { name: 'Clips', icon: Play, color: 'bg-orange-500' },
    ],
    quickActions: ['New Session', 'Upload Media', 'Team Tasks'],
    checklist: ['Start a recording', 'Upload media', 'Invite team members'],
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'Platform management tools',
    gradient: 'from-gray-500 to-slate-500',
    widgets: [
      { name: 'Team', icon: Users, color: 'bg-blue-500' },
      { name: 'Analytics', icon: PieChart, color: 'bg-purple-500' },
      { name: 'Contacts', icon: Users, color: 'bg-green-500' },
      { name: 'Settings', icon: Zap, color: 'bg-orange-500' },
    ],
    quickActions: ['Manage Users', 'View Reports', 'Settings'],
    checklist: ['Review users', 'Check analytics', 'Configure settings'],
  },
};

export function DashboardPreviewStep({ accountType, tools, onContinue, onBack }: DashboardPreviewStepProps) {
  const config = dashboardConfigs[accountType];

  return (
    <Card className="p-6 shadow-xl border-border/50 bg-gradient-to-br from-card to-muted/20">
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "inline-flex p-3 rounded-2xl bg-gradient-to-br mb-2",
              config.gradient
            )}
          >
            <Layout className="h-6 w-6 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">Your Workspace Preview</h2>
          <p className="text-muted-foreground text-sm">
            Here's what your personalized dashboard will look like
          </p>
        </div>

        {/* Mock Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-xl border-2 border-border/50 bg-background overflow-hidden"
        >
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border/50">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-3">
              <div className="h-5 bg-muted rounded px-2 flex items-center text-xs text-muted-foreground">
                seeksy.io/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{config.title}</h3>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>

            {/* Three sections side by side */}
            <div className="grid grid-cols-3 gap-3">
              {/* Widgets */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Dashboard Widgets</p>
                <div className="grid grid-cols-2 gap-2">
                  {config.widgets.map((widget, index) => {
                    const Icon = widget.icon;
                    return (
                      <motion.div
                        key={widget.name}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="bg-muted/50 rounded-lg p-2 border border-border/30"
                      >
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center mb-1", widget.color)}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <p className="text-[10px] font-medium truncate">{widget.name}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Navigation</p>
                <div className="space-y-1.5">
                  {config.quickActions.map((action, i) => (
                    <motion.div
                      key={action}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className={cn(
                        "px-2 py-1.5 rounded text-[10px] font-medium",
                        i === 0 
                          ? `bg-gradient-to-r ${config.gradient} text-white` 
                          : "bg-muted/50 border border-border/30"
                      )}
                    >
                      {action}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Setup Checklist</p>
                <div className="space-y-1.5">
                  {config.checklist.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center gap-1.5 text-[10px]"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-primary/50 flex items-center justify-center">
                        <CheckCircle className="h-2.5 w-2.5 text-primary/50" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview badge */}
            <div className="flex justify-center pt-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                ✨ Preview — your real data appears after setup
              </span>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onContinue} size="sm" className={cn("bg-gradient-to-r", config.gradient, "text-white")}>
            Activate My Tools
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
