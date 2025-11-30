import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MASCOT_PROMPT = `A cute, friendly cartoon star character mascot for Seeksy. 
The star has a warm, welcoming personality with:
- Five points forming a classic star shape
- Wearing a small, classic Santa hat (bright red with white fluffy trim and white pom-pom)
- Standing upright on two small feet at the bottom
- Waving with one hand/arm extended in a friendly gesture
- Big, expressive friendly eyes and a warm smile
- Soft cartoon shading with gentle highlights
- Warm yellow-to-gold gradient coloring on the star body
- Professional mascot illustration quality
- Clean, simple design suitable for brand identity

POSE: Standing upright, one arm waving hello, smiling warmly, feet visible at bottom of star.

STYLE: Cute cartoon character illustration, soft shading, friendly and approachable, high quality vector-style rendering.

ABSOLUTELY NO:
- Background elements of any kind
- Seeksy logo or text
- Decorative elements (snowflakes, sparkles, circles, borders)
- Shadows, glows, or halos around the character
- White box or colored backdrop
- Additional characters or objects

OUTPUT: Only the star mascot character itself on a fully transparent background (PNG with alpha channel).`;

const MascotGeneratorPage = () => {
  const [generating, setGenerating] = useState(false);
  const [mascots, setMascots] = useState<string[]>([]);

  const generateMascots = async () => {
    setGenerating(true);
    setMascots([]);
    
    try {
      // Generate 3 variations in parallel
      const promises = [1, 2, 3].map(async (variationNumber) => {
        const { data, error } = await supabase.functions.invoke('generate-mascot', {
          body: {
            prompt: MASCOT_PROMPT,
            variationNumber
          }
        });

        if (error) throw error;
        return data.imageUrl;
      });

      const results = await Promise.all(promises);
      setMascots(results.filter(Boolean));
      toast.success('Successfully generated 3 mascot variations!');
    } catch (error) {
      console.error('Error generating mascots:', error);
      toast.error('Failed to generate mascots');
    } finally {
      setGenerating(false);
    }
  };

  const downloadMascot = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      a.href = url;
      a.download = `seeksy-holiday-mascot-v${index + 1}-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Mascot variation ${index + 1} downloaded!`);
    } catch (error) {
      console.error('Error downloading mascot:', error);
      toast.error('Failed to download mascot');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Holiday Mascot Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate transparent PNG variations of the Seeksy holiday star mascot
          </p>
        </div>

        {/* Requirements Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Generation Requirements</CardTitle>
            <CardDescription>All variations will follow these strict guidelines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-sm mb-2">✓ Style</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cute, friendly cartoon star</li>
                  <li>• Small Santa hat (red + white)</li>
                  <li>• Soft shading, warm expression</li>
                  <li>• High quality, no pixelation</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">✓ Pose</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Standing upright</li>
                  <li>• Waving with one hand</li>
                  <li>• Smiling warmly</li>
                  <li>• Feet visible</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">✓ Transparency</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fully transparent background</li>
                  <li>• PNG with alpha channel</li>
                  <li>• No white box or halos</li>
                  <li>• Clean edges</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">✗ Excluded</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No logos or text</li>
                  <li>• No background elements</li>
                  <li>• No decorations/sparkles</li>
                  <li>• No shadows or glows</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={generateMascots}
              disabled={generating}
              size="lg"
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating 3 Variations...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate 3 Mascot Variations
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will generate 3 different variations with transparent backgrounds
            </p>
          </CardContent>
        </Card>

        {/* Results Grid */}
        {mascots.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {mascots.map((imageUrl, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Variation {index + 1}</CardTitle>
                  <CardDescription>Transparent PNG, 1024x1024</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview with checkered background to show transparency */}
                  <div 
                    className="relative aspect-square rounded-lg overflow-hidden border"
                    style={{
                      background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Mascot variation ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <Button
                    onClick={() => downloadMascot(imageUrl, index)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        {mascots.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Review all 3 variations</li>
                <li>Download your favorite (or all of them)</li>
                <li>Test transparency by placing over different backgrounds</li>
                <li>Use in the Seeksy app by updating mascot asset references</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MascotGeneratorPage;
