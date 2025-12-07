import { useState } from "react";
import { X, Search, Layers, Puzzle, ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEEKSY_COLLECTIONS, type SeeksyCollection } from "@/components/modules/collectionData";
import { SEEKSY_MODULES, type SeeksyModule } from "@/components/modules/moduleData";
import { toast } from "sonner";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
}

type Step = "name" | "choose" | "collections" | "apps";

export function CreateWorkspaceModal({ isOpen, onClose, onCreated }: CreateWorkspaceModalProps) {
  const { createWorkspace, setCurrentWorkspace } = useWorkspace();
  const [step, setStep] = useState<Step>("name");
  const [workspaceName, setWorkspaceName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<SeeksyCollection | null>(null);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const resetState = () => {
    setStep("name");
    setWorkspaceName("");
    setSearchQuery("");
    setSelectedCollection(null);
    setSelectedApps(new Set());
    setIsCreating(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    if (step === "name") {
      if (!workspaceName.trim()) {
        toast.error("Please enter a workspace name");
        return;
      }
      setStep("choose");
    }
  };

  const handleBack = () => {
    if (step === "choose") setStep("name");
    if (step === "collections" || step === "apps") setStep("choose");
  };

  const handleCreate = async () => {
    if (!workspaceName.trim()) return;

    setIsCreating(true);
    try {
      let modulesToAdd: string[] = [];
      
      if (selectedCollection) {
        modulesToAdd = selectedCollection.includedApps;
      } else if (selectedApps.size > 0) {
        modulesToAdd = Array.from(selectedApps);
      }

      const workspace = await createWorkspace(workspaceName, modulesToAdd);
      if (workspace) {
        setCurrentWorkspace(workspace);
        toast.success(`Workspace "${workspaceName}" created!`);
        onCreated?.(workspace.id);
        handleClose();
      }
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleApp = (appId: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const filteredCollections = SEEKSY_COLLECTIONS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApps = SEEKSY_MODULES.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create New Workspace</h2>
              <p className="text-xs text-muted-foreground">
                {step === "name" && "Give your workspace a name"}
                {step === "choose" && "Choose how to start"}
                {step === "collections" && "Pick a collection"}
                {step === "apps" && "Select apps to add"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Step: Name */}
        {step === "name" && (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Podcast Studio"
                className="mt-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
          </div>
        )}

        {/* Step: Choose Collections or Apps */}
        {step === "choose" && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep("collections")}
                className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Start from Collection</h3>
                <p className="text-sm text-muted-foreground">
                  Pre-built bundles with curated apps for specific workflows
                </p>
                <div className="flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                  Browse collections <ChevronRight className="h-4 w-4" />
                </div>
              </button>

              <button
                onClick={() => setStep("apps")}
                className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                  <Puzzle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Start from Apps</h3>
                <p className="text-sm text-muted-foreground">
                  Pick individual apps to build your custom workspace
                </p>
                <div className="flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                  Browse apps <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            </div>

            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => handleCreate()} className="text-muted-foreground">
                Skip — Start with blank workspace
              </Button>
            </div>
          </div>
        )}

        {/* Step: Collections */}
        {step === "collections" && (
          <div className="flex flex-col h-[60vh]">
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredCollections.map((collection) => {
                  const Icon = collection.icon;
                  const isSelected = selectedCollection?.id === collection.id;
                  return (
                    <button
                      key={collection.id}
                      onClick={() => setSelectedCollection(isSelected ? null : collection)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${collection.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: collection.color }} />
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm">{collection.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        {collection.includedApps.length} apps
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step: Apps */}
        {step === "apps" && (
          <div className="flex flex-col h-[60vh]">
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedApps.size > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedApps.size} app{selectedApps.size > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-3 gap-3">
                {filteredApps.map((app) => {
                  const isSelected = selectedApps.has(app.id);
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => toggleApp(app.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            app.iconBg || "bg-primary/10"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", app.iconColor || "text-primary")} />
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                      <h4 className="font-medium text-xs truncate">{app.name}</h4>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            onClick={step === "name" ? handleClose : handleBack}
          >
            {step === "name" ? "Cancel" : "Back"}
          </Button>
          
          {step === "name" && (
            <Button onClick={handleNext}>
              Continue
            </Button>
          )}
          
          {(step === "collections" || step === "apps") && (
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Workspace"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
