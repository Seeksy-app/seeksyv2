/**
 * Firecrawl-inspired TopNavBar
 * Clean, minimal design with: Team selector, Search, Help, Docs, Notifications
 */

import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeDropdown } from "@/components/ThemeDropdown";
import { NotificationsBell } from "@/components/NotificationsBell";
import { DataModePill } from "@/components/data-mode/DataModePill";
import { AdminViewSwitcher } from "@/components/admin/AdminViewSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, FileText, ChevronDown, Sparkles, ExternalLink, Settings, LogOut, User, BookOpen, MessageCircle, Pin, PinOff } from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePinnedHeaderItems, headerItems, HeaderItemId } from "@/hooks/usePinnedHeaderItems";

export function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUserRoles();
  const { pinnedItems, togglePin, isPinned } = usePinnedHeaderItems();
  const [teamName, setTeamName] = useState("Personal Workspace");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, account_full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const name = profile.full_name || profile.account_full_name;
          if (name) {
            setTeamName(`${name.split(' ')[0]}'s Workspace`);
            setUserName(name);
          }
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/auth');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const openAIChat = () => {
    document.dispatchEvent(new Event('open-spark-assistant'));
  };

  const handleHeaderItemClick = (item: typeof headerItems[0]) => {
    if (item.action === 'glossary') {
      document.dispatchEvent(new Event('open-glossary'));
    } else if (item.action === 'daily-brief') {
      document.dispatchEvent(new CustomEvent('open-daily-brief', { detail: { audienceType: 'ceo' } }));
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/cfo');
  const isBoardRoute = location.pathname.startsWith('/board');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        {/* Left: Admin View Switcher for admins, context indicator for others */}
        {isAdmin ? (
          <AdminViewSwitcher />
        ) : isBoardRoute ? (
          // Board context - no workspace dropdown
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-600">B</span>
            </div>
            <span className="font-medium text-foreground">Board Portal</span>
          </div>
        ) : (
          // Creator context - show workspace selector
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-medium text-foreground hover:bg-accent"
              >
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {teamName[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline">{teamName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem className="font-medium">
                {teamName}
                <Badge variant="secondary" className="ml-auto text-[10px]">Current</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/workspace')}>
                Workspace Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Center: Global Search - Firecrawl has search in sidebar, we keep it in top bar */}
        <div className="flex-1 max-w-xl mx-4">
          <GlobalSearch />
        </div>

        {/* Right: Actions - Firecrawl style */}
        <div className="flex items-center gap-1">
          {/* Data Mode Pill */}
          <DataModePill />

          {/* Pinned Header Items */}
          {headerItems.filter(item => isPinned(item.id)).map(item => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleHeaderItemClick(item)}
              className="gap-2 hidden sm:flex"
            >
              {item.id === 'knowledge-hub' && <BookOpen className="h-4 w-4" />}
              {item.id === 'daily-brief' && <FileText className="h-4 w-4" />}
              {item.id === 'docs' && <FileText className="h-4 w-4" />}
              {item.id === 'glossary' && <BookOpen className="h-4 w-4" />}
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}

          {/* Ask Seeksy - for Admin routes (styled like Creator header) */}
          {isAdminRoute && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={openAIChat}
              className="gap-2 hidden sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ask Seeksy</span>
            </Button>
          )}

          {/* Notifications */}
          <NotificationsBell />

          {/* Help Dropdown - contains Knowledge Hub, Daily Brief, Docs, Glossary, Ask AI Assistant */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={openAIChat} className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI Assistant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {headerItems.map(item => (
                <DropdownMenuItem 
                  key={item.id}
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHeaderItemClick(item);
                  }}
                >
                  <div className="flex items-center">
                    {item.id === 'knowledge-hub' && <BookOpen className="h-4 w-4 mr-2" />}
                    {item.id === 'daily-brief' && <FileText className="h-4 w-4 mr-2" />}
                    {item.id === 'docs' && <FileText className="h-4 w-4 mr-2" />}
                    {item.id === 'glossary' && <BookOpen className="h-4 w-4 mr-2" />}
                    {item.label}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    title={isPinned(item.id) ? 'Unpin from header' : 'Pin to header'}
                  >
                    {isPinned(item.id) ? (
                      <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/helpdesk">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="mailto:support@seeksy.io" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Theme Dropdown */}
          <ThemeDropdown />

          {/* User Menu with Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 ml-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName || "User"}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={location.pathname.startsWith('/admin') || location.pathname.startsWith('/cfo') ? '/admin/profile-settings' : '/settings'}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
