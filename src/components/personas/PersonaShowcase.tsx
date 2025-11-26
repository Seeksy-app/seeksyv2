import { PersonaCard } from "./PersonaCard";
import { PersonaModal } from "./PersonaModal";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  role: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags: { icon: string; label: string }[];
  description: string;
}

const PERSONAS: Omit<Persona, "videoUrl">[] = [
  {
    id: "creator",
    name: "Creator Alex",
    role: "Podcaster & Content Creator",
    tags: [
      { icon: "🎙️", label: "Creative" },
      { icon: "⚡", label: "Innovative" },
      { icon: "🎯", label: "Focused" },
    ],
    description:
      "Meet Alex, a passionate podcaster who uses Seeksy to produce, distribute, and monetize content across all platforms effortlessly.",
  },
  {
    id: "advertiser",
    name: "Brand Manager Sarah",
    role: "Advertising & Marketing Lead",
    tags: [
      { icon: "💼", label: "Strategic" },
      { icon: "📊", label: "Data-Driven" },
      { icon: "🎯", label: "Targeted" },
    ],
    description:
      "Sarah manages campaigns for top brands, leveraging Seeksy's AI-powered ad insertion and precise audience targeting to maximize ROI.",
  },
  {
    id: "agency",
    name: "Agency Director Mike",
    role: "Team Lead & Operations",
    tags: [
      { icon: "👥", label: "Collaborative" },
      { icon: "⚙️", label: "Efficient" },
      { icon: "📈", label: "Scalable" },
    ],
    description:
      "Mike leads a creative agency using Seeksy's team features, project management, and multi-client tools to deliver exceptional results.",
  },
];

export const PersonaShowcase = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  useEffect(() => {
    loadPersonaVideos();
  }, []);

  const loadPersonaVideos = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from("persona-videos")
        .list();

      if (error) {
        console.error("Storage list error:", error);
        throw error;
      }

      console.log("Files in persona-videos bucket:", files);

      const personasWithVideos = PERSONAS.map((persona) => {
        // Try multiple matching strategies
        const videoFile = files?.find((file) => {
          const fileName = file.name.toLowerCase();
          // Match by ID or by key terms in the name
          return (
            fileName.includes(persona.id) ||
            (persona.id === "creator" && (fileName.includes("creator") || fileName.includes("podcaster") || fileName.includes("welcome"))) ||
            (persona.id === "advertiser" && (fileName.includes("advertiser") || fileName.includes("brand") || fileName.includes("sarah"))) ||
            (persona.id === "agency" && (fileName.includes("agency") || fileName.includes("team") || fileName.includes("mike")))
          );
        });

        console.log(`Persona ${persona.id} matched file:`, videoFile?.name);

        const videoUrl = videoFile
          ? supabase.storage
              .from("persona-videos")
              .getPublicUrl(videoFile.name).data.publicUrl
          : "";

        console.log(`Persona ${persona.id} video URL:`, videoUrl);

        return {
          ...persona,
          videoUrl,
        };
      });

      setPersonas(personasWithVideos);
    } catch (error) {
      console.error("Error loading persona videos:", error);
      toast.error("Failed to load persona videos");
      // Set personas without videos as fallback
      setPersonas(PERSONAS.map(p => ({ ...p, videoUrl: "" })));
    }
  };

  return (
    <div className="w-full py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Your AI Assistants
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive AI personas designed to guide you through Seeksy's
            powerful features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {personas.map((persona) => (
            <PersonaCard 
              key={persona.id} 
              {...persona} 
              onSelect={() => setSelectedPersona(persona)}
            />
          ))}
        </div>

        <PersonaModal
          open={!!selectedPersona}
          onClose={() => setSelectedPersona(null)}
          persona={selectedPersona}
        />
      </div>
    </div>
  );
};
