import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Import hero images
import heroConversations from "@/assets/homepage/hero-conversations.jpg";
import heroCommunity from "@/assets/homepage/hero-community.jpg";
import heroContent from "@/assets/homepage/hero-content.jpg";
import heroPeople from "@/assets/homepage/hero-people.jpg";

interface FeatureData {
  key: string;
  label: string;
  title: string;
  description: string;
  imageUrl: string;
  tabBg: string;
}

const features: FeatureData[] = [
  {
    key: "podcast",
    label: "Podcast Studio",
    title: "Podcast Studio",
    description: "Record, edit, and publish professional podcasts. Invite remote guests, auto-generate transcripts, and distribute to major platforms.",
    imageUrl: heroConversations,
    tabBg: "#0B0B0B", // Active by default
  },
  {
    key: "meetings",
    label: "Virtual Meetings",
    title: "Virtual Meetings",
    description: "Create booking links, schedule guests, send confirmations and reminders, and keep everything synced.",
    imageUrl: heroCommunity,
    tabBg: "#C9D7C8", // Tab green
  },
  {
    key: "post",
    label: "AI Post Production",
    title: "AI Post Production",
    description: "Clean up audio/video, generate clips, captions, and polished exports—without complicated workflows.",
    imageUrl: heroContent,
    tabBg: "#BFD1EA", // Tab blue
  },
  {
    key: "stream",
    label: "Live Streaming",
    title: "Live Streaming",
    description: "Go live, bring guests on screen, and repurpose streams into content with built-in production tools.",
    imageUrl: heroPeople,
    tabBg: "#DED6C8", // Tab sand
  },
];

export function ModuleHeroShowcase() {
  const [activeKey, setActiveKey] = useState<string>("podcast");

  const activeFeature = features.find((f) => f.key === activeKey) || features[0];

  return (
    <section className="w-full px-4 py-16 md:py-20">
      <div className="mx-auto max-w-[1280px]">
        {/* Desktop Layout - 3 columns: copy | image | vertical tabs */}
        <div
          className="hidden md:grid rounded-[32px] overflow-hidden"
          style={{
            gridTemplateColumns: "1.05fr 1.35fr 0.6fr",
            minHeight: "560px",
            padding: "52px",
            gap: "36px",
            background: "#E7D6CC",
            border: "1px solid rgba(230,234,242,0.8)",
            boxShadow: "0 24px 60px rgba(16,24,40,0.12)",
          }}
        >
          {/* LEFT: Copy Area */}
          <div className="flex flex-col justify-center">
            <p
              className="uppercase mb-4"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#667085",
              }}
            >
              Explore Features
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col gap-5"
              >
                <h2
                  className="font-extrabold tracking-[-0.02em]"
                  style={{
                    fontSize: "56px",
                    lineHeight: 1.0,
                    color: "#0B1220",
                  }}
                >
                  {activeFeature.title}
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.6,
                    color: "#667085",
                    maxWidth: "440px",
                  }}
                >
                  {activeFeature.description}
                </p>
                <button
                  className="group w-fit flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all duration-200 mt-2"
                  style={{
                    background: "#0B0B0B",
                    color: "#FFFFFF",
                  }}
                >
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CENTER: Image Card */}
          <div className="flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey + "-image"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="relative rounded-[26px] overflow-hidden"
                style={{
                  width: "100%",
                  maxWidth: "380px",
                  aspectRatio: "4/5",
                  background: "#0A0A0A",
                  padding: "10px",
                  boxShadow: "0 18px 40px rgba(16,24,40,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                <div className="relative w-full h-full rounded-[18px] overflow-hidden">
                  <img
                    src={activeFeature.imageUrl}
                    alt={activeFeature.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      background: "rgba(255,255,255,0.82)",
                      color: "#0B1220",
                    }}
                  >
                    @seeksy
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Vertical Tab Rail */}
          <div className="flex flex-col gap-3.5 h-full justify-center">
            {features.map((feature) => {
              const isActive = feature.key === activeKey;

              return (
                <button
                  key={feature.key}
                  onClick={() => setActiveKey(feature.key)}
                  className="relative cursor-pointer transition-all duration-300 flex items-center justify-center"
                  style={{
                    width: "78px",
                    height: "130px",
                    background: isActive ? "#0B0B0B" : feature.tabBg,
                    borderRadius: "26px",
                  }}
                >
                  <div
                    className="whitespace-nowrap"
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center center",
                    }}
                  >
                    <span
                      className="font-bold"
                      style={{
                        fontSize: "14px",
                        letterSpacing: "0.02em",
                        color: isActive ? "#FFFFFF" : "#0B1220",
                      }}
                    >
                      {feature.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout */}
        <div
          className="md:hidden w-full rounded-[24px] overflow-hidden"
          style={{
            background: "#E7D6CC",
            padding: "24px",
          }}
        >
          {/* Eyebrow */}
          <p
            className="uppercase mb-3"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#667085",
            }}
          >
            Explore Features
          </p>

          {/* Horizontal Tab Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
            {features.map((feature) => {
              const isActive = feature.key === activeKey;
              return (
                <button
                  key={feature.key}
                  onClick={() => setActiveKey(feature.key)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200"
                  style={{
                    background: isActive ? "#0B0B0B" : feature.tabBg,
                    color: isActive ? "#FFFFFF" : "#0B1220",
                  }}
                >
                  {feature.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey + "-mobile"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <h2
                className="font-extrabold tracking-[-0.01em]"
                style={{
                  fontSize: "28px",
                  lineHeight: 1.1,
                  color: "#0B1220",
                }}
              >
                {activeFeature.title}
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "#667085",
                }}
              >
                {activeFeature.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Mobile Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey + "-mobile-image"}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative mt-4 rounded-[16px] overflow-hidden"
              style={{
                aspectRatio: "4/5",
                background: "#0A0A0A",
                padding: "8px",
              }}
            >
              <div className="relative w-full h-full rounded-[12px] overflow-hidden">
                <img
                  src={activeFeature.imageUrl}
                  alt={activeFeature.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "#0B1220",
                  }}
                >
                  @seeksy
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium mt-4"
            style={{
              background: "#0B0B0B",
              color: "#FFFFFF",
            }}
          >
            Learn more
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
