import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePortal } from "@/contexts/PortalContext";
import { trackModuleOpened } from "@/utils/gtm";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { MoveToSectionMenu } from "./MoveToSectionMenu";
import { AddNewDropdown } from "./AddNewDropdown";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { ModuleCenterModal, SEEKSY_MODULES } from "@/components/modules";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SparkIcon } from "@/components/spark/SparkIcon";
import { 
  CalendarDays, 
  Clock, 
  Plus,
  Settings,
  MoreHorizontal,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Star,
  GripVertical,
  HelpCircle,
  Mail,
  Sliders,
  // Module icons
  Mic,
  Podcast,
  Scissors,
  FileText,
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
  Building2,
  Copy,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useModuleGroups } from "@/hooks/useModuleGroups";
import { useQueryClient } from "@tanstack/react-query";
import { useHelpMenuActions } from "@/hooks/useHelpDrawer";

// Icon mapping for modules - ensure correct icons for each module
const MODULE_ICONS: Record<string, React.ElementType> = {
  'studio': Mic,
  'podcasts': Podcast,
  'clips': Scissors,
  'ai-clips': Scissors,
  'ai-post-production': Wand2,
  'spark-ai': BrainCircuit,
  'ai-agent': BrainCircuit,
  'blog': Newspaper,
  'newsletters': Mail,
  'newsletter': Mail,
  'campaigns': Megaphone, // Marketing campaigns - NOT email
  'email-signatures': Mail,
  'signatures': Mail,
  'automations': Zap,
  'ai-automation': Bot,
  'crm': Building2,
  'contacts': Users,
  'segments': Target,
  'tasks': CheckSquare,
  'projects': FolderOpen,
  'project-management': FolderOpen,
  'meetings': CalendarClock,
  'events': Calendar, // Events - calendar icon
  'awards': Trophy,
  'proposals': FileText,
  'deals': DollarSign,
  'forms': FormInput,
  'polls': Vote,
  'media-library': Image,
  'video-editor': Clapperboard,
  'email': Mail, // Email inbox
  'sms': MessageCircle,
  'identity': Shield,
  'identity-verification': Shield,
  'my-page': Layout,
  'settings': Settings,
  'social-analytics': PieChart,
  'audience-insights': BarChart3,
  'social-connect': Instagram,
  'cloning': Copy,
  'podcast-rss': Podcast,
  'podcast-hosting': Podcast,
  'podcast-agent': Bot,
};

