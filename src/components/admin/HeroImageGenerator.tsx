import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HERO_PROMPTS = {
  studio: `A 16:9 aspect ratio professional creator studio hero image. Ultra high resolution, photorealistic scene featuring a warm, bright, modern content creation environment. Show a creator speaking into a professional microphone at a clean, well-lit desk. Include soft LED panel lights creating warm highlights, a camera on a tripod, and multiple screens showing other creators in a video call or recording session. The scene should have clean lines, minimal clutter, soft bokeh in the background, and subtle screen reflections. Use natural lighting mixed with professional studio lights. The overall atmosphere should communicate trust, professionalism, and high-quality content creation. Color palette: warm whites, soft grays, gentle warm tones. Premium Apple-like aesthetic with generous negative space.`,
  
  holiday: `A 16:9 aspect ratio professional creator studio hero image with subtle seasonal warmth. Ultra high resolution, photorealistic scene similar to a modern content creation studio but with elegant holiday touches. Show a creator speaking into a professional microphone at a clean desk with soft LED lighting. Include the same professional setup (camera, screens showing other creators) but add subtle golden bokeh lights in the background, a gentle warm amber glow, and a slightly cozier warm palette. No Christmas trees, no red/green colors, no obvious decorations—keep it elegant and premium. The festive element should be minimal and sophisticated: just soft golden light particles and warm atmospheric lighting. The scene should still feel modern and professional, just with added seasonal warmth. Premium aesthetic that says "celebration" without being obvious.`,
  
  technology: `A 16:9 aspect ratio premium technology-focused hero image with modern Apple/Stripe design aesthetic. Ultra high resolution abstract composition with a clean white-to-light-blue gradient background. Feature floating translucent glass UI cards displaying: a stylized face scan icon with geometric grid overlay, an animated voice waveform with frequency visualization, a video clip frame with trim markers, and a blockchain certification badge with chain links. Use soft directional lighting creating subtle reflections on the glass surfaces. Include gentle glows around UI elements in cyan and blue tones. Abstract light rays in the background. Minimal geometric shapes floating in space. The overall composition should feel futuristic, secure, and innovative—like Apple's marketing materials or Stripe's product pages. No physical environment, no people—pure digital interface visualization. Communicate trust, security, and cutting-edge AI technology through abstract visual language.`
};

export function HeroImageGenerator() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});

  const generateImage = async (variant: keyof typeof HERO_PROMPTS) => {
    setGenerating(variant);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hero-image', {
        body: {
          prompt: HERO_PROMPTS[variant],
          variant
        }
      });

      if (error) throw error;

      if (data.imageUrl) {
        setImages(prev => ({ ...prev, [variant]: data.imageUrl }));
        toast.success(`${variant} hero image generated!`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setGenerating(null);
    }
  };

  const downloadImage = async (variant: string, imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seeksy-hero-${variant}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Hero Image Generator</h2>
        <p className="text-muted-foreground">Generate premium hero images for the Seeksy homepage</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Studio Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Studio Version
            </CardTitle>
            <CardDescription>
              Clean, bright creator studio with professional setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.studio && (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={images.studio} alt="Studio hero" className="w-full h-auto" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => generateImage('studio')}
                disabled={!!generating}
                className="flex-1"
              >
                {generating === 'studio' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
              {images.studio && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => downloadImage('studio', images.studio)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Holiday Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Holiday Version
            </CardTitle>
            <CardDescription>
              Studio with subtle seasonal warmth and golden bokeh
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.holiday && (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={images.holiday} alt="Holiday hero" className="w-full h-auto" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => generateImage('holiday')}
                disabled={!!generating}
                className="flex-1"
              >
                {generating === 'holiday' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
              {images.holiday && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => downloadImage('holiday', images.holiday)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technology Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Technology Version
            </CardTitle>
            <CardDescription>
              Abstract UI cards with Apple/Stripe aesthetic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.technology && (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={images.technology} alt="Technology hero" className="w-full h-auto" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => generateImage('technology')}
                disabled={!!generating}
                className="flex-1"
              >
                {generating === 'technology' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
              {images.technology && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => downloadImage('technology', images.technology)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Generated images are high-resolution 16:9 hero images optimized for the homepage.
            Click the download button to save locally, then upload to your assets folder for use in production.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
