import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  CreditCard,
  Plug,
  MessageSquare,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SparkIcon } from "@/components/spark/SparkIcon";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const advertiserNavSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', href: '/advertiser', icon: LayoutDashboard },
      { title: 'My Campaigns', href: '/advertiser/campaigns', icon: Megaphone },
      { title: 'Ad Library', href: '/advertiser/ads', icon: FolderOpen },
      { title: 'Creators & Shows', href: '/advertiser/creators', icon: Users },
      { title: 'Performance & Reports', href: '/advertiser/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Tools',
    items: [
      { title: 'Budgets & Billing', href: '/advertiser/billing', icon: CreditCard },
      { title: 'Integrations', href: '/advertiser/integrations', icon: Plug },
    ],
  },
  {
    title: 'Support',
    items: [
      { title: 'Contact Support', href: '/contact', icon: MessageSquare },
    ],
  },
];

export function AdvertiserSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          advertiser_onboarding_completed: false,
          preferred_role: 'advertiser',
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Onboarding Reset',
        description: 'You can now experience the advertiser onboarding flow again.',
      });

      setShowResetDialog(false);
      navigate('/advertiser/signup');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <>
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Advertiser Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restart advertiser onboarding? 
              This won't delete campaigns, creatives, or billing data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetOnboarding} disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset Onboarding'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between w-full">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <SparkIcon variant="holiday" size={48} animated pose="waving" />
                <span className="text-white text-2xl font-bold">Seeksy</span>
              </div>
            )}
            {collapsed && (
              <div className="flex items-center justify-center flex-1">
                <SparkIcon variant="holiday" size={32} animated pose="idle" />
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="pb-6">
          {advertiserNavSections.map((section) => (
            <SidebarGroup key={section.title}>
              {!collapsed && (
                <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/advertiser' && location.pathname.startsWith(item.href));
                    
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link to={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {/* Reset Onboarding Button */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowResetDialog(true)}
                    tooltip="Experience Onboarding"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Experience Onboarding</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
