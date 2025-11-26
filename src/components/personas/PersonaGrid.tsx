import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PersonaVideoCard } from "./PersonaVideoCard";
import { PersonaModal } from "./PersonaModal";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {personas.map((persona) => (
          <PersonaVideoCard
            key={persona.id}
            name={persona.name}
            role={persona.role}
            tagline={persona.tagline}
            videoUrl={persona.video_url}
            thumbnailUrl={persona.thumbnail_url || undefined}
            onClick={() => setSelectedPersona(persona)}
          />
        ))}
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