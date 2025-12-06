import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { ModuleCenterModal } from "@/components/modules";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  CalendarDays, 
  Clock, 
  Plus,
  Settings,
  Sparkles,
  MoreHorizontal,
  Trash2,
  ChevronDown,
  ChevronRight,
  // Module icons
  Mic,
  Podcast,
  Scissors,
  FileText,
  Mail,
  Megaphone,
  Zap,
  Users,
  CheckSquare,
  FolderOpen,
  Calendar,
  Trophy,
  FormInput,
  Vote,
  Image,
  Shield,
  Layout,
  Wand2,
  BrainCircuit,
  MessageCircle,
  Share2,
  Target,
  DollarSign,
  Clapperboard,
  PieChart,
  BarChart3,
  Instagram,
  Bot,
  CalendarClock,
  Newspaper,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping for modules
const MODULE_ICONS: Record<string, React.ElementType> = {
  'studio': Mic,
  'podcasts': Podcast,
  'clips': Scissors,
  'ai-clips': Scissors,
  'ai-post-production': Wand2,
  'spark-ai': BrainCircuit,
  'blog': FileText,
  'newsletters': Mail,
  'newsletter': Share2,
  'campaigns': Megaphone,
  'automations': Zap,
  'ai-automation': Bot,
  'crm': Users,
  'contacts': Users,
  'segments': Target,
  'tasks': CheckSquare,
  'projects': FolderOpen,
  'project-management': FolderOpen,
  'meetings': CalendarClock,
  'events': Calendar,
  'awards': Trophy,
  'proposals': FileText,
  'deals': DollarSign,
  'forms': FormInput,
  'polls': Vote,
  'media-library': Image,
  'video-editor': Clapperboard,
  'email': Mail,
  'sms': MessageCircle,
  'identity': Shield,
  'identity-verification': Shield,
  'my-page': Layout,
  'settings': Settings,
  'social-analytics': PieChart,
  'audience-insights': BarChart3,
  'social-connect': Instagram,
};

// Module groupings for primary app + associated apps pattern
const MODULE_GROUPS: Record<string, string[]> = {
  'crm': ['contacts', 'project-management', 'tasks', 'meetings', 'proposals', 'email', 'studio'],
  'podcasts': ['studio', 'ai-post-production', 'ai-clips', 'media-library'],
  'studio': ['ai-post-production', 'ai-clips', 'media-library', 'video-editor'],
  'campaigns': ['email', 'sms', 'newsletter', 'automations', 'segments'],
  'events': ['meetings', 'forms', 'polls', 'awards'],
};

interface ModuleRegistryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  scope: string;
  route: string;
  display_order: number;
}

