import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Sparkles, Mic, PieChart, Image, Layout, Scissors, Podcast, Instagram, Users, Megaphone, Target, Calendar, FormInput, Zap, MessageCircle, UserPlus, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RecommendedToolsStepProps {
  tools: string[];
  onContinue: () => void;
  onBack: () => void;
}

const toolIconMap: Record<string, any> = {
  'Studio & Recording': Mic,
  'Social Analytics': PieChart,
  'Media Library': Image,
  'My Page Builder': Layout,
  'Clips & Editing': Scissors,
  'Podcasts': Podcast,
  'Social Connect': Instagram,
  'Contacts & Audience': Users,
  'Campaigns': Megaphone,
  'Segments': Target,
  'Events': Calendar,
  'Forms': FormInput,
  'Automations': Zap,
  'SMS': MessageCircle,
  'Team & Collaboration': UserPlus,
  'Proposals': FileText,
  'Identity & Verification': Shield,
};

const toolDescriptions: Record<string, string> = {
  'Studio & Recording': 'Record HD audio & video',
  'Social Analytics': 'Track your growth metrics',
  'Media Library': 'Organize all your content',
  'My Page Builder': 'Create your public profile',
  'Clips & Editing': 'AI-powered clip generation',
  'Podcasts': 'Manage your podcast',
  'Social Connect': 'Import social data',
  'Contacts & Audience': 'Manage your audience',
  'Campaigns': 'Run marketing campaigns',
  'Segments': 'Target specific audiences',
  'Events': 'Create and manage events',
  'Forms': 'Collect information',
  'Automations': 'Automate workflows',
  'SMS': 'Text messaging',
  'Team & Collaboration': 'Work together',
  'Proposals': 'Create proposals',
  'Identity & Verification': 'Verify your identity',
};

export function RecommendedToolsStep({ tools, onContinue, onBack }: RecommendedToolsStepProps) {
  return (
    <Card className="p-8 shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Header with icon */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-brand-gold to-brand-orange mb-2"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold">Your Personalized Workspace Setup</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Based on your answers, these tools will be auto-activated in your workspace. You can always add or remove tools later.
          </p>
        </div>

        {/* Tools Grid - 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {tools.map((tool, index) => {
            const Icon = toolIconMap[tool] || Sparkles;
            const description = toolDescriptions[tool] || 'Essential tool';
            
            return (
              <motion.div
                key={tool}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className={cn(
                  "relative flex items-center gap-3 p-4 rounded-xl",
                  "bg-gradient-to-b from-primary/5 to-transparent border border-primary/20",
                  "hover:border-primary/40 hover:scale-[1.02] transition-all duration-200"
                )}>
                  {/* Check badge */}
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                  
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <p className="font-semibold text-sm truncate">{tool}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-lg bg-muted/50 border border-border text-center"
        >
          <p className="text-sm text-muted-foreground">
            ✨ You'll be able to customize your workspace anytime from the dashboard
          </p>
        </motion.div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onContinue} 
            className="gap-2 bg-gradient-to-r from-brand-gold to-brand-orange hover:from-brand-orange hover:to-brand-gold text-slate-900 font-semibold"
          >
            Preview My Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
