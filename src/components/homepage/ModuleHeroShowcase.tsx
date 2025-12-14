import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ModuleData {
  key: string;
  titleLight: string;
  titleBold: string;
  description: string;
  imageUrl: string;
  ribbonLabel: string;
  ribbonBg: string;
}

const modules: ModuleData[] = [
  {
    key: "podcast_studio",
    titleLight: "Podcast",
    titleBold: "Studio",
    description: "Record, edit, and publish professional podcasts with our browser-based studio. Invite guests remotely, auto-generate transcripts, and distribute to all major platforms with one click.",
    imageUrl: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=1000&fit=crop",
    ribbonLabel: "Podcast Studio",
    ribbonBg: "#1A1A1A",
  },
  {
    key: "virtual_meetings",
    titleLight: "Virtual",
    titleBold: "Meetings",
    description: "Host 1:1s, group meetings, and events with booking links, reminders, and guest management built in.",
    imageUrl: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=1000&fit=crop",
    ribbonLabel: "Virtual Meetings",
    ribbonBg: "#C4CFC0",
  },
  {
    key: "ai_post",
    titleLight: "AI Post",
    titleBold: "Production",
    description: "Turn raw recordings into clips, highlights, captions, and polished edits automatically.",
    imageUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&h=1000&fit=crop",
    ribbonLabel: "AI Post Production",
    ribbonBg: "#B8C9DC",
  },
  {
    key: "live_streaming",
    titleLight: "Live",
    titleBold: "Streaming",
    description: "Go live with a branded placecard, guests, chat, and instant replay-ready recordings.",
    imageUrl: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&h=1000&fit=crop",
    ribbonLabel: "Live Streaming",
    ribbonBg: "#DDD8CC",
  },
];

export function ModuleHeroShowcase() {
  const [activeKey, setActiveKey] = useState("podcast_studio");
  const activeModule = modules.find((m) => m.key === activeKey) || modules[0];

  return (
    <section className="w-full px-4 py-24 md:py-32">
      {/* Single container - 32px radius, no overflow hidden so tabs can be seen */}
      <div
        className="mx-auto max-w-[1200px] rounded-[32px] overflow-hidden"
        style={{
          background: "#E8D5CB",
        }}
      >
        {/* Desktop Layout - Single row, everything inside */}
        <div className="hidden md:flex">
          {/* Left: Text Block */}
          <div className="flex-shrink-0 w-[380px] p-12 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModule.key + "-text"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  {/* Mixed-weight headline like "Share of Influence" */}
                  <h2
                    className="tracking-[-0.02em]"
                    style={{
                      fontSize: "48px",
                      lineHeight: 1.1,
                      color: "#0B0F1A",
                    }}
                  >
                    <span className="font-normal">{activeModule.titleLight}</span>{" "}
                    <span className="font-black underline decoration-2 underline-offset-4">{activeModule.titleBold}</span>
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: 1.65,
                      color: "rgba(11, 15, 26, 0.75)",
                      maxWidth: "340px",
                    }}
                  >
                    {activeModule.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CTA - Restrained pill at bottom */}
            <button
              className="group w-fit flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-[140ms] ease-out mt-8"
              style={{
                background: "#0A0A0A",
                color: "#FFFFFF",
              }}
            >
              learn more
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[140ms] ease-out group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Center: Image - Fills container height */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule.key + "-image"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <img
                  src={activeModule.imageUrl}
                  alt={activeModule.titleLight + " " + activeModule.titleBold}
                  className="w-full h-full object-cover rounded-[16px]"
                  style={{
                    minHeight: "480px",
                  }}
                />
                {/* Creator tag overlay */}
                <div 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    color: "#FFFFFF",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  @seeksy
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Vertical Tabs - Full height, inside container */}
          <div className="flex-shrink-0 flex">
            {modules.map((module, index) => {
              const isActive = module.key === activeKey;
              
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveKey(module.key)}
                  className="relative cursor-pointer transition-all duration-200 hover:opacity-95"
                  style={{
                    width: isActive ? "72px" : "56px",
                    background: isActive ? "#0A0A0A" : module.ribbonBg,
                    marginLeft: index === 0 ? 0 : "-3px",
                    zIndex: isActive ? 10 : (5 - index),
                  }}
                >
                  <span
                    className="absolute top-1/2 left-1/2 whitespace-nowrap"
                    style={{
                      fontSize: "13px",
                      letterSpacing: "0.02em",
                      color: isActive ? "#FFFFFF" : "rgba(11, 15, 26, 0.85)",
                      fontWeight: isActive ? 600 : 500,
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
        <div className="md:hidden p-6 flex flex-col gap-6">
          {/* Text Block */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule.key + "-mobile-text"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              <h2
                className="tracking-[-0.02em]"
                style={{
                  fontSize: "36px",
                  lineHeight: 1.1,
                  color: "#0B0F1A",
                }}
              >
                <span className="font-normal">{activeModule.titleLight}</span>{" "}
                <span className="font-black underline decoration-2 underline-offset-4">{activeModule.titleBold}</span>
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "rgba(11, 15, 26, 0.75)",
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
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative aspect-[4/5] rounded-[16px] overflow-hidden"
            >
              <img
                src={activeModule.imageUrl}
                alt={activeModule.titleLight + " " + activeModule.titleBold}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Horizontal Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {modules.map((module) => {
              const isActive = module.key === activeKey;
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveKey(module.key)}
                  className="flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all duration-[140ms]"
                  style={{
                    background: isActive ? "#0A0A0A" : module.ribbonBg,
                    color: isActive ? "#FFFFFF" : "rgba(11, 15, 26, 0.85)",
                  }}
                >
                  {module.ribbonLabel}
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <button
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium"
            style={{
              background: "#0A0A0A",
              color: "#FFFFFF",
            }}
          >
            learn more
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
