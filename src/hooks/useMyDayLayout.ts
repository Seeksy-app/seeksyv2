import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { DEFAULT_LAYOUT, LayoutConfig } from "@/components/myday/myDayWidgets";
import { toast } from "sonner";

export function useMyDayLayout() {
  const { currentWorkspace } = useWorkspace();
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load layout from database
  useEffect(() => {
    async function loadLayout() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLayout(DEFAULT_LAYOUT);
          return;
        }

        const { data, error } = await supabase
          .from("user_myday_layouts")
          .select("layout_json")
          .eq("user_id", user.id)
          .eq("workspace_id", currentWorkspace?.id ?? null)
          .maybeSingle();

        if (error) {
          console.error("Error loading layout:", error);
          setLayout(DEFAULT_LAYOUT);
          return;
        }

        if (data?.layout_json) {
          // Merge with defaults to ensure new widgets are included
          const savedLayout = data.layout_json as unknown as LayoutConfig;
          setLayout({
            sectionOrder: savedLayout.sectionOrder || DEFAULT_LAYOUT.sectionOrder,
            widgetOrder: { ...DEFAULT_LAYOUT.widgetOrder, ...savedLayout.widgetOrder },
            hiddenWidgets: savedLayout.hiddenWidgets || [],
          });
        } else {
          setLayout(DEFAULT_LAYOUT);
        }
      } catch (error) {
        console.error("Error loading layout:", error);
        setLayout(DEFAULT_LAYOUT);
      } finally {
        setIsLoading(false);
      }
    }

    loadLayout();
  }, [currentWorkspace?.id]);

  // Save layout to database
  const saveLayout = useCallback(async (newLayout: LayoutConfig) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if layout exists
      const { data: existing } = await supabase
        .from("user_myday_layouts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("user_myday_layouts")
          .update({
            layout_json: JSON.parse(JSON.stringify(newLayout)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_myday_layouts")
          .insert({
            user_id: user.id,
            workspace_id: currentWorkspace?.id,
            layout_json: JSON.parse(JSON.stringify(newLayout)),
          });
        if (insertError) throw insertError;
      }

      setLayout(newLayout);
      toast.success("Layout saved");
    } catch (err) {
      console.error("Error saving layout:", err);
      toast.error("Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkspace?.id]);

  // Update layout optimistically
  const updateLayout = useCallback((newLayout: LayoutConfig) => {
    setLayout(newLayout);
  }, []);

  // Reset to default
  const resetLayout = useCallback(async () => {
    await saveLayout(DEFAULT_LAYOUT);
  }, [saveLayout]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setLayout(prev => {
      const isHidden = prev.hiddenWidgets.includes(widgetId);
      return {
        ...prev,
        hiddenWidgets: isHidden
          ? prev.hiddenWidgets.filter(id => id !== widgetId)
          : [...prev.hiddenWidgets, widgetId],
      };
    });
  }, []);

  // Reorder sections
  const reorderSections = useCallback((newOrder: string[]) => {
    setLayout(prev => ({
      ...prev,
      sectionOrder: newOrder,
    }));
  }, []);

  // Reorder widgets within a section
  const reorderWidgets = useCallback((sectionId: string, newOrder: string[]) => {
    setLayout(prev => ({
      ...prev,
      widgetOrder: {
        ...prev.widgetOrder,
        [sectionId]: newOrder,
      },
    }));
  }, []);

  return {
    layout,
    isLoading,
    isSaving,
    saveLayout,
    updateLayout,
    resetLayout,
    toggleWidgetVisibility,
    reorderSections,
    reorderWidgets,
  };
}
