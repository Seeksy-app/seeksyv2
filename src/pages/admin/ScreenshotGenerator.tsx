import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Download, Loader2, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Screenshot {
  pageName: string;
  category: string;
  fileName: string;
  imageUrl: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

const SCREENSHOT_CATEGORIES = [
  { value: "external", label: "External Pages" },
  { value: "internal", label: "Internal Pages" },
  { value: "onboarding", label: "Onboarding Flows" },
  { value: "creator-tools", label: "Creator Tools" },
  { value: "advertiser-tools", label: "Advertiser Tools" },
  { value: "b-roll", label: "B-roll Assets" },
];

const PRESET_PAGES = [
  // External Pages
  { name: "Homepage", category: "external", description: "Landing page with hero section, features overview, call-to-action buttons, and navigation menu" },
  { name: "Meet Your Guide", category: "external", description: "Persona cards showcasing AI guides with video previews and descriptions" },
  { name: "Personas Page", category: "external", description: "Grid of AI persona cards with names, roles, and interactive elements" },
  { name: "Pricing Page", category: "external", description: "Pricing tiers comparison with features list and purchase buttons" },
  { name: "Signup Page", category: "external", description: "User registration form with email, password fields and social login options" },
  
  // Internal Pages
  { name: "Creator Dashboard", category: "internal", description: "Analytics dashboard with charts showing views, revenue, engagement metrics, and recent activity" },
  { name: "Advertiser Dashboard", category: "advertiser-tools", description: "Campaign performance dashboard with impression stats, budget tracking, and active campaigns list" },
  { name: "Studio Page", category: "creator-tools", description: "Live streaming interface with video preview, broadcast controls, chat panel, and branding overlays" },
  { name: "Media Library", category: "creator-tools", description: "Grid of video thumbnails with upload button, search bar, and filtering options" },
  { name: "Podcast Manager", category: "creator-tools", description: "List of podcast episodes with status badges, publish dates, and edit buttons" },
  { name: "Episode Upload", category: "creator-tools", description: "File upload interface with drag-drop zone, episode metadata fields, and publish settings" },
  { name: "Event Scheduling", category: "creator-tools", description: "Calendar interface with event creation form and upcoming events list" },
  { name: "My Page Editor", category: "creator-tools", description: "Customization interface with color pickers, module toggles, and live preview panel" },
  { name: "Settings Page", category: "internal", description: "User settings with tabs for profile, notifications, billing, and integrations" },
  { name: "Admin Console", category: "internal", description: "Admin dashboard with user management, system status, and analytics overview" },
  
  // Onboarding
  { name: "Creator Onboarding Step 1", category: "onboarding", description: "Welcome screen with user type selection and getting started guide" },
  { name: "Creator Onboarding Step 2", category: "onboarding", description: "Profile setup with avatar upload and bio entry fields" },
  { name: "Advertiser Onboarding Step 1", category: "onboarding", description: "Business information form with company details and campaign goals" },
  { name: "Advertiser Onboarding Step 2", category: "onboarding", description: "Budget setup and targeting preferences configuration" },
];

export default function ScreenshotGenerator() {
  const { toast } = useToast();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPageName, setCustomPageName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState("internal");

  const generateScreenshot = async (pageName: string, description: string, category: string) => {
    const fileName = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    const screenshot: Screenshot = {
      pageName,
      category,
      fileName,
      imageUrl: '',
      status: 'generating'
    };

    setScreenshots(prev => [...prev, screenshot]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-screenshot', {
        body: {
          pageName,
          pageDescription: description,
          category,
          fileName
        }
      });

      if (error) throw error;

      setScreenshots(prev => prev.map(s => 
        s.fileName === fileName 
          ? { ...s, imageUrl: data.imageUrl, status: 'complete' }
          : s
      ));

      toast({
        title: "Screenshot Generated",
        description: `${pageName} screenshot has been created successfully.`,
      });

    } catch (error: any) {
      console.error("Error generating screenshot:", error);
      setScreenshots(prev => prev.map(s => 
        s.fileName === fileName 
          ? { ...s, status: 'error' }
          : s
      ));
      
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate screenshot",
      });
    }
  };

  const generateAllPresets = async () => {
    setIsGenerating(true);
    
    for (const preset of PRESET_PAGES) {
      await generateScreenshot(preset.name, preset.description, preset.category);
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsGenerating(false);
    
    toast({
      title: "Batch Generation Complete",
      description: `Generated ${PRESET_PAGES.length} screenshots successfully.`,
    });
  };

  const generateCustom = async () => {
    if (!customPageName || !customDescription) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both page name and description.",
      });
      return;
    }

    await generateScreenshot(customPageName, customDescription, customCategory);
    setCustomPageName("");
    setCustomDescription("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Screenshot Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate professional screenshots for tutorials, documentation, and b-roll
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={generateAllPresets}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating All...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Generate All Presets ({PRESET_PAGES.length})
            </>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Custom Screenshot Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Screenshot</CardTitle>
            <CardDescription>
              Generate a screenshot for any page with custom description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageName">Page Name</Label>
              <Input
                id="pageName"
                placeholder="e.g., Dashboard Overview"
                value={customPageName}
                onChange={(e) => setCustomPageName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={customCategory} onValueChange={setCustomCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCREENSHOT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Page Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the page layout, key elements, and content..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={5}
              />
            </div>

            <Button onClick={generateCustom} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Generate Screenshot
            </Button>
          </CardContent>
        </Card>

        {/* Preset Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Preset Pages ({PRESET_PAGES.length})</CardTitle>
            <CardDescription>
              Pre-configured screenshots for common platform pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {PRESET_PAGES.map((preset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {SCREENSHOT_CATEGORIES.find(c => c.value === preset.category)?.label}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateScreenshot(preset.name, preset.description, preset.category)}
                      disabled={isGenerating}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Generated Screenshots Grid */}
      {screenshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Screenshots ({screenshots.length})</CardTitle>
            <CardDescription>
              All screenshots are stored in Supabase Storage under "ui-screenshots" bucket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    {screenshot.status === 'generating' && (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    )}
                    {screenshot.status === 'complete' && screenshot.imageUrl && (
                      <img 
                        src={screenshot.imageUrl} 
                        alt={screenshot.pageName}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {screenshot.status === 'error' && (
                      <p className="text-destructive text-sm">Failed</p>
                    )}
                    {screenshot.status === 'complete' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{screenshot.pageName}</p>
                    <p className="text-xs text-muted-foreground">
                      {SCREENSHOT_CATEGORIES.find(c => c.value === screenshot.category)?.label}
                    </p>
                    {screenshot.status === 'complete' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => window.open(screenshot.imageUrl, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
