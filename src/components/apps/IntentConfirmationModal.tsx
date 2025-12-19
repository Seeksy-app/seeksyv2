import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, Check, Sparkles, Lock, Zap, 
  ChevronDown, ChevronUp, Info
} from "lucide-react";
import { UserIntent, getRequiredModules, getEnhancingModules } from "@/config/moduleRelationships";
import { SEEKSY_MODULES } from "@/components/modules/moduleData";
import { cn } from "@/lib/utils";

interface IntentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  intent: UserIntent | null;
  installedModuleIds: string[];
  onConfirm: (moduleIds: string[]) => void;
}

export function IntentConfirmationModal({
  isOpen,
  onClose,
  intent,
  installedModuleIds,
  onConfirm,
}: IntentConfirmationModalProps) {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  if (!intent) return null;

  const Icon = intent.icon;

  // Get all modules for this intent
  const suggestedModules = intent.suggestedModules
    .map(id => SEEKSY_MODULES.find(m => m.id === id))
    .filter(Boolean);

  // Calculate required and optional modules
  const allRequiredIds = new Set<string>();
  intent.suggestedModules.forEach(moduleId => {
    getRequiredModules(moduleId).forEach(r => allRequiredIds.add(r.moduleId));
  });

  const isModuleRequired = (moduleId: string) => allRequiredIds.has(moduleId);
  const isModuleInstalled = (moduleId: string) => installedModuleIds.includes(moduleId);

  // Initialize selection when modal opens
  useState(() => {
    const initial = new Set<string>();
    intent.suggestedModules.forEach(id => {
      if (!isModuleInstalled(id)) {
        initial.add(id);
      }
    });
    // Add required modules
    allRequiredIds.forEach(id => {
      if (!isModuleInstalled(id)) {
        initial.add(id);
      }
    });
    setSelectedModules(initial);
  });

  const toggleModule = (moduleId: string) => {
    if (isModuleRequired(moduleId)) return; // Can't unselect required
    
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const toInstall = Array.from(selectedModules).filter(id => !isModuleInstalled(id));
    onConfirm(toInstall);
    onClose();
  };

  const newModulesCount = Array.from(selectedModules).filter(id => !isModuleInstalled(id)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <motion.div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                `bg-gradient-to-br ${intent.color}`
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <DialogTitle className="text-xl">{intent.label}</DialogTitle>
              <DialogDescription>{intent.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Workflow Preview */}
        <div className="p-4 rounded-xl bg-muted/50 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-medium">Your workflow</span>
          </div>
          <p className="text-sm text-foreground">{intent.workflow}</p>
        </div>

        {/* Module Selection */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Modules to install ({newModulesCount} new)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? "Less" : "More"} details
            </Button>
          </div>

          {suggestedModules.map((module, index) => {
            if (!module) return null;
            const ModIcon = module.icon;
            const isRequired = isModuleRequired(module.id);
            const isInstalled = isModuleInstalled(module.id);
            const isSelected = selectedModules.has(module.id) || isInstalled;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all",
                  isInstalled 
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                    : isSelected
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card border-border hover:border-primary/50"
                )}
                onClick={() => !isInstalled && toggleModule(module.id)}
              >
                <div className="pt-0.5">
                  {isInstalled ? (
                    <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <Checkbox
                      checked={isSelected}
                      disabled={isRequired}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  )}
                </div>

                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  module.bgGradient || "bg-muted"
                )}>
                  <ModIcon className={cn("w-5 h-5", module.iconColor)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{module.name}</span>
                    {isInstalled && (
                      <Badge variant="outline" className="text-xs text-emerald-600">
                        Already installed
                      </Badge>
                    )}
                    {isRequired && !isInstalled && (
                      <Badge variant="destructive" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Required
                      </Badge>
                    )}
                    {module.isAIPowered && (
                      <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-muted-foreground mt-1"
                      >
                        {module.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={newModulesCount === 0}
            className={cn("gap-2 bg-gradient-to-r", intent.color)}
          >
            {newModulesCount > 0 ? (
              <>
                Install {newModulesCount} module{newModulesCount !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                All installed
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
