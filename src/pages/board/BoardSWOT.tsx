import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Grid3X3,
  List,
  PieChart,
  LayoutGrid,
  Info,
  Copy,
  Bot,
  Sparkles,
  X,
  Clock,
  User,
  Loader2,
} from 'lucide-react';

type ViewMode = 'quadrant' | 'stack' | 'radial' | 'tabs';
type SwotCategory = 'strength' | 'weakness' | 'opportunity' | 'threat';

interface SwotItem {
  id: string;
  title: string;
  category: SwotCategory;
  description: string;
  whyItMatters: string[];
  boardConsiderations: string[];
}

interface CFOSwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  ai_summary?: string | null;
  last_updated_by_name?: string;
  last_updated_at?: string;
}

const categoryConfig: Record<SwotCategory, {
  title: string;
  subtitle: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  pillBg: string;
  pillHover: string;
}> = {
  strength: {
    title: 'Strengths',
    subtitle: 'Internal • Positive',
    emoji: '💪',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBgColor: 'bg-emerald-100',
    pillBg: 'bg-white border border-emerald-200',
    pillHover: 'hover:border-emerald-400 hover:shadow-md',
  },
  weakness: {
    title: 'Weaknesses',
    subtitle: 'Internal • Negative',
    emoji: '⚠️',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconBgColor: 'bg-rose-100',
    pillBg: 'bg-white border border-rose-200',
    pillHover: 'hover:border-rose-400 hover:shadow-md',
  },
  opportunity: {
    title: 'Opportunities',
    subtitle: 'External • Positive',
    emoji: '🎯',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBgColor: 'bg-amber-100',
    pillBg: 'bg-white border border-amber-200',
    pillHover: 'hover:border-amber-400 hover:shadow-md',
  },
  threat: {
    title: 'Threats',
    subtitle: 'External • Negative',
    emoji: '🛡️',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconBgColor: 'bg-slate-100',
    pillBg: 'bg-white border border-slate-200',
    pillHover: 'hover:border-slate-400 hover:shadow-md',
  },
};

// Convert CFO data to SwotItem format
function convertToSwotItems(cfoData: CFOSwotData): Record<SwotCategory, SwotItem[]> {
  const result: Record<SwotCategory, SwotItem[]> = {
    strength: [],
    weakness: [],
    opportunity: [],
    threat: [],
  };

  const createItem = (text: string, category: SwotCategory, index: number): SwotItem => ({
    id: `${category}-${index}`,
    title: text.replace(/^[•\-\*]\s*/, '').trim(),
    category,
    description: text.replace(/^[•\-\*]\s*/, '').trim(),
    whyItMatters: ['Strategic impact on business positioning'],
    boardConsiderations: ['Monitor and review quarterly'],
  });

  cfoData.strengths?.forEach((s, i) => {
    if (s.trim()) result.strength.push(createItem(s, 'strength', i));
  });
  cfoData.weaknesses?.forEach((w, i) => {
    if (w.trim()) result.weakness.push(createItem(w, 'weakness', i));
  });
  cfoData.opportunities?.forEach((o, i) => {
    if (o.trim()) result.opportunity.push(createItem(o, 'opportunity', i));
  });
  cfoData.threats?.forEach((t, i) => {
    if (t.trim()) result.threat.push(createItem(t, 'threat', i));
  });

  return result;
}

