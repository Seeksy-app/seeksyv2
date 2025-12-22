import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Domain-based routing configuration
const DOMAIN_ROUTES: Record<string, string> = {
  "truckinglane.com": "/trucking",
  "www.truckinglane.com": "/trucking",
};

// Routes that should NOT redirect (allow access on trucking domain)
const TRUCKING_ALLOWED_ROUTES = [
  "/trucking",
  "/auth", // Allow auth on any domain
  "/admin", // Allow admin access
];

export function DomainRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const targetRoute = DOMAIN_ROUTES[hostname];

    if (targetRoute) {
      // We're on a special domain (truckinglane.com)
      const currentPath = location.pathname;

      // Check if user is already on an allowed route
      const isAllowedRoute = TRUCKING_ALLOWED_ROUTES.some(
        (route) => currentPath.startsWith(route)
      );

      // If not on an allowed route, redirect to the domain's target
      if (!isAllowedRoute && currentPath !== targetRoute) {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}

// Hook to check if we're on a specific domain
export function useIsTruckingDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === "truckinglane.com" || hostname === "www.truckinglane.com";
}
