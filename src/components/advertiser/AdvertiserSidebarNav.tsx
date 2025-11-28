import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  CreditCard,
  Plug,
  HelpCircle,
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
      { title: 'Help Center', href: '/help-center', icon: HelpCircle },
      { title: 'Contact Support', href: '/admin/tickets/new', icon: MessageSquare },
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
          advertiser_onboarding_status: null,
          advertiser_onboarding_step: null,
          preferred_role: 'advertiser',
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Onboarding Reset',
        description: 'You can now experience the advertiser onboarding flow again.',
      });

      setShowResetDialog(false);
      navigate('/advertiser/onboarding/start');
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

      <div className="flex flex-col gap-6 py-4">
        {advertiserNavSections.map((section) => (
        <div key={section.title} className="px-3">
          <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.title}
          </h3>
          <nav className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href !== '/advertiser' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="px-3 mt-4 pt-4 border-t border-border">
        <button
          onClick={() => setShowResetDialog(true)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Experience Onboarding
        </button>
      </div>
    </div>
    </>
  );
}
