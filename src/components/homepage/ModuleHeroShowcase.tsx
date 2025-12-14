import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModuleData {
  key: string;
  title: string;
  description: string;
  imageUrl: string;
  ribbonLabel: string;
  ribbonBg: string;
  ribbonTextColor?: string;
}

const modules: ModuleData[] = [
  {
    key: "podcast_studio",
    title: "Podcast Studio",
    description: "Record, edit, and publish professional podcasts with our browser-based studio. Invite guests remotely, auto-generate transcripts, and distribute to all major platforms with one click.",
    imageUrl: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=800&fit=crop",
    ribbonLabel: "Podcast Studio",
    ribbonBg: "#111111",
    ribbonTextColor: "#FFFFFF",
  },
  {
    key: "virtual_meetings",
    title: "Virtual Meetings",
    description: "Host 1:1s, group meetings, and events with booking links, reminders, and guest management built in.",
    imageUrl: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=800&fit=crop",
    ribbonLabel: "Virtual Meetings",
    ribbonBg: "#C9D6C5",
  },
  {
    key: "ai_post",
    title: "AI Post Production",
    description: "Turn raw recordings into clips, highlights, captions, and polished edits automatically.",
    imageUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&h=800&fit=crop",
    ribbonLabel: "AI Post Production",
    ribbonBg: "#BFD3EA",
  },
  {
    key: "live_streaming",
    title: "Live Streaming",
    description: "Go live with a branded placecard, guests, chat, and instant replay-ready recordings.",
    imageUrl: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&h=800&fit=crop",
    ribbonLabel: "Live Streaming",
    ribbonBg: "#E9E3D7",
  },
];

export function ModuleHeroShowcase() {
  const [activeKey, setActiveKey] = useState("podcast_studio");
  const activeModule = modules.find((m) => m.key === activeKey) || modules[0];

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div
        className="mx-auto max-w-[1200px] rounded-[28px] p-8 md:p-12"
        style={{
          background: "#E9D6CD",
          boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
        }}
      >
        {/* Desktop/Tablet Grid */}
        <div className="hidden md:grid md:grid-cols-[38%_42%_20%] gap-7 items-center">
          {/* Left Text Block */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule.key + "-text"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5"
              >
                <h2
                  className="font-extrabold tracking-tight text-[#0B0F1A]"
                  style={{
                    fontSize: "clamp(40px, 5vw, 64px)",
                    lineHeight: 1.0,
                  }}
                >
                  {activeModule.title}
                </h2>
                <p
                  className="text-[#0B0F1A]"
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.65,
                    maxWidth: "44ch",
                    opacity: 0.85,
                  }}
                >
                  {activeModule.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <Button
              className="w-fit rounded-full px-5 h-[46px] bg-[#111111] text-white hover:bg-[#222222] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.18)]"
            >
              Learn More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Center Image */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule.key + "-image"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="aspect-square rounded-[24px] overflow-hidden"
                style={{
                  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
                }}
              >
                <img
                  src={activeModule.imageUrl}
                  alt={activeModule.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Ribbons (Vertical Tabs) */}
          <div className="flex flex-col gap-3 items-end">
            {modules.map((module) => {
              const isActive = module.key === activeKey;
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveKey(module.key)}
                  className="relative cursor-pointer transition-all duration-200 hover:opacity-90"
                  style={{
                    width: "64px",
                    height: "180px",
                    borderRadius: "22px",
                    background: isActive ? "#111111" : module.ribbonBg,
                  }}
                >
                  <span
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-bold"
                    style={{
                      fontSize: "14px",
                      letterSpacing: "0.02em",
                      color: isActive ? "#FFFFFF" : "#111111",
                      transform: "translate(-50%, -50%) rotate(-90deg)",
                    }}
                  >
                    {module.ribbonLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-6">
          {/* Text Block */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule.key + "-mobile-text"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <h2
                className="font-extrabold tracking-tight text-[#0B0F1A]"
                style={{
                  fontSize: "40px",
                  lineHeight: 1.0,
                }}
              >
                {activeModule.title}
              </h2>
              <p
                className="text-[#0B0F1A]"
                style={{
                  fontSize: "16px",
                  lineHeight: 1.65,
                  opacity: 0.85,
                }}
              >
                {activeModule.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule.key + "-mobile-image"}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="aspect-square rounded-[20px] overflow-hidden"
              style={{
                boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
              }}
            >
              <img
                src={activeModule.imageUrl}
                alt={activeModule.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Horizontal Chip Ribbons */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {modules.map((module) => {
              const isActive = module.key === activeKey;
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveKey(module.key)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-200"
                  style={{
                    background: isActive ? "#111111" : module.ribbonBg,
                    color: isActive ? "#FFFFFF" : "#111111",
                  }}
                >
                  {module.ribbonLabel}
                </button>
              );
            })}
          </div>

          {/* CTA Button */}
          <Button
            className="w-full rounded-full h-[46px] bg-[#111111] text-white hover:bg-[#222222]"
          >
            Learn More
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
