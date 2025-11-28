import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
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
    </div>
  );
}
