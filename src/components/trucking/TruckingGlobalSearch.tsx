import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Package, Phone, Users, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "load" | "lead" | "call" | "contact";
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
}

interface TruckingGlobalSearchProps {
  className?: string;
  onResultClick?: () => void;
}

export function TruckingGlobalSearch({ className, onResultClick }: TruckingGlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchTerm = `%${query}%`;
        const searchResults: SearchResult[] = [];

        // Search loads
        const { data: loads } = await supabase
          .from("trucking_loads")
          .select("id, load_number, origin_city, origin_state, destination_city, destination_state, status, target_rate")
          .eq("is_active", true)
          .or(`load_number.ilike.${searchTerm},origin_city.ilike.${searchTerm},destination_city.ilike.${searchTerm},commodity.ilike.${searchTerm}`)
          .limit(5);

        loads?.forEach((load) => {
          searchResults.push({
            type: "load",
            id: load.id,
            title: `Load #${load.load_number}`,
            subtitle: `${load.origin_city}, ${load.origin_state} → ${load.destination_city}, ${load.destination_state}`,
            meta: load.status,
          });
        });

        // Search leads
        const { data: leads } = await supabase
          .from("trucking_carrier_leads")
          .select("id, company_name, contact_name, phone, status, mc_number")
          .or(`company_name.ilike.${searchTerm},contact_name.ilike.${searchTerm},phone.ilike.${searchTerm},mc_number.ilike.${searchTerm}`)
          .limit(5);

        leads?.forEach((lead) => {
          searchResults.push({
            type: "lead",
            id: lead.id,
            title: lead.company_name || lead.contact_name || "Unknown",
            subtitle: lead.phone || lead.mc_number || "",
            meta: lead.status,
          });
        });

        // Search call logs
        const { data: calls } = await supabase
          .from("trucking_call_logs")
          .select("id, carrier_phone, summary, call_outcome, call_started_at")
          .is("deleted_at", null)
          .or(`carrier_phone.ilike.${searchTerm},summary.ilike.${searchTerm},transcript.ilike.${searchTerm}`)
          .order("call_started_at", { ascending: false })
          .limit(5);

        calls?.forEach((call) => {
          searchResults.push({
            type: "call",
            id: call.id,
            title: call.carrier_phone || "Unknown",
            subtitle: call.summary?.substring(0, 60) || "No summary",
            meta: call.call_outcome,
          });
        });

        // Search contacts
        const { data: contacts } = await supabase
          .from("trucking_contacts")
          .select("id, company_name, contact_name, phone, mc_number, contact_type")
          .or(`company_name.ilike.${searchTerm},contact_name.ilike.${searchTerm},phone.ilike.${searchTerm},mc_number.ilike.${searchTerm},dot_number.ilike.${searchTerm}`)
          .limit(5);

        contacts?.forEach((contact) => {
          searchResults.push({
            type: "contact",
            id: contact.id,
            title: contact.company_name || contact.contact_name || "Unknown",
            subtitle: contact.phone || contact.mc_number || "",
            meta: contact.contact_type,
          });
        });

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    onResultClick?.();

    switch (result.type) {
      case "load":
        navigate(`/trucking/loads?search=${result.title.replace("Load #", "")}`);
        break;
      case "lead":
        navigate(`/trucking?tab=pending&search=${result.title}`);
        break;
      case "call":
        navigate(`/trucking/call-logs?search=${result.id}`);
        break;
      case "contact":
        navigate(`/trucking/contacts?search=${result.title}`);
        break;
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "load":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "lead":
        return <Users className="h-4 w-4 text-green-500" />;
      case "call":
        return <Phone className="h-4 w-4 text-purple-500" />;
      case "contact":
        return <FileText className="h-4 w-4 text-orange-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "load":
        return "Load";
      case "lead":
        return "Lead";
      case "call":
        return "Call";
      case "contact":
        return "Contact";
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search loads, carriers, calls, contacts..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-10 pr-10 bg-white border-slate-200"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                  {getTypeLabel(type as SearchResult["type"])}s ({items.length})
                </div>
                {items.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-3 py-2 flex items-start gap-3 hover:bg-muted/50 text-left transition-colors"
                  >
                    <div className="mt-0.5">{getIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                    </div>
                    {result.meta && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                        {result.meta}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
