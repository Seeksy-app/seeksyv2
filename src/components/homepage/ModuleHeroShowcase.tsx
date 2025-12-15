import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Import hero images
import heroConversations from "@/assets/homepage/hero-conversations.jpg";
import heroCommunity from "@/assets/homepage/hero-community.jpg";
import heroContent from "@/assets/homepage/hero-content.jpg";
import heroPeople from "@/assets/homepage/hero-people.jpg";

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
    key: "studio_creation",
    titleLight: "AI-Powered",
    titleBold: "Studio",
    description: "Record, edit, and publish professional podcasts and videos in minutes. Our browser-based studio handles noise removal, transcription, and AI-assisted editing—so you can focus on creating.",
    imageUrl: heroConversations,
    ribbonLabel: "AI-Powered Studio",
    ribbonBg: "#E8D4B8",
    side: "left",
  },
  {
    key: "creator_monetization",
    titleLight: "Creator",
    titleBold: "Monetization",
    description: "Turn your audience into revenue. From brand deals and dynamic ad insertion to tips, subscriptions, and digital products—we handle the business so you can get paid.",
    imageUrl: heroCommunity,
    ribbonLabel: "Creator Monetization",
    ribbonBg: "#C4CFC0",
    side: "left",
  },
  {
    key: "identity_verification",
    titleLight: "Voice & Face",
    titleBold: "Verification",
    description: "Protect your identity with blockchain-certified voice and face verification. Prove authenticity, prevent deepfakes, and build trust with your audience and brand partners.",
    imageUrl: heroContent,
    ribbonLabel: "Identity Verification",
    ribbonBg: "#B8C9DC",
    side: "left",
  },
  // Right side tabs
  {
    key: "audience_crm",
    titleLight: "Audience",
    titleBold: "CRM",
    description: "Own your relationships. Manage contacts, segment your audience, automate email campaigns, and track engagement—all in one unified inbox designed for creators.",
    imageUrl: heroPeople,
    ribbonLabel: "Audience CRM",
    ribbonBg: "#D4C4A8",
    side: "right",
  },
  {
    key: "analytics_insights",
    titleLight: "Analytics &",
    titleBold: "Insights",
    description: "Understand what's working. Track downloads, watch time, revenue, and audience growth across all your content with real-time dashboards and custom reports.",
    imageUrl: heroConversations,
    ribbonLabel: "Analytics & Insights",
    ribbonBg: "#C4CFC0",
    side: "right",
  },
  {
    key: "brand_marketplace",
    titleLight: "Brand",
    titleBold: "Marketplace",
    description: "Connect with advertisers who value authentic voices. Browse opportunities, negotiate deals, and manage campaigns—all while maintaining creative control.",
    imageUrl: heroCommunity,
    ribbonLabel: "Brand Marketplace",
    ribbonBg: "#1A1A1A",
    side: "right",
  },
];

export function ModuleHeroShowcase() {
  const [activeKey, setActiveKey] = useState("creator_monetization");
  const activeModule = modules.find((m) => m.key === activeKey) || modules[0];

  // When a tab is selected, it flips to the opposite side
  // Left tabs (when active) move to become the rightmost active tab
  // Right tabs (when active) move to become the leftmost active tab
  const getTabsForSide = (side: "left" | "right") => {
    const inactiveTabs = modules.filter((m) => m.key !== activeKey && m.side === side);
    
    if (side === "left") {
      // If active module was originally on left, it's now on right - show remaining left tabs
      // If active module was originally on right, it flips to left - show it plus remaining left tabs
      if (activeModule.side === "right") {
        return [activeModule, ...inactiveTabs];
      }
      return inactiveTabs;
    } else {
      // If active module was originally on right, it's now on left - show remaining right tabs
      // If active module was originally on left, it flips to right - show it plus remaining right tabs
      if (activeModule.side === "left") {
        return [...inactiveTabs, activeModule];
      }
      return inactiveTabs;
    }
  };

  const leftTabs = getTabsForSide("left");
  const rightTabs = getTabsForSide("right");

  const renderTab = (module: ModuleData, index: number, isFirst: boolean, isLast: boolean, totalTabs: number) => {
    const isActive = module.key === activeKey;
    
    return (
      <motion.button
        key={module.key}
        layoutId={module.key}
        onClick={() => setActiveKey(module.key)}
        className="relative cursor-pointer transition-colors duration-200 hover:opacity-95 h-full"
        style={{
          width: isActive ? "90px" : "70px",
          background: isActive ? "#0A0A0A" : module.ribbonBg,
          zIndex: isActive ? 10 : (totalTabs - index),
          borderRadius: isFirst ? "32px 0 0 32px" : isLast ? "0 32px 32px 0" : "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        transition={{ type: "spring", stiffness: 180, damping: 28, mass: 1.2 }}
      >
        <span
          className="whitespace-nowrap leading-none font-semibold text-center"
          style={{
            fontSize: "38px",
            letterSpacing: "-0.02em",
            color: isActive ? "#FFFFFF" : "rgba(11, 15, 26, 0.85)",
            transform: "rotate(-90deg)",
            transformOrigin: "center center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {module.ribbonLabel}
        </span>
      </motion.button>
    );
  };

  return (
    <section className="w-full px-4 py-24 md:py-32">
      {/* Single container */}
      <div
        className="mx-auto max-w-[1400px] rounded-[32px] overflow-hidden flex"
        style={{
          background: "#C4CFC0",
          height: "705px",
        }}
      >
        {/* Desktop Layout */}
        <LayoutGroup>
          <div className="hidden md:flex w-full h-full">
            {/* Left: Vertical Tabs */}
            <div className="flex-shrink-0 flex h-full">
              {leftTabs.map((module, index) => 
                renderTab(module, index, index === 0, false, leftTabs.length)
              )}
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
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
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
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
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
            {rightTabs.map((module, index) => 
              renderTab(module, index, false, index === rightTabs.length - 1, rightTabs.length)
            )}
          </div>
        </div>
        </LayoutGroup>

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
