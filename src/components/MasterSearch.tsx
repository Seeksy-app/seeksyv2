import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, FileText, Calendar, Mail, Users, Megaphone, Ticket, Image, Radio, ClipboardList, Award, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
  icon: any;
  description?: string;
}

export const MasterSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Static pages that are always searchable
  const staticPages: SearchResult[] = [
    { id: "dashboard", title: "Dashboard", type: "Page", url: "/dashboard", icon: FileText },
    { id: "meetings", title: "Meetings", type: "Page", url: "/meetings", icon: Calendar },
    { id: "events", title: "Events", type: "Page", url: "/events", icon: Calendar },
    { id: "marketing", title: "Marketing", type: "Page", url: "/marketing", icon: Megaphone },
    { id: "crm", title: "CRM & Contacts", type: "Page", url: "/crm", icon: Users },
    { id: "pm", title: "Project Management", type: "Page", url: "/project-management", icon: Ticket },
    { id: "lead", title: "Create Field Lead", type: "Page", url: "/create-lead", icon: ClipboardList },
    { id: "media", title: "Media Library", type: "Page", url: "/media-library", icon: Image },
    { id: "podcasts", title: "Podcasts", type: "Page", url: "/podcasts", icon: Radio },
    { id: "awards", title: "Awards", type: "Page", url: "/awards", icon: Award },
    { id: "cfo", title: "CFO Dashboard", type: "Page", url: "/cfo-dashboard", icon: DollarSign },
    { id: "blog", title: "Blog", type: "Page", url: "/blog", icon: FileText },
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
        url: "/events",
        icon: Calendar,
      }));

      // Combine all results
      const allResults = [
        ...pageResults,
        ...contactResults,
        ...ticketResults,
        ...meetingResults,
        ...eventResults,
      ];

      setResults(allResults.slice(0, 10));
    };

    const debounce = setTimeout(() => {
      searchContent();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search anything... (contacts, meetings, events, pages)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10 pr-4 h-11 bg-background/80 backdrop-blur-sm border-muted-foreground/20"
        />
      </div>

      {isOpen && searchQuery && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-xl">
          <div className="p-2">
            {results.map((result) => {
              const Icon = result.icon;
              return (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left",
                    "focus:outline-none focus:bg-muted/50"
                  )}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{result.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {result.type}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {result.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
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