import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  Home, 
  CalendarDays, 
  Clock, 
  Plus,
  Settings,
  Sparkles,
  LayoutDashboard,
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
  HelpCircle,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping for modules
const MODULE_ICONS: Record<string, React.ElementType> = {
  'studio': Mic,
  'podcasts': Podcast,
  'clips': Scissors,
  'ai-post-production': Sparkles,
  'blog': FileText,
  'newsletters': Mail,
  'campaigns': Megaphone,
  'automations': Zap,
  'crm': Users,
  'contacts': Users,
  'tasks': CheckSquare,
  'projects': FolderOpen,
  'meetings': Calendar,
  'events': CalendarDays,
  'awards': Trophy,
  'proposals': FileText,
  'forms': FormInput,
  'polls': Vote,
  'media-library': Image,
  'email': Mail,
  'identity': Shield,
  'my-page': Layout,
  'settings': Settings,
  'billing': CreditCard,
  'help': HelpCircle,
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
  const { currentWorkspace, workspaceModules, addModule } = useWorkspace();
  const [moduleRegistry, setModuleRegistry] = useState<ModuleRegistryItem[]>([]);
  const [showAddModule, setShowAddModule] = useState(false);

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

  // Get modules for current workspace, sorted by position
  const activeModules = workspaceModules
    .sort((a, b) => a.position - b.position)
    .map(wm => moduleRegistry.find(mr => mr.id === wm.module_id))
    .filter(Boolean) as ModuleRegistryItem[];

  // Available modules (not yet added to workspace)
  const availableModules = moduleRegistry.filter(
    mr => mr.scope === 'workspace' && !workspaceModules.some(wm => wm.module_id === mr.id)
  );

  const handleAddModule = async (moduleId: string) => {
    await addModule(moduleId);
    setShowAddModule(false);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <Sidebar className="border-r bg-sidebar" collapsible="icon">
        <SidebarHeader className="p-2">
          <WorkspaceSelector />
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="flex-1">
            {/* Global Navigation */}
            <div className="px-2 py-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/dashboard')}
                    isActive={isActive('/dashboard')}
                    tooltip="Dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!isCollapsed && <span>Dashboard</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/my-day')}
                    isActive={isActive('/my-day')}
                    tooltip="My Day"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {!isCollapsed && <span>My Day</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/')}
                    isActive={location.pathname === '/'}
                    tooltip="Home"
                  >
                    <Home className="h-4 w-4" />
                    {!isCollapsed && <span>Home</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <Separator className="my-2" />

            {/* Workspace Modules */}
            {currentWorkspace && (
              <div className="px-2 py-2">
                {!isCollapsed && (
                  <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
                    Workspace modules
                  </p>
                )}
                
                <SidebarMenu>
                  {activeModules.map((module) => {
                    const Icon = MODULE_ICONS[module.id] || FolderOpen;
                    return (
                      <SidebarMenuItem key={module.id}>
                        <SidebarMenuButton
                          onClick={() => module.route && navigate(module.route)}
                          isActive={module.route ? isActive(module.route) : false}
                          tooltip={module.name}
                        >
                          <Icon className="h-4 w-4" />
                          {!isCollapsed && <span>{module.name}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  {/* Add Module Button */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowAddModule(true)}
                      tooltip="Add module"
                      className="text-muted-foreground hover:text-foreground"
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
                <p className="text-sm text-muted-foreground mb-4">
                  Create a workspace to get started
                </p>
                <Button size="sm" onClick={() => navigate('/module-center')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Workspace
                </Button>
              </div>
            )}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/settings')}
                isActive={isActive('/settings')}
                tooltip="Settings"
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span>Settings</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Add Module Dialog */}
      <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add module to workspace</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-80 overflow-y-auto py-2">
            {availableModules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All available modules are already in this workspace
              </p>
            ) : (
              <div className="space-y-1">
                {availableModules.map((module) => {
                  const Icon = MODULE_ICONS[module.id] || FolderOpen;
                  return (
                    <button
                      key={module.id}
                      onClick={() => handleAddModule(module.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{module.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {module.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
