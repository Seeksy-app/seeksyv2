import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PersonaVideoCard } from "./PersonaVideoCard";
import { PersonaModal } from "./PersonaModal";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Persona {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
}

export const PersonaGrid = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [hoveredPersona, setHoveredPersona] = useState<Persona | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const isFirstHoverRef = useRef(true);

  // When hovering starts, initialize smooth position to cursor position
  useEffect(() => {
    if (hoveredPersona && isFirstHoverRef.current) {
      setSmoothPosition(cursorPosition);
      isFirstHoverRef.current = false;
    }
    if (!hoveredPersona) {
      isFirstHoverRef.current = true;
    }
  }, [hoveredPersona, cursorPosition]);

  // Smooth interpolation using requestAnimationFrame
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, cursorPosition.x, 0.15),
        y: lerp(prev.y, cursorPosition.y, 0.15),
      }));
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cursorPosition]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setCursorPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const { data: personas, isLoading } = useQuery({
    queryKey: ["ai-personas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_personas")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Persona[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No personas available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        onMouseMove={handleMouseMove}
      >
        {personas.map((persona) => (
          <PersonaVideoCard
            key={persona.id}
            name={persona.name}
            role={persona.role}
            tagline={persona.tagline}
            videoUrl={persona.video_url}
            thumbnailUrl={persona.thumbnail_url || undefined}
            onClick={() => setSelectedPersona(persona)}
            onHoverChange={(isHovering) => setHoveredPersona(isHovering ? persona : null)}
            tags={
              persona.name === "Christy" 
                ? [
                    { emoji: "🎧", label: "Podcaster" },
                    { emoji: "📈", label: "Growth-focused" },
                    { emoji: "🤝", label: "Collaborative" }
                  ]
                : persona.name === "Jackie"
                ? [
                    { emoji: "🎨", label: "Creative" },
                    { emoji: "📚", label: "Teacher" },
                    { emoji: "✨", label: "Encouraging" }
                  ]
                : []
            }
          />
        ))}
        
        {/* Shared pill that follows cursor across all cards */}
        <AnimatePresence>
          {hoveredPersona && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              className="fixed z-50 pointer-events-none"
              style={{
                transform: `translate3d(${smoothPosition.x + 12}px, ${smoothPosition.y + 12}px, 0)`,
                willChange: 'transform',
              }}
            >
              <div className="bg-white text-gray-900 px-6 py-3 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                More about {hoveredPersona.name}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PersonaModal
        open={!!selectedPersona}
        onClose={() => setSelectedPersona(null)}
        persona={selectedPersona ? {
          name: selectedPersona.name,
          role: selectedPersona.role,
          tagline: selectedPersona.tagline,
          description: selectedPersona.description,
          videoUrl: selectedPersona.video_url,
        } : null}
      />
    </>
  );
};