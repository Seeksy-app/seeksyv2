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
}

const modules: ModuleData[] = [
  {
    key: "studio_creation",
    titleLight: "AI-Powered",
    titleBold: "Studio",
    description: "Record, edit, and publish professional podcasts and videos in minutes. Our browser-based studio handles noise removal, transcription, and AI-assisted editing—so you can focus on creating.",
    imageUrl: heroConversations,
    ribbonLabel: "AI-Powered Studio",
    ribbonBg: "#E8D4B8",
  },
  {
    key: "creator_monetization",
    titleLight: "Creator",
    titleBold: "Monetization",
    description: "Turn your audience into revenue. From brand deals and dynamic ad insertion to tips, subscriptions, and digital products—we handle the business so you can get paid.",
    imageUrl: heroCommunity,
    ribbonLabel: "Creator Monetization",
    ribbonBg: "#C4CFC0",
  },
  {
    key: "identity_verification",
    titleLight: "Voice & Face",
    titleBold: "Verification",
    description: "Protect your identity with blockchain-certified voice and face verification. Prove authenticity, prevent deepfakes, and build trust with your audience and brand partners.",
    imageUrl: heroContent,
    ribbonLabel: "Identity Verification",
    ribbonBg: "#B8C9DC",
  },
  {
    key: "audience_crm",
    titleLight: "Audience",
    titleBold: "CRM",
    description: "Own your relationships. Manage contacts, segment your audience, automate email campaigns, and track engagement—all in one unified inbox designed for creators.",
    imageUrl: heroPeople,
    ribbonLabel: "Audience CRM",
    ribbonBg: "#D4C4A8",
  },
  {
    key: "analytics_insights",
    titleLight: "Analytics &",
    titleBold: "Insights",
    description: "Understand what's working. Track downloads, watch time, revenue, and audience growth across all your content with real-time dashboards and custom reports.",
    imageUrl: heroConversations,
    ribbonLabel: "Analytics & Insights",
    ribbonBg: "#C4CFC0",
  },
  {
    key: "brand_marketplace",
    titleLight: "Brand",
    titleBold: "Marketplace",
    description: "Connect with advertisers who value authentic voices. Browse opportunities, negotiate deals, and manage campaigns—all while maintaining creative control.",
    imageUrl: heroCommunity,
    ribbonLabel: "Brand Marketplace",
    ribbonBg: "#E8D5CB",
  },
];

