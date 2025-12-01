import { useState, useEffect, useRef } from "react";
import { Search, Mail, Users, Calendar, Video, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  type: "contact" | "email" | "meeting" | "event" | "clip" | "post" | "page";
  title: string;
  subtitle?: string;
  route: string;
}

const iconMap = {
  contact: Users,
  email: Mail,
  meeting: Calendar,
  event: Calendar,
  clip: Video,
  post: FileText,
  page: FileText,
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const searchPattern = `%${query}%`;
        const allResults: SearchResult[] = [];

        // Search contacts
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id, name, email")
          .eq("user_id", user.id)
          .ilike("name", searchPattern)
          .limit(5);

        if (contacts) {
          allResults.push(
            ...contacts.map((c: any) => ({
              id: c.id,
              type: "contact" as const,
              title: c.name || c.email,
              subtitle: c.email,
              route: `/audience?id=${c.id}`,
            }))
          );
        }

        // Search meetings  
        const { data: meetings } = await supabase
          .from("meetings")
          .select("id, title")
          .eq("user_id", user.id)
          .ilike("title", searchPattern)
          .limit(5);

        if (meetings) {
          allResults.push(
            ...meetings.map((m: any) => ({
              id: m.id,
              type: "meeting" as const,
              title: m.title,
              route: `/meetings/${m.id}`,
            }))
          );
        }

        setResults(allResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (route: string) => {
    navigate(route);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search everything..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 bg-background"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-lg z-50 border">
          <div className="p-2 space-y-1">
            {results.map((result) => {
              const Icon = iconMap[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full p-4 shadow-lg z-50 border">
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </Card>
      )}
    </div>
  );
}
