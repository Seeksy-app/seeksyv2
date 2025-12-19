import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Search, Sparkles, Grid3X3, Layers, Package, 
  ChevronRight, Filter, SortAsc, ArrowRight,
  Mic, Scissors, Calendar, Megaphone, Users, Shield, 
  BrainCircuit, Check, Plus, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePortal } from "@/contexts/PortalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useModuleActivation } from "@/hooks/useModuleActivation";

// New components
import { SparkOnboardingGuide } from "@/components/apps/SparkOnboardingGuide";
import { AnimatedCollectionCard } from "@/components/apps/AnimatedCollectionCard";
import { ModuleRelationshipGraph } from "@/components/apps/ModuleRelationshipGraph";
import { IntentConfirmationModal } from "@/components/apps/IntentConfirmationModal";
import { CollectionPreviewModal } from "@/components/apps/CollectionPreviewModal";

// Data
import { SEEKSY_COLLECTIONS, SeeksyCollection } from "@/components/modules/collectionData";
import { SEEKSY_MODULES, SeeksyModule, MODULE_CATEGORIES } from "@/components/modules/moduleData";
import { UserIntent, getRequiredModules } from "@/config/moduleRelationships";

type ViewMode = "spark" | "collections" | "modules";

export default function AppsRedesigned() {
  const navigate = useNavigate();
  const { effectivePortal } = usePortal();
  const { installedModuleIds } = useWorkspace();
  const { activateModule } = useModuleActivation();
  
  const [viewMode, setViewMode] = useState<ViewMode>("spark");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  
  // Modals
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  const [intentModalOpen, setIntentModalOpen] = useState(false);
  const [previewCollection, setPreviewCollection] = useState<SeeksyCollection | null>(null);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return SEEKSY_MODULES.filter(module => {
      const matchesSearch = !searchQuery || 
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    return SEEKSY_COLLECTIONS.filter(collection => {
      return !searchQuery || 
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const handleIntentSelect = (intent: UserIntent) => {
    setSelectedIntent(intent);
    setIntentModalOpen(true);
  };

  const handleIntentConfirm = async (moduleIds: string[]) => {
    for (const moduleId of moduleIds) {
      await activateModule(moduleId);
    }
    setIntentModalOpen(false);
    navigate("/");
  };

  const handleInstallModule = async (moduleId: string) => {
    // Check for required dependencies
    const required = getRequiredModules(moduleId);
    const missingRequired = required.filter(r => !installedModuleIds.includes(r.moduleId));
    
    // Install required first
    for (const req of missingRequired) {
      await activateModule(req.moduleId);
    }
    
    // Then install the module
    await activateModule(moduleId);
  };

  const handleInstallCollection = async (collection: SeeksyCollection) => {
    for (const moduleId of collection.includedApps) {
      if (!installedModuleIds.includes(moduleId)) {
        await activateModule(moduleId);
      }
    }
  };

  const isCollectionInstalled = (collection: SeeksyCollection) => {
    return collection.includedApps.every(id => installedModuleIds.includes(id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Add Seekies to your workspace
          </h1>
          <p className="text-muted-foreground">
            Build your perfect creator toolkit with AI-powered modules
          </p>
        </motion.div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="spark" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Guide
              </TabsTrigger>
              <TabsTrigger value="collections" className="gap-2">
                <Layers className="w-4 h-4" />
                Collections
              </TabsTrigger>
              <TabsTrigger value="modules" className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                All Modules
              </TabsTrigger>
            </TabsList>

            {/* Search - only show for collections/modules */}
            {viewMode !== "spark" && (
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Spark AI Guide */}
          <TabsContent value="spark" className="mt-8">
            <Card className="p-8 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-rose-50/50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-rose-950/20 border-amber-200/50 dark:border-amber-800/30">
              <SparkOnboardingGuide
                onSelectIntent={handleIntentSelect}
                onSkip={() => setViewMode("collections")}
                installedModuleIds={installedModuleIds}
              />
            </Card>
          </TabsContent>

          {/* Collections */}
          <TabsContent value="collections" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AnimatedCollectionCard
                    collection={collection}
                    isInstalled={isCollectionInstalled(collection)}
                    onPreview={() => setPreviewCollection(collection)}
                    onInstall={() => handleInstallCollection(collection)}
                  />
                </motion.div>
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">No collections found</h3>
                <p className="text-muted-foreground text-sm">
                  Try a different search term
                </p>
              </div>
            )}
          </TabsContent>

          {/* All Modules */}
          <TabsContent value="modules" className="mt-8">
            <div className="flex gap-8">
              {/* Module Grid */}
              <div className="flex-1">
                {/* Category Filter */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </Button>
                  {MODULE_CATEGORIES.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="whitespace-nowrap"
                    >
                      {category.name}
                      {category.isNew && (
                        <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Module Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredModules.map((module, index) => {
                    const Icon = module.icon;
                    const isInstalled = installedModuleIds.includes(module.id);
                    const isSelected = selectedModuleId === module.id;

                    return (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card
                          className={cn(
                            "p-4 cursor-pointer transition-all duration-200",
                            "border-2 hover:shadow-md",
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border/50 hover:border-primary/50",
                            isInstalled && "ring-2 ring-emerald-500/20"
                          )}
                          onClick={() => setSelectedModuleId(module.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                              module.bgGradient || "bg-muted"
                            )}>
                              <Icon className={cn("w-6 h-6", module.iconColor || "text-foreground")} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-foreground">{module.name}</span>
                                {isInstalled && (
                                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                                    <Check className="w-3 h-3 mr-1" /> Installed
                                  </Badge>
                                )}
                                {module.isNew && (
                                  <Badge className="text-xs">New</Badge>
                                )}
                                {module.isAIPowered && (
                                  <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                    <Sparkles className="w-3 h-3 mr-1" /> AI
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {module.description}
                              </p>
                            </div>

                            {!isInstalled && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstallModule(module.id);
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredModules.length === 0 && (
                  <div className="text-center py-12">
                    <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold text-foreground mb-2">No modules found</h3>
                    <p className="text-muted-foreground text-sm">
                      Try a different search or category
                    </p>
                  </div>
                )}
              </div>

              {/* Relationship Graph Sidebar */}
              <div className="hidden lg:block w-80 shrink-0">
                <div className="sticky top-4">
                  <ModuleRelationshipGraph
                    selectedModuleId={selectedModuleId}
                    installedModuleIds={installedModuleIds}
                    onSelectModule={setSelectedModuleId}
                    onInstallModule={handleInstallModule}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Installed Count Footer */}
        {installedModuleIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="px-6 py-3 shadow-xl border-primary/20 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-foreground">
                    {installedModuleIds.length} module{installedModuleIds.length !== 1 ? 's' : ''} installed
                  </span>
                </div>
                <Button onClick={() => navigate("/")} className="gap-2">
                  Go to My Day
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <IntentConfirmationModal
        isOpen={intentModalOpen}
        onClose={() => setIntentModalOpen(false)}
        intent={selectedIntent}
        installedModuleIds={installedModuleIds}
        onConfirm={handleIntentConfirm}
      />

      <CollectionPreviewModal
        isOpen={!!previewCollection}
        onClose={() => setPreviewCollection(null)}
        collection={previewCollection}
        installedModuleIds={installedModuleIds}
        onInstall={() => previewCollection && handleInstallCollection(previewCollection)}
      />
    </div>
  );
}
