import { useState } from "react";
import { useWorkspace, Workspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ChevronDown, 
  Search, 
  Plus, 
  Settings, 
  Check,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WORKSPACE_TEMPLATES = [
  {
    id: "podcast",
    name: "Podcast Workspace",
    description: "For podcast creators",
    modules: ["studio", "podcasts", "clips", "ai-post-production", "media-library", "blog"],
    color: "#8B5CF6",
  },
  {
    id: "creator",
    name: "Creator Workspace",
    description: "For content creators",
    modules: ["studio", "clips", "media-library", "my-page", "campaigns", "contacts"],
    color: "#F59E0B",
  },
  {
    id: "business",
    name: "Business Workspace",
    description: "For client services",
    modules: ["crm", "projects", "tasks", "meetings", "proposals", "email"],
    color: "#10B981",
  },
  {
    id: "blank",
    name: "Blank Workspace",
    description: "Start from scratch",
    modules: [],
    color: "#6B7280",
  },
];

export function WorkspaceSelector() {
  const { 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspace, 
    createWorkspace,
    updateWorkspace,
    deleteWorkspace 
  } = useWorkspace();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    const template = WORKSPACE_TEMPLATES.find(t => t.id === selectedTemplate);
    const workspace = await createWorkspace(
      newWorkspaceName,
      template?.modules || []
    );

    if (workspace) {
      setCurrentWorkspace(workspace);
      toast.success(`Workspace "${newWorkspaceName}" created`);
    }

    setShowCreateDialog(false);
    setNewWorkspaceName("");
    setSelectedTemplate(null);
  };

  const handleRenameWorkspace = async () => {
    if (!workspaceToEdit || !newWorkspaceName.trim()) return;

    await updateWorkspace(workspaceToEdit.id, { name: newWorkspaceName });
    toast.success("Workspace renamed");
    setShowRenameDialog(false);
    setNewWorkspaceName("");
    setWorkspaceToEdit(null);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToEdit) return;

    await deleteWorkspace(workspaceToEdit.id);
    toast.success("Workspace deleted");
    setShowDeleteDialog(false);
    setWorkspaceToEdit(null);
  };

  const handleSetDefault = async (workspace: Workspace) => {
    await updateWorkspace(workspace.id, { is_default: true });
    toast.success(`"${workspace.name}" is now your default workspace`);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between gap-2 px-3 py-2 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: currentWorkspace?.icon_color || '#2C6BED' }}
              >
                {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
              </div>
              <span className="font-medium truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          className="w-72 bg-popover border shadow-lg z-50"
          sideOffset={4}
        >
          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a workspace"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Workspaces list */}
          <div className="max-h-64 overflow-y-auto py-1">
            <div className="px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">My workspaces</span>
            </div>
            
            {filteredWorkspaces.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No workspaces found
              </div>
            ) : (
              filteredWorkspaces.map((workspace) => (
                <div key={workspace.id} className="group relative">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 cursor-pointer",
                      currentWorkspace?.id === workspace.id && "bg-primary/10"
                    )}
                    onClick={() => {
                      setCurrentWorkspace(workspace);
                      setIsOpen(false);
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: workspace.icon_color }}
                    >
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{workspace.name}</span>
                    {workspace.is_default && (
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                    {currentWorkspace?.id === workspace.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  
                  {/* Workspace actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover border shadow-lg z-50">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToEdit(workspace);
                          setNewWorkspaceName(workspace.name);
                          setShowRenameDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {!workspace.is_default && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(workspace);
                          }}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Set as default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToEdit(workspace);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Actions */}
          <DropdownMenuItem 
            onClick={() => {
              setShowCreateDialog(true);
              setIsOpen(false);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add workspace
          </DropdownMenuItem>
          
          <DropdownMenuItem className="gap-2">
            <Layers className="h-4 w-4" />
            Browse all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new workspace</DialogTitle>
            <DialogDescription>
              Choose a template or start from scratch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Workspace name</label>
              <Input
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="My new workspace"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Choose a template</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {WORKSPACE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-colors",
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-md mb-2"
                      style={{ backgroundColor: template.color }}
                    />
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace}>
              Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename workspace</DialogTitle>
          </DialogHeader>
          <Input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameWorkspace}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workspaceToEdit?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkspace}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
