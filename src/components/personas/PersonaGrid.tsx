import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PersonaVideoCard } from "./PersonaVideoCard";
import { PersonaModal } from "./PersonaModal";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

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
        {hoveredPersona && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              transform: `translate(${cursorPosition.x + 12}px, ${cursorPosition.y + 12}px)`,
              transition: 'opacity 0.12s ease-out',
              opacity: 1,
            }}
          >
            <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl whitespace-nowrap">
              More about {hoveredPersona.name}
            </div>
          </div>
        )}
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