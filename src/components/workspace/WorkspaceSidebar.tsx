import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { MoveToSectionMenu } from "./MoveToSectionMenu";
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
  ExternalLink,
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
  Building2,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useModuleGroups } from "@/hooks/useModuleGroups";
import { useQueryClient } from "@tanstack/react-query";

// Icon mapping for modules - ensure correct icons for each module
const MODULE_ICONS: Record<string, React.ElementType> = {
  'studio': Mic,
  'studio-recording': Mic,
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
};

// Fallback module groupings (used when DB config is loading or empty)
// Each primary module acts as a collapsible group header
const MODULE_GROUPS: Record<string, { name: string; modules: string[] }> = {
  'studio': { 
    name: 'Creator Studio',
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
  const { state } = useSidebar();
  const { currentWorkspace, workspaceModules, removeModule, toggleStandalone } = useWorkspace();
  const [moduleRegistry, setModuleRegistry] = useState<ModuleRegistryItem[]>([]);
  const [showModuleCenter, setShowModuleCenter] = useState(false);
  const [removingModule, setRemovingModule] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['studio', 'campaigns', 'events', 'crm']));

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

  // Fetch module groupings from DB
  const { data: dbModuleGroups } = useModuleGroups();

  // Get modules for current workspace, organized with correct groups from DB
  const { groupedModules, standaloneModules, pinnedStandaloneModules } = useMemo(() => {
    const moduleIds = workspaceModules.map(wm => wm.module_id);
    const modules = workspaceModules
      .sort((a, b) => a.position - b.position)
      .map(wm => ({
        ...moduleRegistry.find(mr => mr.id === wm.module_id),
        is_standalone: wm.is_standalone,
      }))
      .filter(m => m.id) as (ModuleRegistryItem & { is_standalone: boolean })[];

    // Map: groupKey -> { groupLabel, allModulesInGroup }
    const grouped: Map<string, { groupKey: string; groupName: string; allModules: (ModuleRegistryItem & { is_standalone: boolean })[] }> = new Map();
    const standalone: (ModuleRegistryItem & { is_standalone: boolean })[] = [];
    const pinnedStandalone: (ModuleRegistryItem & { is_standalone: boolean })[] = [];
    const usedIds = new Set<string>();

    // Use DB module groups if available
    if (dbModuleGroups && dbModuleGroups.length > 0) {
      for (const group of dbModuleGroups) {
        // Get all modules (primary + associated) for this group that are in the workspace
        const allModuleKeys = [
          ...group.primaryModules.map(m => m.module_key),
          ...group.associatedModules.map(m => m.module_key),
        ];
        
        const groupModules = modules.filter(m => allModuleKeys.includes(m.id));
        
        // Only create group if we have at least one module from it
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
        const groupModules = modules.filter(m => allGroupModuleIds.includes(m.id));
        
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

    // Check associated modules for standalone flag
    for (const module of modules) {
      if (module.is_standalone && !pinnedStandalone.find(p => p.id === module.id)) {
        pinnedStandalone.push(module);
      }
    }

    // Standalone modules (not in any group)
    for (const module of modules) {
      if (!usedIds.has(module.id)) {
        standalone.push(module);
      }
    }

    return { groupedModules: grouped, standaloneModules: standalone, pinnedStandaloneModules: pinnedStandalone };
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

  const queryClient = useQueryClient();

  const renderModuleItem = (module: ModuleRegistryItem & { is_standalone?: boolean }, indented = false, currentGroupKey?: string) => {
    const Icon = MODULE_ICONS[module.id] || FolderOpen;
    const isStandalone = module.is_standalone || false;
    
    return (
      <SidebarMenuItem key={module.id} className="group/item relative">
        <SidebarMenuButton
          onClick={() => module.route && navigate(module.route)}
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveModule(module.id, module.name);
                }}
                className="text-destructive focus:text-destructive"
                disabled={removingModule === module.id}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await toggleStandalone(module.id);
                    toast.success(
                      isStandalone ? "Removed from standalone" : "Module added as standalone",
                      { description: isStandalone 
                        ? `${module.name} removed from standalone menu.`
                        : `${module.name} is now a standalone menu item.` 
                      }
                    );
                  } catch (err) {
                    toast.error("Failed to update module");
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isStandalone ? "Remove Standalone" : "Standalone"}
              </DropdownMenuItem>
              <MoveToSectionMenu
                moduleId={module.id}
                moduleName={module.name}
                currentGroupKey={currentGroupKey}
                onMoved={() => queryClient.invalidateQueries({ queryKey: ['module-groups'] })}
              />
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
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="flex-1">
            <Separator className="my-1 bg-sidebar-border" />

            {/* Pinned Standalone Modules Section */}
            {pinnedStandaloneModules.length > 0 && (
              <div className="px-3 py-1">
                {!isCollapsed && (
                  <span className="text-xs font-medium text-sidebar-foreground/70 px-2">
                    Pinned
                  </span>
                )}
                <SidebarMenu className="mt-1">
                  {pinnedStandaloneModules.map(module => {
                    const Icon = MODULE_ICONS[module.id] || FolderOpen;
                    return (
                      <SidebarMenuItem key={`pinned-${module.id}`}>
                        <SidebarMenuButton
                          onClick={() => module.route && navigate(module.route)}
                          isActive={module.route ? isActive(module.route) : false}
                          tooltip={module.name}
                          className="text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                          <Icon className="h-4 w-4" />
                          {!isCollapsed && <span>{module.name}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
                <Separator className="my-2 bg-sidebar-border" />
              </div>
            )}

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
                    const isExpanded = expandedGroups.has(groupKey);
                    // Use first module's icon for group header, or a default
                    const firstModule = allModules[0];
                    const GroupIcon = firstModule ? (MODULE_ICONS[firstModule.id] || FolderOpen) : FolderOpen;
                    
                      return (
                        <Collapsible
                          key={groupKey}
                          open={isExpanded}
                          onOpenChange={() => toggleGroup(groupKey)}
                          className="mb-3"
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
                                className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
                                onClick={() => toggleGroup(groupKey)}
                              >
                                <GroupIcon className="h-5 w-5" />
                                {!isCollapsed && <span className="font-bold text-[15px]">{groupName}</span>}
                              </SidebarMenuButton>
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

        {/* Sticky Footer - always visible even when scrolling */}
        <SidebarFooter className="p-3 pt-2 border-t border-sidebar-border bg-sidebar mt-auto">
          <SidebarMenu>
            {/* AI Agent / Ask Seeksy - Opens chat panel - Brand blue style */}
            <SidebarMenuItem>
              <button
                onClick={() => document.dispatchEvent(new Event('open-spark-assistant'))}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  "bg-[hsl(217,80%,50%)] hover:bg-[hsl(217,80%,45%)]",
                  "border border-[hsl(217,80%,40%)]",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <SparkIcon variant="holiday" size={24} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-white font-semibold text-base">
                    Ask Seeksy
                  </span>
                )}
              </button>
            </SidebarMenuItem>
            
            {/* Settings */}
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
