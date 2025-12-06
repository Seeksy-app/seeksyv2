import { useState, useMemo, useEffect } from "react";
import { X, Search, Sparkles, ArrowUpDown, ChevronRight, Star, User, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { MODULE_CATEGORIES, SEEKSY_MODULES, type SeeksyModule } from "./moduleData";
import { ModuleCard } from "./ModuleCard";
import { ModuleDetailDrawer } from "./ModuleDetailDrawer";
import { toast } from "sonner";
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
  { id: "all" as FilterTab, label: "All templates", icon: Layers },
  { id: "recommended" as FilterTab, label: "Recommended for you", icon: Star },
  { id: "seeksy" as FilterTab, label: "Created by Seeksy", icon: Sparkles },
  { id: "custom" as FilterTab, label: "Created by me", icon: User },
];

export function ModuleCenterModal({ isOpen, onClose }: ModuleCenterModalProps) {
  const navigate = useNavigate();
  const { currentWorkspace, workspaceModules, addModule } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [installingModules, setInstallingModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<SeeksyModule | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  // Get installed module IDs for current workspace
  const installedModuleIds = useMemo(() => {
    return new Set(workspaceModules.map(wm => wm.module_id));
  }, [workspaceModules]);

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
      result = result.filter(m => m.isNew || m.isAIPowered);
    }
    
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "popular") {
      // Sort AI-powered and new modules first
      result.sort((a, b) => {
        const aScore = (a.isAIPowered ? 2 : 0) + (a.isNew ? 1 : 0);
        const bScore = (b.isAIPowered ? 2 : 0) + (b.isNew ? 1 : 0);
        return bScore - aScore;
      });
    } else if (sortBy === "newest") {
      result = result.filter(m => m.isNew).concat(result.filter(m => !m.isNew));
    }
    
    return result;
  }, [searchQuery, activeCategory, activeFilter, sortBy]);

  const handleInstallModule = async (module: SeeksyModule) => {
    if (!currentWorkspace) {
      toast.error("No workspace selected", {
        description: "Please select or create a workspace first.",
      });
      return;
    }

    if (installedModuleIds.has(module.id)) {
      toast.info("Already added", {
        description: `${module.name} is already in your workspace.`,
      });
      return;
    }

    setInstallingModules(prev => new Set(prev).add(module.id));
    
    try {
      await addModule(module.id);
      toast.success("Module added!", {
        description: `${module.name} has been added to ${currentWorkspace.name}.`,
      });
    } catch (error) {
      toast.error("Failed to add module", {
        description: "Please try again.",
      });
    } finally {
      setInstallingModules(prev => {
        const next = new Set(prev);
        next.delete(module.id);
        return next;
      });
    }
  };

  const handleOpenModule = (module: SeeksyModule) => {
    if (module.route) {
      navigate(module.route);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedCategoryLabel = activeCategory 
    ? MODULE_CATEGORIES.find(c => c.id === activeCategory)?.name 
    : "All Modules";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[96vw] h-[94vh] max-w-[1500px] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Module Center</h1>
              <p className="text-xs text-muted-foreground">
                {currentWorkspace ? `Adding to: ${currentWorkspace.name}` : 'Select a workspace to add modules'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border/50 focus:border-primary/50"
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted h-10 w-10"
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
                {/* Template Groups Header */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Template Groups
                  </p>
                  {filterTabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveFilter(tab.id);
                          setActiveCategory(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2.5",
                          activeFilter === tab.id && !activeCategory
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <TabIcon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Categories */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    General Templates
                  </p>
                  {MODULE_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(activeCategory === category.id ? null : category.id);
                        setActiveFilter("all");
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center justify-between group",
                        activeCategory === category.id
                          ? "bg-primary/10 text-primary font-medium"
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
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-primary">Seeksy Modules</span>
                <span className="text-muted-foreground">›</span>
                <span className="text-muted-foreground">{selectedCategoryLabel}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filteredModules.length} modules
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort: {sortBy === "default" ? "Default" : sortBy === "name" ? "Name" : sortBy === "popular" ? "Popular" : "Newest"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {filteredModules.map((module) => (
                    <ModuleCard 
                      key={module.id} 
                      module={module}
                      isInstalled={installedModuleIds.has(module.id)}
                      isInstalling={installingModules.has(module.id)}
                      onInstall={() => handleInstallModule(module)}
                      onOpen={() => handleOpenModule(module)}
                      onBadgeClick={(integrationId) => {
                        const integrationModule = SEEKSY_MODULES.find(m => m.id === integrationId);
                        if (integrationModule) {
                          setSelectedModule(integrationModule);
                          setShowDetailDrawer(true);
                        }
                      }}
                      onCardClick={() => {
                        setSelectedModule(module);
                        setShowDetailDrawer(true);
                      }}
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
      
      {/* Module Detail Drawer */}
      <ModuleDetailDrawer
        module={selectedModule}
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedModule(null);
        }}
        isInstalled={selectedModule ? installedModuleIds.has(selectedModule.id) : false}
        isInstalling={selectedModule ? installingModules.has(selectedModule.id) : false}
        onInstall={() => {
          if (selectedModule) {
            handleInstallModule(selectedModule);
          }
        }}
        onOpen={() => {
          if (selectedModule) {
            handleOpenModule(selectedModule);
            setShowDetailDrawer(false);
          }
        }}
      />
    </div>
  );
}
