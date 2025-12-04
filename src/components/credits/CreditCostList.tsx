import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Radio,
  HardDrive,
  Scissors,
  Sparkles,
  FileText,
  Mic
} from "lucide-react";

interface CreditCost {
  action: string;
  cost: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: string;
}

export const CREDIT_COSTS: CreditCost[] = [
  // Time-Based Usage
  {
    action: "Recording",
    cost: "1",
    unit: "per minute",
    icon: Video,
    description: "Audio or video recording in Studio",
    category: "Time-Based Usage"
  },
  {
    action: "Livestreaming",
    cost: "1.5",
    unit: "per minute",
    icon: Radio,
    description: "Live streaming to platforms",
    category: "Time-Based Usage"
  },
  {
    action: "Extra Storage",
    cost: "10",
    unit: "per GB",
    icon: HardDrive,
    description: "Storage beyond your free 25 GB",
    category: "Time-Based Usage"
  },
  
  // AI Features
  {
    action: "AI Clip Generation",
    cost: "3",
    unit: "per clip",
    icon: Scissors,
    description: "Generate highlight clips with AI",
    category: "AI Features"
  },
  {
    action: "AI Enhancements",
    cost: "2",
    unit: "per action",
    icon: Sparkles,
    description: "Noise removal, filler words, B-roll generation",
    category: "AI Features"
  },
  {
    action: "Transcription",
    cost: "1",
    unit: "per 10 minutes",
    icon: FileText,
    description: "Auto-transcribe audio/video content",
    category: "AI Features"
  },
  {
    action: "Voice Cloning",
    cost: "5",
    unit: "per clone",
    icon: Mic,
    description: "Create AI voice profile",
    category: "AI Features"
  },
];

// Credit cost rates for programmatic use
export const CREDIT_RATES = {
  RECORDING_PER_MINUTE: 1,
  STREAMING_PER_MINUTE: 1.5,
  STORAGE_PER_GB: 10,
  AI_CLIP_GENERATION: 3,
  AI_ENHANCEMENT: 2,
  TRANSCRIPTION_PER_10_MIN: 1,
  VOICE_CLONING: 5,
};

export function CreditCostList() {
  const categories = Array.from(new Set(CREDIT_COSTS.map(c => c.category)));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Credit Costs</h2>
        <p className="text-muted-foreground">
          Credits represent platform usage. 1 credit ≈ 1 minute of usage or AI action.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="bg-primary/10">
            $0.055–$0.065 per credit
          </Badge>
        </div>
      </div>

      {/* Free Tier Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Free Monthly Limits
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-primary">25 GB</div>
              <div className="text-muted-foreground">Storage</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-primary">10 hrs</div>
              <div className="text-muted-foreground">Recording</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-primary">5 hrs</div>
              <div className="text-muted-foreground">Streaming</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            After these limits, usage deducts credits from your balance.
          </p>
        </CardContent>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>
              Credit costs for {category.toLowerCase()} features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CREDIT_COSTS.filter(c => c.category === category).map((item) => (
                <div 
                  key={item.action}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="font-medium">{item.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-4 shrink-0">
                    {item.cost} credit{parseFloat(item.cost) !== 1 ? 's' : ''} {item.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}