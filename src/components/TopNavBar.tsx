/**
 * Firecrawl-inspired TopNavBar
 * Clean, minimal design with: Team selector, Search, Help, Docs, Notifications
 */

import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import { DataModePill } from "@/components/data-mode/DataModePill";
import { GlossaryButton } from "@/components/board/GlossaryModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, FileText, ChevronDown, Sparkles, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("Personal Workspace");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, account_full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const name = profile.full_name || profile.account_full_name;
          if (name) {
            setTeamName(`${name.split(' ')[0]}'s Workspace`);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const openAIChat = () => {
    document.dispatchEvent(new Event('open-spark-assistant'));
  };

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/cfo');
  const isBoardRoute = location.pathname.startsWith('/board');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        {/* Left: Team/Workspace Selector - Firecrawl style */}
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
            <DropdownMenuItem onClick={() => navigate('/settings/workspace')}>
              Workspace Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Center: Global Search - Firecrawl has search in sidebar, we keep it in top bar */}
        <div className="flex-1 max-w-xl mx-4">
          <GlobalSearch />
        </div>

        {/* Right: Actions - Firecrawl style */}
        <div className="flex items-center gap-1">
          {/* Data Mode Pill */}
          <DataModePill />

          {/* Notifications */}
          <NotificationsBell />

          {/* Help - Firecrawl style */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={openAIChat}>
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Ask AI Assistant
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/support">
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

          {/* Docs - Firecrawl style */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hidden sm:flex"
            asChild
          >
            <Link to="/docs">
              <FileText className="h-4 w-4" />
              Docs
            </Link>
          </Button>

          {/* Glossary for Admin/CFO routes */}
          {(isAdminRoute || isBoardRoute) && <GlossaryButton />}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