export function WorkspaceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const { currentWorkspace, workspaceModules, removeModule } = useWorkspace();
  const [moduleRegistry, setModuleRegistry] = useState<ModuleRegistryItem[]>([]);
  const [showModuleCenter, setShowModuleCenter] = useState(false);
  const [removingModule, setRemovingModule] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch module registry
  useEffect(() => {
    const fetchRegistry = async () => {
      const { data } = await supabase
        .from('module_registry')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) {
        setModuleRegistry(data);
      }
    };
    fetchRegistry();
  }, []);

  const isCollapsed = state === 'collapsed';

  // Get modules for current workspace, organized with groups
  const { primaryModules, groupedModules, standaloneModules } = useMemo(() => {
    const moduleIds = workspaceModules.map(wm => wm.module_id);
    const modules = workspaceModules
      .sort((a, b) => a.position - b.position)
      .map(wm => moduleRegistry.find(mr => mr.id === wm.module_id))
      .filter(Boolean) as ModuleRegistryItem[];

    // Find primary modules (ones that have associated modules also in workspace)
    const primaries: ModuleRegistryItem[] = [];
    const grouped: Map<string, ModuleRegistryItem[]> = new Map();
    const standalone: ModuleRegistryItem[] = [];
    const usedIds = new Set<string>();

    // First pass: identify primary modules
    for (const module of modules) {
      const associatedIds = MODULE_GROUPS[module.id];
      if (associatedIds) {
        const presentAssociated = associatedIds.filter(id => 
          moduleIds.includes(id) && id !== module.id
        );
        if (presentAssociated.length > 0) {
          primaries.push(module);
          usedIds.add(module.id);
          
          const associatedModules = presentAssociated
            .map(id => modules.find(m => m.id === id))
            .filter(Boolean) as ModuleRegistryItem[];
          
          grouped.set(module.id, associatedModules);
          associatedModules.forEach(m => usedIds.add(m.id));
        }
      }
    }

    // Second pass: standalone modules
    for (const module of modules) {
      if (!usedIds.has(module.id)) {
        standalone.push(module);
      }
    }

    return { primaryModules: primaries, groupedModules: grouped, standaloneModules: standalone };
  }, [workspaceModules, moduleRegistry]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleRemoveModule = async (moduleId: string, moduleName: string) => {
    setRemovingModule(moduleId);
    try {
      await removeModule(moduleId);
      toast.success("Module removed", {
        description: `${moduleName} has been removed from this workspace.`,
      });
    } catch (error) {
      toast.error("Failed to remove module");
    } finally {
      setRemovingModule(null);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderModuleItem = (module: ModuleRegistryItem, indented = false) => {
    const Icon = MODULE_ICONS[module.id] || FolderOpen;
    return (
      <SidebarMenuItem key={module.id} className="group/item relative">
        <SidebarMenuButton
          onClick={() => module.route && navigate(module.route)}
          isActive={module.route ? isActive(module.route) : false}
          tooltip={module.name}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent pr-8",
            indented && "pl-7"
          )}
        >
          <Icon className="h-4 w-4" />
          {!isCollapsed && <span>{module.name}</span>}
        </SidebarMenuButton>
        
        {/* Module overflow menu */}
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-popover border shadow-lg z-50">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveModule(module.id, module.name);
                }}
                className="text-destructive focus:text-destructive"
                disabled={removingModule === module.id}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <Sidebar 
        className="border-r border-sidebar-border" 
        collapsible="icon"
      >
        <SidebarHeader className="p-3 pb-2">
          {/* Workspace Selector at top - Monday style */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <WorkspaceSelector />
            </div>
            {!isCollapsed && (
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
                onClick={() => setShowModuleCenter(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Global Navigation - Monday style */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/my-day')}
                isActive={isActive('/my-day')}
                tooltip="My Day"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <CalendarDays className="h-4 w-4" />
                {!isCollapsed && <span>My Day</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/recents')}
                isActive={isActive('/recents')}
                tooltip="Recents"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Clock className="h-4 w-4" />
                {!isCollapsed && <span>Recents</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="flex-1">
            <Separator className="my-1 bg-sidebar-border" />

            {/* Modules Section Header */}
            <div className="px-3 py-2">
              {!isCollapsed && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-sidebar-foreground/70">
                    Modules
                  </span>
                </div>
              )}
            </div>

            {/* Workspace Modules */}
            {currentWorkspace && (
              <div className="px-3 py-1">
                <SidebarMenu>
                  {/* Primary modules with groups */}
                  {primaryModules.map((primary) => {
                    const Icon = MODULE_ICONS[primary.id] || FolderOpen;
                    const associated = groupedModules.get(primary.id) || [];
                    const isExpanded = expandedGroups.has(primary.id);
                    
                    return (
                      <Collapsible
                        key={primary.id}
                        open={isExpanded}
                        onOpenChange={() => toggleGroup(primary.id)}
                      >
                        <SidebarMenuItem className="group/item relative">
                          <div className="flex items-center w-full">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 mr-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-transparent"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <SidebarMenuButton
                              onClick={() => primary.route && navigate(primary.route)}
                              isActive={primary.route ? isActive(primary.route) : false}
                              tooltip={primary.name}
                              className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent pr-8"
                            >
                              <Icon className="h-4 w-4" />
                              {!isCollapsed && <span className="font-medium">{primary.name}</span>}
                            </SidebarMenuButton>
                          </div>
                          
                          {/* Module overflow menu */}
                          {!isCollapsed && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-popover border shadow-lg z-50">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveModule(primary.id, primary.name);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                  disabled={removingModule === primary.id}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove from workspace
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </SidebarMenuItem>
                        
                        <CollapsibleContent>
                          {associated.map(module => renderModuleItem(module, true))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}

                  {/* Standalone modules */}
                  {standaloneModules.map(module => renderModuleItem(module))}
                  
                  {/* Add Module Button */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowModuleCenter(true)}
                      tooltip="Add module"
                      className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <Plus className="h-4 w-4" />
                      {!isCollapsed && <span>Add module</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {!currentWorkspace && !isCollapsed && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-sidebar-foreground/70 mb-2">
                  No workspace selected
                </p>
                <p className="text-xs text-sidebar-foreground/50 mb-4">
                  Select or create a workspace to get started.
                </p>
              </div>
            )}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setShowModuleCenter(true)}
                tooltip="App Store"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Sparkles className="h-4 w-4" />
                {!isCollapsed && <span>App Store</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/settings')}
                isActive={isActive('/settings')}
                tooltip="Settings"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span>Settings</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Module Center Modal */}
      <ModuleCenterModal 
        isOpen={showModuleCenter} 
        onClose={() => setShowModuleCenter(false)} 
      />
    </>
  );
}