export function ModuleHeroShowcase() {
  // Track which modules have been clicked (moved to left)
  const [clickedKeys, setClickedKeys] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const activeModule = activeKey 
    ? modules.find((m) => m.key === activeKey) 
    : null;

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    setClickedKeys((prev) => new Set(prev).add(key));
  };

  // Split modules: clicked ones on left, unclicked on right
  const leftTabs = modules.filter((m) => clickedKeys.has(m.key));
  const rightTabs = modules.filter((m) => !clickedKeys.has(m.key));

  const renderTab = (
    module: ModuleData, 
    index: number, 
    isFirst: boolean, 
    isLast: boolean,
    side: "left" | "right"
  ) => {
    const isActive = module.key === activeKey;
    
    // Rounded corners: left-side first tab gets top-left rounded, right-side last tab gets top-right rounded
    let borderRadius = "0";
    if (side === "left" && isFirst) {
      borderRadius = "24px 0 0 24px";
    } else if (side === "right" && isLast) {
      borderRadius = "0 24px 24px 0";
    }

    return (
      <motion.button
        key={module.key}
        layoutId={module.key}
        onClick={() => handleTabClick(module.key)}
        className="relative cursor-pointer transition-colors duration-200 hover:opacity-90 h-full flex items-center justify-center"
        style={{
          width: isActive ? "85px" : "65px",
          background: isActive ? "#0A0A0A" : module.ribbonBg,
          borderRadius,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        <span
          className="whitespace-nowrap leading-none font-semibold"
          style={{
            fontSize: isActive ? "32px" : "28px",
            letterSpacing: "-0.02em",
            color: isActive ? "#FFFFFF" : "rgba(11, 15, 26, 0.85)",
            transform: "rotate(-90deg)",
            transformOrigin: "center center",
          }}
        >
          {module.ribbonLabel}
        </span>
      </motion.button>
    );
  };

  // Default content when nothing is selected
  const defaultContent = {
    titleLight: "Explore",
    titleBold: "Features",
    description: "Click on any tab to learn more about our powerful creator tools. Each module is designed to help you create, connect, and monetize your content.",
    imageUrl: heroConversations,
  };

  const displayContent = activeModule || defaultContent;

  return (
    <section className="w-full px-4 py-24 md:py-32">
      <div
        className="mx-auto max-w-[1400px] rounded-[32px] overflow-hidden flex"
        style={{
          background: "hsl(var(--muted)/0.5)",
          minHeight: "680px",
        }}
      >
        {/* Desktop Layout */}
        <LayoutGroup>
          <div className="hidden md:flex w-full h-full" style={{ minHeight: "680px" }}>
            {/* Left: Clicked Tabs */}
            <div className="flex-shrink-0 flex h-full">
              {leftTabs.map((module, index) => 
                renderTab(module, index, index === 0, index === leftTabs.length - 1, "left")
              )}
            </div>

            {/* Center: Content Area */}
            <div 
              className="flex-1 flex h-full rounded-[24px] mx-2 my-4"
              style={{ background: "#0A0A0A" }}
            >
              {/* Text Block */}
              <div className="flex-shrink-0 w-[400px] p-10 flex flex-col justify-between h-full">
                <div className="flex flex-col gap-6 pt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeKey || "default"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="flex flex-col gap-5"
                    >
                      <h2
                        className="tracking-[-0.03em]"
                        style={{
                          fontSize: "48px",
                          lineHeight: 1.1,
                          color: "#FFFFFF",
                        }}
                      >
                        <span className="font-light">{displayContent.titleLight}</span>{" "}
                        <span className="font-black">{displayContent.titleBold}</span>
                      </h2>
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: 1.7,
                          color: "rgba(255, 255, 255, 0.7)",
                          maxWidth: "340px",
                        }}
                      >
                        {displayContent.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <button
                  className="group w-fit flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-150"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#FFFFFF",
                  }}
                >
                  learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Image */}
              <div className="flex-1 relative h-full p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeKey || "default-image"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    className="h-full"
                  >
                    <div className="relative w-full h-full rounded-[20px] overflow-hidden border-4 border-white/20">
                      <img
                        src={displayContent.imageUrl}
                        alt={displayContent.titleLight + " " + displayContent.titleBold}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium"
                        style={{
                          background: "rgba(255,255,255,0.9)",
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

            {/* Right: Unclicked Tabs */}
            <div className="flex-shrink-0 flex h-full">
              {rightTabs.map((module, index) => 
                renderTab(module, index, index === 0, index === rightTabs.length - 1, "right")
              )}
            </div>
          </div>
        </LayoutGroup>

        {/* Mobile Layout */}
        <div className="md:hidden w-full p-6 flex flex-col gap-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey || "default-mobile"}
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
                  color: "hsl(var(--foreground))",
                }}
              >
                <span className="font-normal">{displayContent.titleLight}</span>{" "}
                <span className="font-black">{displayContent.titleBold}</span>
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {displayContent.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey || "default-mobile-image"}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative aspect-[4/5] rounded-[16px] overflow-hidden"
            >
              <img
                src={displayContent.imageUrl}
                alt={displayContent.titleLight + " " + displayContent.titleBold}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {modules.map((module) => {
              const isClicked = clickedKeys.has(module.key);
              const isActive = module.key === activeKey;
              return (
                <button
                  key={module.key}
                  onClick={() => handleTabClick(module.key)}
                  className="flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all duration-150"
                  style={{
                    background: isActive ? "#0A0A0A" : isClicked ? "hsl(var(--primary)/0.2)" : module.ribbonBg,
                    color: isActive ? "#FFFFFF" : "hsl(var(--foreground))",
                  }}
                >
                  {module.ribbonLabel}
                </button>
              );
            })}
          </div>

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
