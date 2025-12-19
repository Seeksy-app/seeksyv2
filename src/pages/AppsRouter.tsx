import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load both versions
const AppsLegacy = lazy(() => import("./Apps"));
const AppsRedesigned = lazy(() => import("./AppsRedesigned"));

// localStorage key for feature flag
const APPS_REDESIGN_FLAG = "seeksy_use_new_apps";

/**
 * Check if the new apps page should be used.
 * Can be toggled via localStorage or URL param for testing.
 */
export function useNewAppsEnabled(): boolean {
  // Check URL param first (for testing links)
  const urlParams = new URLSearchParams(window.location.search);
  const urlFlag = urlParams.get("new_apps");
  if (urlFlag === "true") return true;
  if (urlFlag === "false") return false;
  
  // Then check localStorage
  try {
    const stored = localStorage.getItem(APPS_REDESIGN_FLAG);
    return stored === "true";
  } catch {
    return false; // Default to legacy if localStorage fails
  }
}

/**
 * Enable or disable the new apps page.
 * Call from browser console: window.SeeksyApps.enable() or .disable()
 */
export function setNewAppsEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(APPS_REDESIGN_FLAG, "true");
    } else {
      localStorage.removeItem(APPS_REDESIGN_FLAG);
    }
    console.log(`[Seeksy] New apps page ${enabled ? "enabled" : "disabled"}. Reload to apply.`);
  } catch (e) {
    console.error("[Seeksy] Failed to set apps flag:", e);
  }
}

// Expose to window for testing
if (typeof window !== "undefined") {
  (window as any).SeeksyApps = {
    enable: () => setNewAppsEnabled(true),
    disable: () => setNewAppsEnabled(false),
    isEnabled: () => useNewAppsEnabled(),
  };
}

/**
 * Router component that renders either the new or legacy apps page.
 * Usage: <Route path="/apps" element={<AppsRouter />} />
 */
export default function AppsRouter() {
  const useNewApps = useNewAppsEnabled();
  
  const LoadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
  
  return (
    <Suspense fallback={LoadingFallback}>
      {useNewApps ? <AppsRedesigned /> : <AppsLegacy />}
    </Suspense>
  );
}
