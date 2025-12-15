import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Podcast, Video, Calendar, Mail, Users, BarChart3, MessageSquare, FileText, DollarSign } from "lucide-react";

const modules = [
  { key: "podcast", label: "Podcast", icon: Podcast, color: "bg-orange-600" },
  { key: "video", label: "Video", icon: Video, color: "bg-rose-600" },
  { key: "meetings", label: "Meetings", icon: Calendar, color: "bg-blue-600" },
  { key: "email", label: "Email", icon: Mail, color: "bg-emerald-600" },
  { key: "crm", label: "CRM", icon: Users, color: "bg-amber-600" },
  { key: "analytics", label: "Analytics", icon: BarChart3, color: "bg-cyan-600" },
  { key: "sms", label: "SMS", icon: MessageSquare, color: "bg-violet-600" },
  { key: "blog", label: "Blog", icon: FileText, color: "bg-teal-600" },
  { key: "monetization", label: "Monetize", icon: DollarSign, color: "bg-pink-600" },
];

const workspaceTemplates = [
  { name: "Podcaster", activeModules: ["podcast", "email", "crm", "analytics"] },
  { name: "Creator", activeModules: ["video", "blog", "monetization", "analytics"] },
  { name: "Agency", activeModules: ["crm", "email", "sms", "meetings", "analytics"] },
  { name: "Solo", activeModules: ["podcast", "video", "blog", "email"] },
];

export function HeroWorkspaceBuilder() {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const currentTemplate = workspaceTemplates[currentTemplateIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTemplateIndex((prev) => (prev + 1) % workspaceTemplates.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const activeModules = modules.filter((m) => currentTemplate.activeModules.includes(m.key));

  return (
    <div className="bg-card rounded-3xl shadow-2xl border border-border/50 p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTemplate.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h3 className="text-lg font-bold text-foreground">
              {currentTemplate.name} Workspace
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeModules.length} modules active
            </p>
          </motion.div>
        </AnimatePresence>
        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <span className="text-base">+</span> Add
        </button>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {modules.map((module) => {
          const isActive = currentTemplate.activeModules.includes(module.key);
          const Icon = module.icon;
          
          return (
            <motion.div
              key={module.key}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={`relative p-3 rounded-t-2xl rounded-b-xl border transition-all duration-200 ${
                isActive 
                  ? "bg-card border-primary/30 shadow-md" 
                  : "bg-muted/30 border-border/50 opacity-50"
              }`}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 30 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={`w-9 h-9 rounded-lg ${module.color} flex items-center justify-center mb-1.5 shadow-md`}>
                <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-medium text-foreground truncate">{module.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Sidebar Preview */}
      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Your Sidebar
        </p>
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {activeModules.slice(0, 4).map((module) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center gap-2 p-2 bg-card rounded-lg"
                >
                  <div className={`w-7 h-7 rounded-md ${module.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{module.label}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Template Indicator */}
      <div className="flex justify-center gap-1.5 mt-4">
        {workspaceTemplates.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentTemplateIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentTemplateIndex 
                ? "bg-primary w-5" 
                : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