export default function BoardSWOT() {
  const [viewMode, setViewMode] = useState<ViewMode>('quadrant');
  const [selectedItem, setSelectedItem] = useState<SwotItem | null>(null);
  const [activeTab, setActiveTab] = useState<SwotCategory>('strength');
  const { isDemo } = useBoardDataMode();

  // Fetch CFO SWOT from board_settings
  const { data: cfoSwotSetting, isLoading } = useQuery({
    queryKey: ['board-cfo-swot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_settings' as any)
        .select('*')
        .eq('setting_key', 'cfo_swot')
        .maybeSingle();

      if (error) {
        console.error('Error fetching board SWOT:', error);
        return null;
      }
      return data;
    },
  });

  const cfoSwotData = (cfoSwotSetting as any)?.setting_value as CFOSwotData | null;
  const groupedItems = useMemo(() => {
    if (cfoSwotData && !isDemo) {
      return convertToSwotItems(cfoSwotData);
    }
    // Demo fallback data
    return {
      strength: [
        { id: 's1', title: 'First-mover advantage in AI-powered podcast monetization', category: 'strength' as SwotCategory, description: 'First-mover advantage in AI-powered podcast monetization', whyItMatters: ['Strategic positioning'], boardConsiderations: ['Continue investment'] },
        { id: 's2', title: 'Proprietary voice certification technology', category: 'strength' as SwotCategory, description: 'Proprietary voice certification technology', whyItMatters: ['Competitive moat'], boardConsiderations: ['Patent protection'] },
      ],
      weakness: [
        { id: 'w1', title: 'Limited brand awareness', category: 'weakness' as SwotCategory, description: 'Limited brand awareness compared to established platforms', whyItMatters: ['Growth constraint'], boardConsiderations: ['Increase marketing'] },
      ],
      opportunity: [
        { id: 'o1', title: '$50B+ podcast advertising market growing 20% YoY', category: 'opportunity' as SwotCategory, description: '$50B+ podcast advertising market growing 20% YoY', whyItMatters: ['Revenue potential'], boardConsiderations: ['Accelerate GTM'] },
      ],
      threat: [
        { id: 't1', title: 'Large incumbents entering similar space', category: 'threat' as SwotCategory, description: 'Large incumbents (Spotify, YouTube) entering similar space', whyItMatters: ['Competitive pressure'], boardConsiderations: ['Differentiation strategy'] },
      ],
    };
  }, [cfoSwotData, isDemo]);

  const quadrantOrder: SwotCategory[] = ['strength', 'weakness', 'opportunity', 'threat'];

  const handleAskAI = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    const prompt = `Analyze the strategic implications of: "${item.title}"

Category: ${config.title}
Description: ${item.description}

Provide:
1. Financial impact on revenue, costs, or growth
2. Strategic urgency and timeline
3. Resource requirements
4. Board-level decisions required`;

    window.dispatchEvent(new CustomEvent('openSparkChat', { detail: { prompt } }));
    setSelectedItem(null);
  };

  const handleCopySummary = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    const text = `${config.title.slice(0, -1)}: ${item.title}

${item.description}

Why This Matters:
${item.whyItMatters.map(m => `• ${m}`).join('\n')}

Board Considerations:
${item.boardConsiderations.map(c => `• ${c}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Quadrant View Component
  const QuadrantView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {quadrantOrder.map((category, idx) => {
        const config = categoryConfig[category];
        const items = groupedItems[category] || [];

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className={cn(
              "rounded-2xl border p-5 shadow-sm",
              config.bgColor,
              config.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", config.iconBgColor)}>
                  <span className="text-lg">{config.emoji}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{config.title}</h3>
                  <p className="text-xs text-slate-500">{config.subtitle}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs bg-white/80 text-slate-600">
                {items.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.1 + i * 0.05 }}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "w-full text-left rounded-xl shadow-sm px-4 py-3",
                    "flex items-center justify-between gap-3 cursor-pointer",
                    "transition-all duration-150 ease-out",
                    config.pillBg,
                    config.pillHover
                  )}
                >
                  <span className="text-sm font-medium text-slate-800 line-clamp-2">
                    {item.title}
                  </span>
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </motion.button>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-4">
                  No items published yet
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SWOT Analysis</h1>
              <p className="text-sm text-slate-500 mt-1">
                Strategic assessment of Seeksy's position in the creator economy
              </p>
              {/* Source info */}
              {cfoSwotData?.last_updated_at && !isDemo && (
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Source: CFO SWOT</span>
                  <span>•</span>
                  <span>Last updated {formatDistanceToNow(new Date(cfoSwotData.last_updated_at), { addSuffix: true })}</span>
                  {cfoSwotData.last_updated_by_name && (
                    <>
                      <span>by</span>
                      <span className="font-medium">{cfoSwotData.last_updated_by_name}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isDemo && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Demo data
                </Badge>
              )}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={viewMode === 'quadrant' ? 'default' : 'ghost'}
                      className="h-8 w-8 p-0"
                      onClick={() => setViewMode('quadrant')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quadrant View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={viewMode === 'stack' ? 'default' : 'ghost'}
                      className="h-8 w-8 p-0"
                      onClick={() => setViewMode('stack')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stack View</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Source Banner */}
          {!isDemo && cfoSwotData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
            >
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-blue-900">CFO Published SWOT</span>
                <p className="text-xs text-blue-600 mt-0.5">
                  This analysis was published by the CFO team and represents the official strategic assessment.
                </p>
              </div>
            </motion.div>
          )}

          {/* View Content */}
          <QuadrantView />

          {/* Detail Modal */}
          <AnimatePresence>
            {selectedItem && (
              <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-lg sm:max-w-2xl rounded-2xl bg-white p-0 overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6"
                  >
                    <DialogHeader className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("p-2 rounded-lg", categoryConfig[selectedItem.category].iconBgColor)}>
                          <span className="text-lg">{categoryConfig[selectedItem.category].emoji}</span>
                        </div>
                        <Badge className={cn(
                          "text-xs",
                          selectedItem.category === 'strength' && "bg-emerald-100 text-emerald-700",
                          selectedItem.category === 'weakness' && "bg-rose-100 text-rose-700",
                          selectedItem.category === 'opportunity' && "bg-amber-100 text-amber-700",
                          selectedItem.category === 'threat' && "bg-slate-100 text-slate-700",
                        )}>
                          {categoryConfig[selectedItem.category].title.slice(0, -1)}
                        </Badge>
                      </div>
                      <DialogTitle className="text-xl font-bold text-slate-900">
                        {selectedItem.title}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <p className="text-slate-600">{selectedItem.description}</p>

                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Why This Matters</h4>
                        <ul className="space-y-1">
                          {selectedItem.whyItMatters.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Board Considerations</h4>
                        <ul className="space-y-1">
                          {selectedItem.boardConsiderations.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => handleAskAI(selectedItem)}
                      >
                        <Bot className="w-4 h-4" />
                        Ask Board AI Analyst
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleCopySummary(selectedItem)}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </motion.div>
                </DialogContent>
              </Dialog>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
  );
}