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
  side: "left" | "right";
}

const modules: ModuleData[] = [
  // Left side tabs
  {
    key: "share_influence",
    titleLight: "Share of",
    titleBold: "Influence",
    description: "Track your reach and influence across platforms. Understand how your content performs and where your audience engages most.",
    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1000&fit=crop",
    ribbonLabel: "Share of Influence",
    ribbonBg: "#D4C4A8",
    side: "left",
  },
  {
    key: "quick_turn",
    titleLight: "Quick-Turn",
    titleBold: "Content",
    description: "Create and publish content in record time. Our AI-powered tools help you produce professional content faster than ever before.",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=1000&fit=crop",
    ribbonLabel: "Quick-Turn Content",
    ribbonBg: "#C4CFC0",
    side: "left",
  },
  // Right side tabs
  {
    key: "seeding_boxes",
    titleLight: "Seeding and",
    titleBold: "Custom Boxes",
    description: "Send curated product packages to creators and influencers. Track unboxings, manage inventory, and measure campaign impact.",
    imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=1000&fit=crop",
    ribbonLabel: "Seeding and Custom Boxes",
    ribbonBg: "#C4CFC0",
    side: "right",
  },
  {
    key: "ugc_commerce",
    titleLight: "UGC For",
    titleBold: "Commerce",
    description: "Turn user-generated content into shoppable experiences. Connect authentic creator content directly to your product pages.",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=1000&fit=crop",
    ribbonLabel: "UGC For Commerce",
    ribbonBg: "#B8C9DC",
    side: "right",
  },
  {
    key: "custom_reporting",
    titleLight: "Proprietary",
    titleBold: "Custom Reporting",
    description: "Get insights that matter with custom dashboards and reports. Track ROI, engagement, and campaign performance in real-time.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=1000&fit=crop",
    ribbonLabel: "Proprietary Custom Reporting",
    ribbonBg: "#1A1A1A",
    side: "right",
  },
];

export function ModuleHeroShowcase() {
  const [activeKey, setActiveKey] = useState("quick_turn");
  const activeModule = modules.find((m) => m.key === activeKey) || modules[0];

  const leftTabs = modules.filter((m) => m.side === "left");
  const rightTabs = modules.filter((m) => m.side === "right");

  return (
    <section className="w-full px-4 py-24 md:py-32">
      {/* Single container - 30% larger height */}
      <div
        className="mx-auto max-w-[1400px] rounded-[32px] overflow-hidden flex"
        style={{
          background: activeModule.side === "left" ? "#C4CFC0" : "#C4CFC0",
          height: "830px",
        }}
      >
        {/* Desktop Layout */}
        <div className="hidden md:flex w-full h-full">
          {/* Left: Vertical Tabs */}
          <div className="flex-shrink-0 flex h-full">
            {leftTabs.map((module, index) => {
              const isActive = module.key === activeKey;
              const isFirst = index === 0;
              
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveKey(module.key)}
                  className="relative cursor-pointer transition-all duration-200 hover:opacity-95 h-full flex items-center justify-center"
                  style={{
                    width: isActive ? "80px" : "64px",
                    background: isActive ? "#0A0A0A" : module.ribbonBg,
                    zIndex: isActive ? 10 : (5 - index),
                    borderRadius: isFirst ? "32px 0 0 32px" : "0",
                  }}
                >
                  <span
                    className="whitespace-nowrap text-center"
                    style={{
                      fontSize: "24px",
                      letterSpacing: "-0.01em",
                      color: isActive ? "#FFFFFF" : "rgba(11, 15, 26, 0.85)",
                      fontWeight: isActive ? 700 : 400,
                      transform: "rotate(-90deg)",
                      transformOrigin: "center center",
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>{module.titleLight}</span>{" "}
                    <span style={{ fontWeight: 700 }}>{module.titleBold}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center: Text + Image */}
          <div className="flex-1 flex h-full">
            {/* Text Block */}
            <div className="flex-shrink-0 w-[380px] p-12 flex flex-col justify-between h-full">
              <div className="flex flex-col gap-6 pt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeModule.key + "-text"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex flex-col gap-6"
                  >
                    {/* Large headline */}
                    <h2
                      className="tracking-[-0.03em]"
                      style={{
                        fontSize: "56px",
                        lineHeight: 1.05,
                        color: "#0B0F1A",
                      }}
                    >
                      <span className="font-medium">{activeModule.titleLight}</span>
                      <br />
                      <span className="font-black">{activeModule.titleBold}</span>
                    </h2>
                    <p
                      style={{
                        fontSize: "17px",
                        lineHeight: 1.7,
                        color: "rgba(11, 15, 26, 0.7)",
                        maxWidth: "360px",
                      }}
                    >
                      {activeModule.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CTA */}
              <button
                className="group w-fit flex items-center gap-2 px-7 py-4 rounded-full text-base font-medium transition-all duration-[140ms] ease-out"
                style={{
                  background: "#0A0A0A",
                  color: "#FFFFFF",
                }}
              >
                learn more
                <ArrowRight className="h-4 w-4 transition-transform duration-[140ms] ease-out group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 relative h-full py-6 pr-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModule.key + "-image"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="relative w-full h-full rounded-[24px] overflow-hidden">
                    <img
                      src={activeModule.imageUrl}
                      alt={activeModule.titleLight + " " + activeModule.titleBold}
                      className="w-full h-full object-cover"
                    />
                    {/* Creator tag */}
                    <div 
                      className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-lg text-base font-medium"
                      style={{
                        background: "rgba(255,255,255,0.85)",
                        color: "#0B0F1A",
                      }}
                    >
                      @seeksy
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Vertical Tabs */}
          <div className="flex-shrink-0 flex h-full">
            {rightTabs.map((module, index) => {
              const isActive = module.key === activeKey;
              const isLast = index === rightTabs.length - 1;
              
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveKey(module.key)}
                  className="relative cursor-pointer transition-all duration-200 hover:opacity-95 h-full flex items-center justify-center"
                  style={{
                    width: isActive ? "80px" : "64px",
                    background: isActive ? "#0A0A0A" : module.ribbonBg,
                    zIndex: isActive ? 10 : (5 - index),
                    borderRadius: isLast ? "0 32px 32px 0" : "0",
                  }}
                >
                  <span
                    className="whitespace-nowrap text-center"
                    style={{
                      fontSize: "24px",
                      letterSpacing: "-0.01em",
                      color: isActive ? "#FFFFFF" : "rgba(11, 15, 26, 0.85)",
                      fontWeight: isActive ? 700 : 400,
                      transform: "rotate(-90deg)",
                      transformOrigin: "center center",
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>{module.titleLight}</span>{" "}
                    <span style={{ fontWeight: 700 }}>{module.titleBold}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full p-6 flex flex-col gap-6 overflow-y-auto">
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
                  fontSize: "32px",
                  lineHeight: 1.1,
                  color: "#0B0F1A",
                }}
              >
                <span className="font-normal">{activeModule.titleLight}</span>{" "}
                <span className="font-black">{activeModule.titleBold}</span>
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "rgba(11, 15, 26, 0.7)",
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
