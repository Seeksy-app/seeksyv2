import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Save,
  Sparkles,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SWOTData {
  id?: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
}

export default function SWOTAnalysis() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [swotData, setSwotData] = useState<SWOTData>({
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: ""
  });

  useEffect(() => {
    fetchSWOTData();
  }, []);

  const fetchSWOTData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use rpc or raw query since types may not be updated
      const { data, error } = await supabase
        .from('cfo_swot' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching SWOT:', error);
      }

      if (data) {
        const swot = data as unknown as SWOTData;
        setSwotData(swot);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (swotData.id) {
        const { error } = await supabase
          .from('cfo_swot' as any)
          .update({
            strengths: swotData.strengths,
            weaknesses: swotData.weaknesses,
            opportunities: swotData.opportunities,
            threats: swotData.threats,
            updated_at: new Date().toISOString()
          })
          .eq('id', swotData.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('cfo_swot' as any)
          .insert({
            user_id: user.id,
            strengths: swotData.strengths,
            weaknesses: swotData.weaknesses,
            opportunities: swotData.opportunities,
            threats: swotData.threats
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSwotData({ ...swotData, id: (data as any).id });
        }
      }

      toast({ title: "SWOT Analysis saved successfully" });
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ 
        title: "Error saving SWOT Analysis", 
        description: err.message,
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      // Simulated AI generation - in production would call an AI endpoint
      const generatedSWOT = {
        strengths: `• First-mover advantage in AI-powered podcast monetization
• Proprietary voice certification technology with blockchain verification
• Strong creator-first platform positioning
• Integrated end-to-end workflow (create → certify → monetize)
• Growing creator network with voice-verified authenticity`,
        
        weaknesses: `• Limited brand awareness compared to established platforms
• Dependency on third-party AI services (ElevenLabs, OpenAI)
• Early-stage revenue with limited financial history
• Small team requiring rapid scaling for growth
• Complex feature set may overwhelm new users`,
        
        opportunities: `• $50B+ podcast advertising market growing 20% YoY
• Creator economy shift toward authenticity and ownership
• Rising demand for AI content with verified human creators
• B2B white-label opportunities for agencies and networks
• International expansion into underserved markets`,
        
        threats: `• Large incumbents (Spotify, YouTube) entering similar space
• Economic downturn affecting advertising spend
• AI regulation changes impacting voice cloning features
• Platform dependency risks (social media policy changes)
• Competitive pressure on creator payouts`
      };

      setSwotData(prev => ({
        ...prev,
        ...generatedSWOT
      }));

      toast({ title: "AI SWOT analysis generated", description: "Review and edit as needed" });
    } catch (err) {
      toast({ 
        title: "Error generating SWOT", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (field: keyof SWOTData, value: string) => {
    setSwotData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="px-10 py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            SWOT Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Strategic analysis of strengths, weaknesses, opportunities, and threats
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate with AI
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Analysis
          </Button>
        </div>
      </div>

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
              Strengths
            </CardTitle>
            <CardDescription>
              Internal advantages and core competencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={swotData.strengths}
              onChange={(e) => updateField('strengths', e.target.value)}
              placeholder="• List your key strengths...
• What do you do better than competitors?
• What unique resources do you have?"
              className="min-h-[200px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <TrendingDown className="h-5 w-5" />
              Weaknesses
            </CardTitle>
            <CardDescription>
              Internal limitations and areas for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={swotData.weaknesses}
              onChange={(e) => updateField('weaknesses', e.target.value)}
              placeholder="• List areas needing improvement...
• What do competitors do better?
• What resources are you lacking?"
              className="min-h-[200px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Target className="h-5 w-5" />
              Opportunities
            </CardTitle>
            <CardDescription>
              External factors that could benefit the business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={swotData.opportunities}
              onChange={(e) => updateField('opportunities', e.target.value)}
              placeholder="• List market opportunities...
• What trends can you capitalize on?
• What gaps exist in the market?"
              className="min-h-[200px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Threats */}
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-600">
              <AlertTriangle className="h-5 w-5" />
              Threats
            </CardTitle>
            <CardDescription>
              External factors that could harm the business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={swotData.threats}
              onChange={(e) => updateField('threats', e.target.value)}
              placeholder="• List potential threats...
• What obstacles do you face?
• What are competitors doing?"
              className="min-h-[200px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      {swotData.id && (
        <p className="text-sm text-muted-foreground text-center">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
