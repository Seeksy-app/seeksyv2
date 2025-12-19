import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, X, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface HighIntentKeyword {
  id: string;
  keyword: string;
  keyword_type: string;
  load_id: string | null;
  expires_at: string;
  created_at: string;
}

interface Load {
  id: string;
  load_number: string;
  origin_city: string;
  destination_city: string;
}

interface HighIntentKeywordsCardProps {
  loads?: Load[];
  onRefresh?: () => void;
}

export function HighIntentKeywordsCard({ loads = [], onRefresh }: HighIntentKeywordsCardProps) {
  const [keywords, setKeywords] = useState<HighIntentKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [keywordType, setKeywordType] = useState<string>("custom");
  const [selectedLoadId, setSelectedLoadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      // Only fetch non-expired keywords
      const { data, error } = await supabase
        .from("trucking_high_intent_keywords")
        .select("*")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKeywords((data as unknown as HighIntentKeyword[]) || []);
    } catch (error: any) {
      console.error("Error fetching keywords:", error);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) {
      toast({ title: "Please enter a keyword", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate expiry at midnight CST tomorrow
      const now = new Date();
      const cstNow = toZonedTime(now, 'America/Chicago');
      const tomorrow = new Date(cstNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const { error } = await supabase
        .from("trucking_high_intent_keywords")
        .insert({
          keyword: newKeyword.trim().toLowerCase(),
          keyword_type: keywordType,
          load_id: selectedLoadId || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({ 
        title: "Keyword added", 
        description: `"${newKeyword}" will trigger premium response until midnight CST` 
      });
      setNewKeyword("");
      setSelectedLoadId("");
      fetchKeywords();
      onRefresh?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const removeKeyword = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trucking_high_intent_keywords")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Keyword removed" });
      fetchKeywords();
      onRefresh?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addFromLoad = (load: Load) => {
    const keywordsToAdd = [
      { keyword: load.origin_city.toLowerCase(), type: "origin_city" },
      { keyword: load.destination_city.toLowerCase(), type: "destination_city" },
      { keyword: load.load_number.toLowerCase(), type: "load_number" },
    ];
    
    // Add all keywords from this load
    Promise.all(
      keywordsToAdd.map(async (kw) => {
        const { data: { user } } = await supabase.auth.getUser();
        return supabase.from("trucking_high_intent_keywords").insert({
          keyword: kw.keyword,
          keyword_type: kw.type,
          load_id: load.id,
          created_by: user?.id,
        });
      })
    ).then(() => {
      toast({ 
        title: "Load keywords added", 
        description: `Added origin, destination, and load number for ${load.load_number}` 
      });
      fetchKeywords();
      onRefresh?.();
    }).catch((err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    });
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const cstNow = toZonedTime(now, 'America/Chicago');
    const tomorrow = new Date(cstNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const hours = differenceInHours(tomorrow, cstNow);
    const minutes = differenceInMinutes(tomorrow, cstNow) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getKeywordTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      origin_city: "bg-blue-100 text-blue-700",
      destination_city: "bg-green-100 text-green-700",
      load_number: "bg-purple-100 text-purple-700",
      custom: "bg-slate-100 text-slate-700",
    };
    const labels: Record<string, string> = {
      origin_city: "Origin",
      destination_city: "Dest",
      load_number: "Load #",
      custom: "Custom",
    };
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${colors[type] || colors.custom}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <Card className="p-4 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-slate-900">High Intent Keywords</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Resets in {getTimeUntilReset()}</span>
        </div>
      </div>
      
      <p className="text-xs text-slate-600 mb-3">
        When callers mention these keywords, AI responds: "Congratulations! This is a premium load. 
        Please provide your company name and phone, and one of our dispatchers will call you right back."
      </p>

      {/* Add new keyword */}
      <div className="flex gap-2 mb-3">
        <Select value={keywordType} onValueChange={setKeywordType}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="origin_city">Origin</SelectItem>
            <SelectItem value="destination_city">Dest</SelectItem>
            <SelectItem value="load_number">Load #</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Enter keyword..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          className="flex-1"
        />
        <Button size="sm" onClick={addKeyword} disabled={adding}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick add from loads */}
      {loads.length > 0 && (
        <div className="mb-3">
          <Select value={selectedLoadId} onValueChange={(value) => {
            const load = loads.find(l => l.id === value);
            if (load) addFromLoad(load);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Quick add from load..." />
            </SelectTrigger>
            <SelectContent>
              {loads.slice(0, 10).map((load) => (
                <SelectItem key={load.id} value={load.id}>
                  {load.load_number}: {load.origin_city} → {load.destination_city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Current keywords */}
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : keywords.length === 0 ? (
          <div className="text-sm text-slate-500">No active keywords. Add some to enable premium responses.</div>
        ) : (
          keywords.map((kw) => (
            <Badge 
              key={kw.id} 
              variant="secondary" 
              className="flex items-center gap-1 pr-1 bg-white border"
            >
              {getKeywordTypeBadge(kw.keyword_type)}
              <span className="font-medium">{kw.keyword}</span>
              <button
                onClick={() => removeKeyword(kw.id)}
                className="ml-1 hover:bg-slate-200 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {keywords.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          {keywords.length} active keyword{keywords.length !== 1 ? 's' : ''} • All reset at 12:00 AM CST
        </div>
      )}
    </Card>
  );
}
