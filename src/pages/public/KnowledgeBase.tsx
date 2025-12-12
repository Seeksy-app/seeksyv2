import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Rocket, 
  Mic, 
  Shield, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  CreditCard, 
  Plug,
  ArrowRight,
  BookOpen,
  HelpCircle
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Mic,
  Shield,
  DollarSign,
  Calendar,
  Sparkles,
  CreditCard,
  Plug,
  HelpCircle,
  BookOpen,
};

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["kb-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: featuredArticles = [] } = useQuery({
    queryKey: ["kb-featured-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*, kb_categories(name, slug)")
        .eq("is_published", true)
        .eq("is_featured", true)
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["kb-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*, kb_categories(name, slug)")
        .eq("is_published", true)
        .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length > 2,
  });

  const quickSearches = ["Studio", "Monetization", "Voice Certification", "AI Clips"];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Subtle gradient */}
      <div className="bg-gradient-to-b from-muted to-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              How can we <span className="text-primary">help you?</span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Search our knowledge base to find answers to your questions
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search our knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-background text-foreground border shadow-lg"
            />
          </div>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {quickSearches.map((term) => (
              <Badge
                key={term}
                variant="outline"
                className="cursor-pointer border-primary/30 text-primary hover:bg-primary/10 px-4 py-1.5"
                onClick={() => setSearchQuery(term)}
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.length > 2 && searchResults.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="grid gap-4">
            {searchResults.map((article: any) => (
              <Card 
                key={article.id} 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
                onClick={() => navigate(`/kb/${article.kb_categories?.slug}/${article.slug}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">{article.kb_categories?.name}</Badge>
                    <h3 className="font-semibold">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Explore by Topic Section */}
      <div className="bg-[hsl(220,85%,55%)] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Explore by topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: any) => {
              const IconComponent = iconMap[category.icon] || HelpCircle;
              return (
                <Card 
                  key={category.id}
                  className="bg-white cursor-pointer hover:shadow-xl transition-all group"
                  onClick={() => navigate(`/kb/${category.slug}`)}
                >
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <IconComponent className="h-8 w-8 text-[hsl(220,85%,55%)]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[hsl(220,85%,55%)] transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {category.description}
                    </p>
                    <span className="text-sm font-medium text-[hsl(220,85%,55%)] flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Articles Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Popular articles</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {featuredArticles.map((article: any) => {
            const category = categories.find((c: any) => c.id === article.category_id);
            const IconComponent = category ? iconMap[category.icon] || HelpCircle : HelpCircle;
            return (
              <Card 
                key={article.id}
                className="bg-[hsl(213,92%,24%)] text-white cursor-pointer hover:bg-[hsl(213,92%,28%)] transition-all group"
                onClick={() => navigate(`/kb/${article.kb_categories?.slug}/${article.slug}`)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <IconComponent className="h-8 w-8 text-white/80 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-medium text-sm leading-tight">
                    {article.title}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Support CTA */}
      <div className="bg-muted/50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-4">Our support team is here to help</p>
          <button 
            onClick={() => navigate("/support")}
            className="bg-[hsl(220,85%,55%)] hover:bg-[hsl(220,85%,50%)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
