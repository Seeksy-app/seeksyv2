import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, Mic, PieChart, Image, Layout, Scissors, Podcast, Instagram, Users, Megaphone, Target, Calendar, FormInput, Zap, MessageCircle, UserPlus, FileText } from 'lucide-react';
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
};

export function RecommendedToolsStep({ tools, onContinue, onBack }: RecommendedToolsStepProps) {
  return (
    <Card className="p-8 shadow-xl border-border/50">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Your Recommended Tools</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Based on your answers, these tools will be auto-activated in your workspace.
          </p>
        </div>

        {/* Tools Grid - 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {tools.map((tool, index) => {
            const Icon = toolIconMap[tool] || CheckCircle2;
            const description = toolDescriptions[tool] || 'Essential tool';
            
            return (
              <motion.div
                key={tool}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-xl",
                  "bg-primary/5 border border-primary/20",
                  "hover:bg-primary/10 transition-colors"
                )}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{tool}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-auto" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onContinue} className="gap-2">
            Preview My Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
