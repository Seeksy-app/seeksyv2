import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Podcast, Video, Calendar, Mail, Users, BarChart3, MessageSquare, FileText, DollarSign, GripVertical } from "lucide-react";

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
  const [sidebarModules, setSidebarModules] = useState<string[]>([]);
  const [animatingModule, setAnimatingModule] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'flying' | 'landing'>('idle');
  const gridRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const currentTemplate = workspaceTemplates[currentTemplateIndex];

  // Auto-cycle templates
  useEffect(() => {
    const interval = setInterval(() => {
      if (animationPhase === 'idle') {
        setCurrentTemplateIndex((prev) => (prev + 1) % workspaceTemplates.length);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [animationPhase]);

  // Animate modules being "dragged" to sidebar when template changes
  useEffect(() => {
    const newActiveModules = currentTemplate.activeModules.slice(0, 4);
    
    // Clear sidebar first
    setSidebarModules([]);
    
    // Animate each module one by one
    const animateModules = async () => {
      for (let i = 0; i < newActiveModules.length; i++) {
        const moduleKey = newActiveModules[i];
        
        // Start flying animation
        setAnimatingModule(moduleKey);
        setAnimationPhase('flying');
        
        // Wait for fly animation
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Add to sidebar
        setSidebarModules(prev => [...prev, moduleKey]);
        setAnimationPhase('landing');
        
        // Wait for landing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setAnimatingModule(null);
        setAnimationPhase('idle');
        
        // Small delay before next module
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    };
    
    animateModules();
  }, [currentTemplate]);

  const activeModules = modules.filter((m) => currentTemplate.activeModules.includes(m.key));
  const sidebarItems = sidebarModules.map(key => modules.find(m => m.key === key)).filter(Boolean);

  return (
    <div className="bg-card rounded-3xl shadow-2xl border border-border/50 p-6 md:p-7">
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
            <h3 className="text-xl font-extrabold text-foreground">
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

      {/* Module Grid - Available Seekies */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Seekies
        </p>
      </div>
      <div ref={gridRef} className="grid grid-cols-3 gap-2.5 mb-5 relative">
        {modules.map((module) => {
          const isInSidebar = sidebarModules.includes(module.key);
          const isAnimating = animatingModule === module.key;
          const Icon = module.icon;
          
          return (
            <motion.div
              key={module.key}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={`relative p-3.5 rounded-t-2xl rounded-b-xl border transition-all duration-200 ${
                isInSidebar
                  ? "bg-muted/30 border-border/50 opacity-40"
                  : "bg-card border-primary/20 shadow-md"
              }`}
              style={{
                opacity: isAnimating ? 0.3 : undefined,
              }}
            >
              <div className={`w-10 h-10 rounded-lg ${module.color} flex items-center justify-center mb-2 shadow-md`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-medium text-foreground truncate">{module.label}</p>
            </motion.div>
          );
        })}
        
        {/* Flying module animation overlay - from grid to workspace */}
        <AnimatePresence>
          {animatingModule && animationPhase === 'flying' && (() => {
            const module = modules.find(m => m.key === animatingModule);
            if (!module) return null;
            const Icon = module.icon;
            const moduleIndex = modules.findIndex(m => m.key === animatingModule);
            const col = moduleIndex % 3;
            const row = Math.floor(moduleIndex / 3);
            
            return (
              <motion.div
                key={`flying-${animatingModule}`}
                initial={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{ 
                  opacity: 1,
                  scale: 0.85,
                  x: col === 0 ? 40 : col === 1 ? 0 : -40,
                  y: 220 - (row * 60),
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute z-50 pointer-events-none"
                style={{
                  left: `${(col * 33.33) + 16}%`,
                  top: `${(row * 33) + 10}%`,
                }}
              >
                <div className="p-3 rounded-xl bg-card border border-primary shadow-xl">
                  <div className={`w-10 h-10 rounded-lg ${module.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] font-medium text-foreground truncate text-center mt-1">{module.label}</p>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Workspace - where modules land */}
      <div ref={sidebarRef} className="bg-muted/50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Your Workspace
          </p>
          <p className="text-[9px] text-muted-foreground">
            ↕ Drag to reorder
          </p>
        </div>
        <div className="space-y-1.5 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {sidebarItems.map((module) => {
              if (!module) return null;
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.key}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                  }}
                  className="flex items-center gap-2 p-2 bg-card rounded-lg shadow-sm"
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground/50" />
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