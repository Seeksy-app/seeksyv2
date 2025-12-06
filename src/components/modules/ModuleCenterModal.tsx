import { useState, useMemo, useEffect } from "react";
import { X, Search, Download, Sparkles, ArrowUpDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { MODULE_CATEGORIES, SEEKSY_MODULES, type SeeksyModule } from "./moduleData";
import { ModuleCard } from "./ModuleCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModuleCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = "all" | "recommended" | "seeksy" | "custom";
type SortOption = "default" | "name" | "popular" | "newest";

const filterTabs = [
  { id: "all" as FilterTab, label: "All templates" },
  { id: "recommended" as FilterTab, label: "Recommended for you" },
  { id: "seeksy" as FilterTab, label: "Created by Seeksy" },
  { id: "custom" as FilterTab, label: "Created by me" },
];

export function ModuleCenterModal({ isOpen, onClose }: ModuleCenterModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const { activateModule } = useModuleActivation();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const filteredModules = useMemo(() => {
    let result = [...SEEKSY_MODULES];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        m => m.name.toLowerCase().includes(query) || 
             m.description.toLowerCase().includes(query)
      );
    }
    
    if (activeCategory) {
      result = result.filter(m => m.category === activeCategory);
    }
    
    if (activeFilter === "recommended") {
      result = result.filter(m => (m.downloads || 0) > 50000);
    }
    
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sortBy === "newest") {
      result = result.filter(m => m.isNew).concat(result.filter(m => !m.isNew));
    }
    
    return result;
  }, [searchQuery, activeCategory, activeFilter, sortBy]);

  const handleModuleClick = (module: SeeksyModule) => {
    if (module.route) {
      navigate(module.route);
      onClose();
    } else {
      activateModule(module.id);
    }
  };

  if (!isOpen) return null;

  const selectedCategoryLabel = activeCategory 
    ? MODULE_CATEGORIES.find(c => c.id === activeCategory)?.name 
    : "Product templates";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[95vw] h-[90vh] max-w-[1400px] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl">
              <span className="font-bold">Module</span>{" "}
              <span className="font-normal text-muted-foreground">center</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by module name, creator or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50"
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Categories */}
          <div className="w-64 border-r border-border/50 flex flex-col bg-muted/20">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Active Category Header */}
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                    !activeCategory 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">seeksy modules</span>
                </button>
                
                {/* Filter Tabs */}
                <div className="space-y-0.5">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                        activeFilter === tab.id
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                {/* Categories */}
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    General templates
                  </p>
                  {MODULE_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(
                        activeCategory === category.id ? null : category.id
                      )}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group",
                        activeCategory === category.id
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {category.name}
                        {category.isNew && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-0">
                            New
                          </Badge>
                        )}
                      </span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity",
                        activeCategory === category.id && "opacity-100"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Breadcrumb & Sort */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-background">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">seeksy modules</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{selectedCategoryLabel}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort by: {sortBy === "default" ? "Default" : sortBy === "name" ? "Name" : sortBy === "popular" ? "Popular" : "Newest"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-[110]">
                  <DropdownMenuItem onClick={() => setSortBy("default")}>Default</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("popular")}>Most Popular</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Module Grid */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredModules.map((module) => (
                    <ModuleCard 
                      key={module.id} 
                      module={module}
                      onClick={() => handleModuleClick(module)}
                    />
                  ))}
                </div>
                
                {filteredModules.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No modules found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
