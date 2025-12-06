import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface Workspace {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  icon_color: string;
  is_default: boolean;
  modules: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceModule {
  id: string;
  workspace_id: string;
  module_id: string;
  position: number;
  settings: Record<string, unknown>;
  is_pinned: boolean;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceModules: WorkspaceModule[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (name: string, templateModules?: string[]) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  addModule: (moduleId: string) => Promise<void>;
  removeModule: (moduleId: string) => Promise<void>;
  reorderModules: (moduleIds: string[]) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaceModules, setWorkspaceModules] = useState<WorkspaceModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('custom_packages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: Workspace[] = (data || []).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        icon_color: pkg.icon_color || '#2C6BED',
        is_default: pkg.is_default || false,
        modules: (pkg.modules as string[]) || [],
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
      }));

      setWorkspaces(mapped);

      // Set current workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      const defaultWorkspace = mapped.find(w => w.is_default) || mapped[0];
      const savedWorkspace = savedWorkspaceId ? mapped.find(w => w.id === savedWorkspaceId) : null;
      
      const workspaceToSet = savedWorkspace || defaultWorkspace || null;
      setCurrentWorkspaceState(workspaceToSet);
      
      if (workspaceToSet) {
        await fetchWorkspaceModules(workspaceToSet.id);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWorkspaceModules = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_modules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true });

      if (error) throw error;

      setWorkspaceModules((data || []).map(m => ({
        id: m.id,
        workspace_id: m.workspace_id,
        module_id: m.module_id,
        position: m.position,
        settings: (m.settings as Record<string, unknown>) || {},
        is_pinned: m.is_pinned || false,
      })));
    } catch (err) {
      console.error('Error fetching workspace modules:', err);
    }
  };

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem('currentWorkspaceId', workspace.id);
      fetchWorkspaceModules(workspace.id);
    } else {
      localStorage.removeItem('currentWorkspaceId');
      setWorkspaceModules([]);
    }
  }, []);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const createWorkspace = async (name: string, templateModules?: string[]): Promise<Workspace | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const slug = generateSlug(name);
      const isFirstWorkspace = workspaces.length === 0;
      const modules = templateModules || [];

      const { data, error } = await supabase
        .from('custom_packages')
        .insert({
          user_id: session.user.id,
          name,
          slug,
          modules,
          is_default: isFirstWorkspace,
          icon_color: '#2C6BED',
        })
        .select()
        .single();

      if (error) throw error;

      // Insert workspace_modules for each module
      if (modules.length > 0 && data) {
        const moduleInserts = modules.map((moduleId, index) => ({
          workspace_id: data.id,
          module_id: moduleId,
          position: index,
        }));

        await supabase.from('workspace_modules').insert(moduleInserts);
      }

      await fetchWorkspaces();
      
      const newWorkspace: Workspace = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon_color: data.icon_color || '#2C6BED',
        is_default: data.is_default || false,
        modules: (data.modules as string[]) || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return newWorkspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      return null;
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('custom_packages')
        .update({
          name: updates.name,
          description: updates.description,
          icon_color: updates.icon_color,
          is_default: updates.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchWorkspaces();
    } catch (err) {
      console.error('Error updating workspace:', err);
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (currentWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id);
        setCurrentWorkspace(remaining[0] || null);
      }
      
      await fetchWorkspaces();
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  const addModule = async (moduleId: string) => {
    if (!currentWorkspace) return;

    try {
      // Add to workspace_modules table
      const { error: moduleError } = await supabase
        .from('workspace_modules')
        .insert({
          workspace_id: currentWorkspace.id,
          module_id: moduleId,
          position: workspaceModules.length,
        });

      if (moduleError) throw moduleError;

      // Also update the legacy modules array
      const updatedModules = [...(currentWorkspace.modules || []), moduleId];
      await supabase
        .from('custom_packages')
        .update({ modules: updatedModules, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);

      await fetchWorkspaces();
      await fetchWorkspaceModules(currentWorkspace.id);
    } catch (err) {
      console.error('Error adding module:', err);
    }
  };

  const removeModule = async (moduleId: string) => {
    if (!currentWorkspace) return;

    try {
      // Remove from workspace_modules table
      await supabase
        .from('workspace_modules')
        .delete()
        .eq('workspace_id', currentWorkspace.id)
        .eq('module_id', moduleId);

      // Also update the legacy modules array
      const updatedModules = (currentWorkspace.modules || []).filter(m => m !== moduleId);
      await supabase
        .from('custom_packages')
        .update({ modules: updatedModules, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);

      await fetchWorkspaces();
      await fetchWorkspaceModules(currentWorkspace.id);
    } catch (err) {
      console.error('Error removing module:', err);
    }
  };

  const reorderModules = async (moduleIds: string[]) => {
    if (!currentWorkspace) return;

    try {
      // Update positions in workspace_modules
      const updates = moduleIds.map((moduleId, index) => 
        supabase
          .from('workspace_modules')
          .update({ position: index })
          .eq('workspace_id', currentWorkspace.id)
          .eq('module_id', moduleId)
      );

      await Promise.all(updates);

      // Also update the legacy modules array
      await supabase
        .from('custom_packages')
        .update({ modules: moduleIds, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);

      await fetchWorkspaceModules(currentWorkspace.id);
    } catch (err) {
      console.error('Error reordering modules:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        workspaceModules,
        isLoading,
        setCurrentWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        addModule,
        removeModule,
        reorderModules,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
