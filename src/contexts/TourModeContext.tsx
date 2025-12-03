import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface TourModeContextType {
  isTourMode: boolean;
  exitTourMode: () => void;
}

const TourModeContext = createContext<TourModeContextType>({
  isTourMode: false,
  exitTourMode: () => {},
});

export function useTourMode() {
  return useContext(TourModeContext);
}

// Routes that should show the minimal tour layout
const TOUR_ROUTES = [
  "/onboarding/complete",
  "/studio",
  "/studio/audio",
  "/studio/video",
  "/studio/clips",
  "/media/library",
  "/media-library",
  "/clips",
];

export function TourModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTourMode, setIsTourMode] = useState(false);

  // Check for tour mode from navigation state or sessionStorage
  useEffect(() => {
    const state = location.state as { fromOnboarding?: boolean } | null;
    const storedTourMode = sessionStorage.getItem("tourMode");
    
    if (state?.fromOnboarding) {
      setIsTourMode(true);
      sessionStorage.setItem("tourMode", "true");
    } else if (storedTourMode === "true") {
      // Only keep tour mode on valid tour routes
      const isValidTourRoute = TOUR_ROUTES.some(route => 
        location.pathname === route || location.pathname.startsWith(route + "/")
      );
      if (!isValidTourRoute) {
        exitTourMode();
      } else {
        setIsTourMode(true);
      }
    }
  }, [location.pathname, location.state]);

  const exitTourMode = () => {
    setIsTourMode(false);
    sessionStorage.removeItem("tourMode");
  };

  const goToDashboard = () => {
    exitTourMode();
    navigate("/dashboard");
  };

  return (
    <TourModeContext.Provider value={{ isTourMode, exitTourMode }}>
      {children}
    </TourModeContext.Provider>
  );
}