// Fallback module groupings (used when DB config is loading or empty)
// Each primary module acts as a collapsible group header
const MODULE_GROUPS: Record<string, { name: string; modules: string[] }> = {
  'studio': { 
    name: 'Production',
    modules: ['ai-clips', 'ai-post-production', 'media-library', 'video-editor', 'cloning'] 
  },
  'podcasts': { 
    name: 'Podcasting',
    modules: ['podcast-rss', 'podcast-hosting'] 
  },
  'campaigns': { 
    name: 'Marketing', // Marketing hub - NOT email
    modules: ['newsletters', 'automations', 'blog'] 
  },
  'events': { 
    name: 'Events & Meetings',
    modules: ['meetings', 'forms', 'polls', 'awards'] 
  },
  'crm': { 
    name: 'CRM & Business',
    modules: ['contacts', 'projects', 'tasks', 'proposals'] 
  },
  'email': {
    name: 'Email',
    modules: []
  },
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
  const { state, toggleSidebar } = useSidebar();
  const { portal } = usePortal();
  const { currentWorkspace, workspaceModules, removeModule, toggleStandalone, togglePinned } = useWorkspace();
  const [moduleRegistry, setModuleRegistry] = useState<ModuleRegistryItem[]>([]);
  const [showModuleCenter, setShowModuleCenter] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [moduleCenterDefaultToApps, setModuleCenterDefaultToApps] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [contextMenuModule, setContextMenuModule] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [removingModule, setRemovingModule] = useState<string | null>(null);
  const [, setForceUpdate] = useState(0);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Effect to re-render when sidebar collapses/expands
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [state]);

  // Fetch module registry from database and merge with SEEKSY_MODULES for comprehensive coverage
  useEffect(() => {
    const fetchModuleRegistry = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('name, display_name, description, icon, route, is_active')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching module registry:', error);
        }

        // Start with SEEKSY_MODULES as the comprehensive base
        const moduleDataRegistry: ModuleRegistryItem[] = SEEKSY_MODULES.map((m, idx) => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          icon: m.icon?.name || 'default',
          category: m.category || 'general',
          scope: 'workspace',
          route: m.route || `/${m.id}`,
          display_order: idx,
        }));

        // Merge with DB data (DB takes precedence for name/description/route)
        if (data && data.length > 0) {
          const dbModuleMap = new Map(data.map(m => [m.name, m]));
          
          const mergedRegistry = moduleDataRegistry.map(module => {
            const dbModule = dbModuleMap.get(module.id);
            if (dbModule) {
              return {
                ...module,
                name: dbModule.display_name || module.name,
                description: dbModule.description || module.description,
                route: dbModule.route || module.route,
                icon: dbModule.icon || module.icon,
              };
            }
            return module;
          });

          // Add any DB modules not in SEEKSY_MODULES
          data.forEach(m => {
            if (!mergedRegistry.find(mr => mr.id === m.name)) {
              mergedRegistry.push({
                id: m.name,
                name: m.display_name || m.name,
                description: m.description || '',
                icon: m.icon || 'default',
                category: 'general',
                scope: 'workspace',
                route: m.route || `/${m.name}`,
                display_order: mergedRegistry.length,
              });
            }
          });

          setModuleRegistry(mergedRegistry);
        } else {
          setModuleRegistry(moduleDataRegistry);
        }
      } catch (err) {
        console.error('Error in fetchModuleRegistry:', err);
      }
    };

    fetchModuleRegistry();
  }, []);

  const isCollapsed = state === 'collapsed';

  // Fetch module groupings from DB
  const { data: dbModuleGroups } = useModuleGroups();

  // Get modules for current workspace, organized with correct groups from DB
  const { groupedModules, standaloneModules, pinnedModules } = useMemo(() => {
    const modules = workspaceModules
      .sort((a, b) => a.position - b.position)
      .map(wm => ({
        ...moduleRegistry.find(mr => mr.id === wm.module_id),
        is_standalone: wm.is_standalone,
        is_pinned: wm.is_pinned,
      }))
      .filter(m => m.id) as (ModuleRegistryItem & { is_standalone: boolean; is_pinned: boolean })[];

    // Map: groupKey -> { groupLabel, allModulesInGroup }
    const grouped: Map<string, { groupKey: string; groupName: string; allModules: (ModuleRegistryItem & { is_standalone: boolean; is_pinned: boolean })[] }> = new Map();
    const standalone: (ModuleRegistryItem & { is_standalone: boolean; is_pinned: boolean })[] = [];
    const pinned: (ModuleRegistryItem & { is_standalone: boolean; is_pinned: boolean })[] = [];
    const usedIds = new Set<string>();

    // Collect pinned modules first (these show in Pinned section)
    for (const module of modules) {
      if (module.is_pinned) {
        pinned.push(module);
      }
    }

    // Use DB module groups if available
    if (dbModuleGroups && dbModuleGroups.length > 0) {
      for (const group of dbModuleGroups) {
        const allModuleKeys = [
          ...group.primaryModules.map(m => m.module_key),
          ...group.associatedModules.map(m => m.module_key),
        ];
        
        // Filter modules: include if in group AND not standalone
        const groupModules = modules.filter(m => 
          allModuleKeys.includes(m.id) && !m.is_standalone
        );
        
        if (groupModules.length > 0) {
          grouped.set(group.key, {
            groupKey: group.key,
            groupName: group.label,
            allModules: groupModules,
          });
          groupModules.forEach(m => usedIds.add(m.id));
        }
      }
    } else {
      // Fallback to hardcoded MODULE_GROUPS
      for (const [primaryId, groupConfig] of Object.entries(MODULE_GROUPS)) {
        const allGroupModuleIds = [primaryId, ...groupConfig.modules];
        const groupModules = modules.filter(m => 
          allGroupModuleIds.includes(m.id) && !m.is_standalone
        );
        
        if (groupModules.length > 0) {
          grouped.set(primaryId, {
            groupKey: primaryId,
            groupName: groupConfig.name,
            allModules: groupModules,
          });
          groupModules.forEach(m => usedIds.add(m.id));
        }
      }
    }

    // Standalone modules: marked as standalone OR not in any group
    for (const module of modules) {
      if (module.is_standalone || !usedIds.has(module.id)) {
        if (!standalone.find(s => s.id === module.id)) {
          standalone.push(module);
          usedIds.add(module.id);
        }
      }
    }

    return { groupedModules: grouped, standaloneModules: standalone, pinnedModules: pinned };
  }, [workspaceModules, moduleRegistry, dbModuleGroups]);

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

  const handleRemoveSection = async (groupName: string, modules: Array<{ id: string; name: string }>) => {
    try {
      // Remove all modules in the section
      for (const module of modules) {
        await removeModule(module.id);
      }
      toast.success("Section removed", {
        description: `${groupName} and all its modules have been removed.`,
      });
    } catch (error) {
      toast.error("Failed to remove section");
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const queryClient = useQueryClient();

  const renderModuleItem = (module: ModuleRegistryItem & { is_standalone?: boolean; is_pinned?: boolean }, indented = false, currentGroupKey?: string) => {
    const Icon = MODULE_ICONS[module.id] || FolderOpen;
    const isStandalone = module.is_standalone || false;
    const isPinned = module.is_pinned || false;
    
    return (
      <SidebarMenuItem key={module.id} className="group/item relative">
        <SidebarMenuButton
          onClick={() => {
            if (module.route) {
              trackModuleOpened(module.id, portal);
              navigate(module.route);
            }
          }}
          isActive={module.route ? isActive(module.route) : false}
          tooltip={module.name}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent pr-8",
            indented && "ml-6 pl-4 text-sm"
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
            <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
              {/* Pin option */}
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await togglePinned(module.id);
                    toast.success(
                      isPinned ? "Unpinned" : "Pinned to top",
                      { description: isPinned 
                        ? `${module.name} removed from pinned.`
                        : `${module.name} is now pinned to the top.` 
                      }
                    );
                  } catch (err) {
                    toast.error("Failed to update module");
                  }
                }}
              >
                <Star className={cn("h-4 w-4 mr-2", isPinned && "fill-amber-500 text-amber-500")} />
                {isPinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              
              {/* Standalone option */}
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await toggleStandalone(module.id);
                    toast.success(
                      isStandalone ? "Moved to collection" : "Made standalone",
                      { description: isStandalone 
                        ? `${module.name} moved back to collection.`
                        : `${module.name} is now outside collections.` 
                      }
                    );
                  } catch (err) {
                    toast.error("Failed to update module");
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isStandalone ? "Move to collection" : "Make standalone"}
              </DropdownMenuItem>
              
              <MoveToSectionMenu
                moduleId={module.id}
                moduleName={module.name}
                currentGroupKey={currentGroupKey}
                onMoved={() => queryClient.invalidateQueries({ queryKey: ['module-groups'] })}
              />
              
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
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3 bg-sidebar">
          <div className="flex items-center justify-between w-full gap-2">
            {!isCollapsed && (
              <button 
                onClick={() => navigate('/my-day')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Dashboard"
              >
                <img 
                  src="/spark/holiday/seeksy-logo-santa.png" 
                  alt="Seeksy" 
                  className="h-10 w-10"
                />
                <span className="text-sidebar-foreground text-2xl font-bold">Seeksy</span>
              </button>
            )}
            {isCollapsed && (
              <button 
                onClick={() => navigate('/my-day')}
                className="flex items-center justify-center flex-1 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Dashboard"
              >
                <img 
                  src="/spark/holiday/seeksy-logo-santa.png" 
                  alt="Seeksy" 
                  className="h-8 w-8"
                />
              </button>
            )}
            <div className="flex items-center gap-1">
              {/* Customize Nav Icon Button */}
              {!isCollapsed && (
                <button
                  onClick={() => setShowModuleCenter(true)}
                  className="p-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-primary/20 text-sidebar-foreground/80 hover:text-sidebar-foreground transition-all duration-200 border border-sidebar-border shadow-sm"
                  title="Customize Navigation"
                >
                  <Sliders className="h-4 w-4" />
                </button>
              )}
              {/* Collapse Sidebar Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-200"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Global Navigation - My Day, My Work, Recents */}
          <SidebarMenu className="pl-4 pt-4">
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
                onClick={() => navigate('/my-work')}
                isActive={isActive('/my-work')}
                tooltip="My Work"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <CheckSquare className="h-4 w-4" />
                {!isCollapsed && <span>My Work</span>}
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

          {/* Favorites Section - Right under Recents */}
          {pinnedModules.length > 0 && (
            <>
              <Separator className="my-2 bg-sidebar-border" />
              {!isCollapsed && (
                <span className="text-xs font-medium text-sidebar-foreground/70 px-4 mb-1 block">
                  Favorites
                </span>
              )}
              <SidebarMenu className="pl-2">
                {pinnedModules.map(module => {
                  const Icon = MODULE_ICONS[module.id] || FolderOpen;
                  return (
                    <SidebarMenuItem key={`fav-${module.id}`} className="group/item relative">
                      <SidebarMenuButton
                        onClick={() => module.route && navigate(module.route)}
                        isActive={module.route ? isActive(module.route) : false}
                        tooltip={module.name}
                        className="text-sidebar-foreground hover:bg-sidebar-accent pr-8"
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {!isCollapsed && <span>{module.name}</span>}
                      </SidebarMenuButton>
                      
                      {/* Quick unpin button */}
                      {!isCollapsed && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await togglePinned(module.id);
                                toast.success("Removed from favorites");
                              }}
                            >
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">Unpin</TooltipContent>
                        </Tooltip>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </>
          )}

          <Separator className="my-2 bg-sidebar-border" />

          {/* Workspaces Section */}
          <div className="px-3 py-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-sidebar-foreground/70">
                  Workspaces
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setShowCreateWorkspace(true)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <WorkspaceSelector />
          </div>

          <Separator className="my-2 bg-sidebar-border" />

          <ScrollArea className="flex-1">
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
                  {/* Grouped modules */}
                  {Array.from(groupedModules.entries()).map(([groupKey, { groupName, allModules }]) => {
                    const isExpanded = expandedGroups[groupKey] ?? false;
                    // Use first module's icon for group header, or a default
                    const firstModule = allModules[0];
                    const GroupIcon = firstModule ? (MODULE_ICONS[firstModule.id] || FolderOpen) : FolderOpen;
                    
                      return (
                        <Collapsible
                          key={groupKey}
                          open={isExpanded}
                          onOpenChange={() => toggleGroup(groupKey)}
                          className="mb-3 group/group"
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
                                tooltip={groupName}
                                className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent pr-8"
                                onClick={() => toggleGroup(groupKey)}
                              >
                                <GroupIcon className="h-5 w-5" />
                                {!isCollapsed && <span className="font-medium text-[15px]">{groupName}</span>}
                              </SidebarMenuButton>
                              
                              {/* Section overflow menu */}
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
                                  <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSection(groupName, allModules);
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove Section
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </SidebarMenuItem>
                          
                          <CollapsibleContent className="mt-0.5">
                            {allModules.map(module => renderModuleItem(module, true, groupKey))}
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
          </ScrollArea>
        </SidebarContent>

        {/* Sticky Footer - Creator Help Menu (SPA actions, no redirects) */}
        <CreatorHelpFooter isCollapsed={isCollapsed} navigate={navigate} isActive={isActive} />
      </Sidebar>
      
      {/* Module Center Modal */}
      <ModuleCenterModal 
        isOpen={showModuleCenter} 
        onClose={() => {
          setShowModuleCenter(false);
          setModuleCenterDefaultToApps(false);
        }}
        defaultToApps={moduleCenterDefaultToApps}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onOpenModuleCenter={() => {
          setModuleCenterDefaultToApps(true);
          setShowModuleCenter(true);
        }}
      />
    </>
  );
}

/**
 * Creator Help Footer - Settings only (Help items moved to header Help menu)
 */
function CreatorHelpFooter({ 
  isCollapsed, 
  navigate, 
  isActive 
}: { 
  isCollapsed: boolean; 
  navigate: (path: string) => void;
  isActive: (path: string) => boolean;
}) {
  return (
    <SidebarFooter className="p-3 pt-2 border-t border-sidebar-border bg-sidebar mt-auto">
      <SidebarMenu>
        {/* Settings - Still navigates to settings page */}
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
  );
}
