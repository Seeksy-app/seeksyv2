import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, FileText, Calendar, Mail, Users, Megaphone, Ticket, Image, Radio, ClipboardList, Award, DollarSign, FileSpreadsheet, Newspaper, Smartphone, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  category: string;
  url: string;
  icon: any;
  description?: string;
}

interface GroupedResults {
  [category: string]: SearchResult[];
}

export const MasterSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flatResults, setFlatResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Static pages that are always searchable
  const staticPages: SearchResult[] = [
    { id: "dashboard", title: "Dashboard", type: "Page", category: "Pages", url: "/dashboard", icon: FileText },
    { id: "meetings", title: "Meetings", type: "Page", category: "Pages", url: "/meetings", icon: Calendar },
    { id: "events", title: "Events", type: "Page", category: "Pages", url: "/events", icon: Calendar },
    { id: "marketing", title: "Marketing", type: "Page", category: "Pages", url: "/marketing", icon: Megaphone },
    { id: "crm", title: "CRM & Contacts", type: "Page", category: "Pages", url: "/crm", icon: Users },
    { id: "pm", title: "Project Management", type: "Page", category: "Pages", url: "/project-management", icon: Ticket },
    { id: "lead", title: "Create Field Lead", type: "Page", category: "Pages", url: "/create-lead", icon: ClipboardList },
    { id: "media", title: "Media Library", type: "Page", category: "Pages", url: "/media-library", icon: Image },
    { id: "podcasts", title: "Podcasts", type: "Page", category: "Pages", url: "/podcasts", icon: Radio },
    { id: "awards", title: "Awards", type: "Page", category: "Pages", url: "/awards", icon: Award },
    { id: "cfo", title: "CFO Dashboard", type: "Page", category: "Pages", url: "/cfo-dashboard", icon: DollarSign },
    { id: "blog", title: "Blog", type: "Page", category: "Pages", url: "/blog", icon: Newspaper },
    { id: "sms", title: "SMS Marketing", type: "Page", category: "Pages", url: "/sms", icon: Smartphone },
    { id: "profile", title: "Profile Settings", type: "Page", category: "Pages", url: "/profile-settings", icon: User },
    { id: "admin", title: "Admin Dashboard", type: "Page", category: "Pages", url: "/admin", icon: Settings },
    { id: "admin-audio", title: "App Audio Admin", type: "Page", category: "Admin", url: "/admin/app-audio-admin", icon: Settings, description: "Manage app audio descriptions" },
  ];

  useEffect(() => {
    const searchContent = async () => {
      if (!searchQuery.trim() || !user) {
        setResults([]);
        return;
      }

      const query = searchQuery.toLowerCase();
      
      // Filter static pages
      const pageResults = staticPages.filter(page => 
        page.title.toLowerCase().includes(query) ||
        page.type.toLowerCase().includes(query)
      );

      // Search contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("user_id", user.id)
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      const contactResults: SearchResult[] = (contacts || []).map(contact => ({
        id: contact.id,
        title: contact.name,
        type: "Contact",
        category: "Contacts",
        url: "/crm",
        icon: Users,
        description: contact.email,
      }));

      // Search tickets
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, title, ticket_number")
        .eq("user_id", user.id)
        .or(`title.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`)
        .limit(5);

      const ticketResults: SearchResult[] = (tickets || []).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        type: "Ticket",
        category: "Tickets",
        url: "/project-management",
        icon: Ticket,
        description: ticket.ticket_number,
      }));

      // Search meetings
      const { data: meetings } = await supabase
        .from("meetings")
        .select("id, title, attendee_name")
        .eq("user_id", user.id)
        .or(`title.ilike.%${searchQuery}%,attendee_name.ilike.%${searchQuery}%`)
        .limit(5);

      const meetingResults: SearchResult[] = (meetings || []).map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        type: "Meeting",
        category: "Meetings",
        url: "/meetings",
        icon: Calendar,
        description: `with ${meeting.attendee_name}`,
      }));

      // Search events
      const { data: events } = await supabase
        .from("events")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      const eventResults: SearchResult[] = (events || []).map(event => ({
        id: event.id,
        title: event.title,
        type: "Event",
        category: "Events",
        url: "/events",
        icon: Calendar,
      }));

      // Search podcasts
      const { data: podcasts } = await supabase
        .from("podcasts")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      const podcastResults: SearchResult[] = (podcasts || []).map(podcast => ({
        id: podcast.id,
        title: podcast.title,
        type: "Podcast",
        category: "Media",
        url: "/podcasts",
        icon: Radio,
      }));

      // Search blog posts
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      const blogResults: SearchResult[] = (posts || []).map(post => ({
        id: post.id,
        title: post.title,
        type: "Blog Post",
        category: "Content",
        url: "/blog",
        icon: Newspaper,
      }));

      // Combine all results
      const allResults = [
        ...pageResults,
        ...contactResults,
        ...ticketResults,
        ...meetingResults,
        ...eventResults,
        ...podcastResults,
        ...blogResults,
      ];

      const limitedResults = allResults.slice(0, 15);
      setResults(limitedResults);
      setFlatResults(limitedResults);
      setSelectedIndex(0);
    };

    const debounce = setTimeout(() => {
      searchContent();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.url);
    setSearchQuery("");
    setIsOpen(false);
    setSelectedIndex(0);
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleResultClick(flatResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, flatResults, selectedIndex, handleResultClick]);

  // Group results by category
  const groupedResults: GroupedResults = results.reduce((acc, result) => {
    const category = result.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as GroupedResults);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search anything... (contacts, meetings, events, pages)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 h-11 bg-background/80 backdrop-blur-sm border-muted-foreground/20"
        />
      </div>

      {isOpen && searchQuery && results.length > 0 && (
        <Card ref={resultsRef} className="absolute top-full mt-2 w-full z-50 shadow-xl border-muted-foreground/20">
          <ScrollArea className="max-h-[500px]">
            <div className="p-2">
              {Object.entries(groupedResults).map(([category, categoryResults], categoryIndex) => (
                <div key={category}>
                  {categoryIndex > 0 && <Separator className="my-2" />}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {categoryResults.map((result, index) => {
                      const Icon = result.icon;
                      const globalIndex = flatResults.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                            "focus:outline-none",
                            isSelected 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-primary/20" : "bg-muted"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-medium truncate",
                                isSelected && "text-primary"
                              )}>
                                {result.title}
                              </p>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                isSelected 
                                  ? "bg-primary/20 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {result.type}
                              </span>
                            </div>
                            {result.description && (
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {result.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-3 py-2 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Use <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">↑</kbd> <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Enter</kbd> to select, <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Esc</kbd> to close
            </p>
          </div>
        </Card>
      )}

      {isOpen && searchQuery && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full p-4 z-50 shadow-xl">
          <p className="text-sm text-muted-foreground text-center">
            No results found for "{searchQuery}"
          </p>
        </Card>
      )}
    </div>
  );
};