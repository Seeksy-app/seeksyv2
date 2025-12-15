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
  tabLabel: string;
  tabLabelBold: string;
  title: string;
  titleBold: string;
  description: string;
  imageUrl: string;
  tabBg: string;
}

const features: FeatureData[] = [
  {
    key: "influence",
    tabLabel: "Share of",
    tabLabelBold: "Influence",
    title: "Share of",
    titleBold: "Influence",
    description: "Build authentic influence with verified identity and audience trust. Track your reach, engagement, and brand value across all platforms.",
    imageUrl: heroConversations,
    tabBg: "#EAD6CC", // Warm sand/peach
  },
  {
    key: "content",
    tabLabel: "Quick-Turn",
    tabLabelBold: "Content",
    title: "Quick-Turn",
    titleBold: "Content",
    description: "Create professional content in minutes, not hours. AI-powered editing, transcription, and multi-format exports—all from your browser.",
    imageUrl: heroCommunity,
    tabBg: "#C4CFC4", // Sage green
  },
  {
    key: "ambassador",
    tabLabel: "Always-On",
    tabLabelBold: "Ambassador Programs",
    title: "Always-On",
    titleBold: "Ambassador Programs",
    description: "Manage long-term creator partnerships with automated payments, content tracking, and performance analytics built for scale.",
    imageUrl: heroContent,
    tabBg: "#B8C9DC", // Light blue
  },
  {
    key: "seeding",
    tabLabel: "Seeding",
    tabLabelBold: "and Custom Boxes",
    title: "Seeding and",
    titleBold: "Custom Boxes",
    description: "Send products to the right creators with curated seeding campaigns. Track unboxing content, measure impact, and build genuine advocacy.",
    imageUrl: heroPeople,
    tabBg: "#D4D0C8", // Warm gray/sand
  },
  {
    key: "commerce",
    tabLabel: "UGC For",
    tabLabelBold: "Commerce",
    title: "UGC For",
    titleBold: "Commerce",
    description: "Transform creator content into shoppable experiences. Connect authentic voices to your products and track ROI across every campaign.",
    imageUrl: heroConversations,
    tabBg: "#E8DDD4", // Light beige
  },
];

export function ModuleHeroShowcase() {
  const [activeKey, setActiveKey] = useState<string>("seeding");

  const activeFeature = features.find((f) => f.key === activeKey) || features[3];

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        {/* Desktop Layout - 3 columns: tabs | content | image */}
        <div 
          className="hidden md:grid rounded-[32px] overflow-hidden"
          style={{ 
            gridTemplateColumns: "auto 1fr auto",
            minHeight: "580px",
            background: "#F5F0EB",
          }}
        >
          {/* LEFT: Vertical Tab Rail */}
          <div className="flex h-full">
            {features.map((feature, index) => {
              const isActive = feature.key === activeKey;
              const isFirst = index === 0;
              
              return (
                <button
                  key={feature.key}
                  onClick={() => setActiveKey(feature.key)}
                  className="relative cursor-pointer transition-all duration-300 flex items-center justify-center"
                  style={{
                    width: isActive ? "75px" : "60px",
                    height: "100%",
                    background: isActive ? "#0A0A0A" : feature.tabBg,
                    borderRadius: isFirst ? "0" : "0",
                  }}
                >
                  <div
                    className="whitespace-nowrap flex flex-col items-center gap-0.5"
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center center",
                    }}
                  >
                    <span
                      className="font-normal"
                      style={{
                        fontSize: isActive ? "18px" : "16px",
                        color: isActive ? "#FFFFFF" : "rgba(11, 18, 32, 0.75)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {feature.tabLabel}
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: isActive ? "18px" : "16px",
                        color: isActive ? "#FFFFFF" : "rgba(11, 18, 32, 0.9)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {feature.tabLabelBold}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER: Content Area */}
          <div className="flex-1 p-12 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col gap-6 max-w-[520px]"
              >
                <h2
                  className="tracking-[-0.02em]"
                  style={{
                    fontSize: "48px",
                    lineHeight: 1.05,
                    color: "#0B1220",
                  }}
                >
                  <span className="font-normal">{activeFeature.title}</span>{" "}
                  <span className="font-black">{activeFeature.titleBold}</span>
                </h2>
                <p
                  style={{
                    fontSize: "17px",
                    lineHeight: 1.7,
                    color: "#667085",
                    maxWidth: "460px",
                  }}
                >
                  {activeFeature.description}
                </p>
                <button
                  className="group w-fit flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all duration-200 mt-4"
                  style={{
                    background: "#0A0A0A",
                    color: "#FFFFFF",
                  }}
                >
                  learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Image Card */}
          <div className="p-6 flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey + "-image"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="relative rounded-[24px] overflow-hidden"
                style={{
                  width: "340px",
                  height: "480px",
                  background: "#0A0A0A",
                  padding: "12px",
                  boxShadow: "0 24px 60px rgba(16,24,40,0.18)",
                }}
              >
                <div className="relative w-full h-full rounded-[16px] overflow-hidden">
                  <img
                    src={activeFeature.imageUrl}
                    alt={activeFeature.title + " " + activeFeature.titleBold}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      background: "rgba(255,255,255,0.92)",
                      color: "#0B1220",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    @seeksy
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Layout */}
        <div 
          className="md:hidden w-full rounded-[24px] overflow-hidden"
          style={{ background: "#F5F0EB" }}
        >
          {/* Horizontal Tab Scroll */}
          <div className="flex gap-2 overflow-x-auto p-4 pb-2">
            {features.map((feature) => {
              const isActive = feature.key === activeKey;
              return (
                <button
                  key={feature.key}
                  onClick={() => setActiveKey(feature.key)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200"
                  style={{
                    background: isActive ? "#0A0A0A" : feature.tabBg,
                    color: isActive ? "#FFFFFF" : "#0B1220",
                  }}
                >
                  {feature.tabLabelBold}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey + "-mobile"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <h2
                  className="tracking-[-0.02em]"
                  style={{
                    fontSize: "28px",
                    lineHeight: 1.1,
                    color: "#0B1220",
                  }}
                >
                  <span className="font-normal">{activeFeature.title}</span>{" "}
                  <span className="font-black">{activeFeature.titleBold}</span>
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
                transition={{ duration: 0.25 }}
                className="relative mt-5 rounded-[16px] overflow-hidden"
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
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium"
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
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium mt-5"
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
      </div>
    </section>
  );
}
