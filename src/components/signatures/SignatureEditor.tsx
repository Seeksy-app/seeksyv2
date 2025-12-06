import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GripVertical, 
  User, 
  Building2, 
  Share2, 
  Image, 
  Quote, 
  Plus,
  Copy,
  Check,
  Upload,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SignaturePreview } from "./SignaturePreview";

interface SignatureEditorProps {
  signature: any;
  onUpdate: (signature: any) => void;
}

const SOCIAL_ICONS = [
  { id: "facebook", label: "Facebook", icon: "🔵" },
  { id: "twitter", label: "X (Twitter)", icon: "🐦" },
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "youtube", label: "YouTube", icon: "🎬" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "pinterest", label: "Pinterest", icon: "📌" },
];

export function SignatureEditor({ signature, onUpdate }: SignatureEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [formData, setFormData] = useState({
    name: signature.name || "",
    quote_text: signature.quote_text || "",
    profile_photo_url: signature.profile_photo_url || "",
    profile_name: signature.profile_name || "",
    profile_title: signature.profile_title || "",
    company_name: signature.company_name || "",
    company_website: signature.company_website || "",
    company_logo_url: signature.company_logo_url || "",
    company_phone: signature.company_phone || "",
    company_address: signature.company_address || "",
    social_links: signature.social_links || {},
    banner_image_url: signature.banner_image_url || "",
    banner_cta_url: signature.banner_cta_url || "",
    banner_alt_text: signature.banner_alt_text || "",
    font_family: signature.font_family || "Arial, sans-serif",
    primary_color: signature.primary_color || "#000000",
    secondary_color: signature.secondary_color || "#666666",
    link_color: signature.link_color || "#0066cc",
    blocks: signature.blocks || [],
  });

  useEffect(() => {
    setFormData({
      name: signature.name || "",
      quote_text: signature.quote_text || "",
      profile_photo_url: signature.profile_photo_url || "",
      profile_name: signature.profile_name || "",
      profile_title: signature.profile_title || "",
      company_name: signature.company_name || "",
      company_website: signature.company_website || "",
      company_logo_url: signature.company_logo_url || "",
      company_phone: signature.company_phone || "",
      company_address: signature.company_address || "",
      social_links: signature.social_links || {},
      banner_image_url: signature.banner_image_url || "",
      banner_cta_url: signature.banner_cta_url || "",
      banner_alt_text: signature.banner_alt_text || "",
      font_family: signature.font_family || "Arial, sans-serif",
      primary_color: signature.primary_color || "#000000",
      secondary_color: signature.secondary_color || "#666666",
      link_color: signature.link_color || "#0066cc",
      blocks: signature.blocks || [],
    });
  }, [signature]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (socialId: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [socialId]: url },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Generate HTML signature
      const htmlSignature = generateHtmlSignature(formData, signature.id);
      const plainTextSignature = generatePlainTextSignature(formData);

      const { data, error } = await supabase
        .from("email_signatures")
        .update({
          ...formData,
          html_signature: htmlSignature,
          plain_text_signature: plainTextSignature,
        })
        .eq("id", signature.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      toast({
        title: "Signature saved",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyHtml = async () => {
    const html = generateHtmlSignature(formData, signature.id);
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast({
      title: "HTML copied",
      description: "Paste this into your email client's signature settings",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPlainText = async () => {
    const text = generatePlainTextSignature(formData);
    await navigator.clipboard.writeText(text);
    toast({
      title: "Plain text copied",
      description: "Signature copied as plain text",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Edit Signature</CardTitle>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Signature Name */}
          <div className="mb-4">
            <Label htmlFor="name">Signature Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="My Signature"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="profile" className="text-xs">
                <User className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="company" className="text-xs">
                <Building2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                <Share2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="banner" className="text-xs">
                <Image className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs">
                🎨
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div>
                <Label htmlFor="profile_name">Full Name</Label>
                <Input
                  id="profile_name"
                  value={formData.profile_name}
                  onChange={(e) => handleChange("profile_name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="profile_title">Job Title</Label>
                <Input
                  id="profile_title"
                  value={formData.profile_title}
                  onChange={(e) => handleChange("profile_title", e.target.value)}
                  placeholder="CEO & Founder"
                />
              </div>
              <div>
                <Label htmlFor="profile_photo_url">Profile Photo URL</Label>
                <Input
                  id="profile_photo_url"
                  value={formData.profile_photo_url}
                  onChange={(e) => handleChange("profile_photo_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="quote_text">Quote (optional)</Label>
                <Textarea
                  id="quote_text"
                  value={formData.quote_text}
                  onChange={(e) => handleChange("quote_text", e.target.value)}
                  placeholder="A short inspirational quote..."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <Label htmlFor="company_website">Website</Label>
                <Input
                  id="company_website"
                  value={formData.company_website}
                  onChange={(e) => handleChange("company_website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="company_phone">Phone</Label>
                <Input
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) => handleChange("company_phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="company_address">Address</Label>
                <Input
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) => handleChange("company_address", e.target.value)}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div>
                <Label htmlFor="company_logo_url">Company Logo URL</Label>
                <Input
                  id="company_logo_url"
                  value={formData.company_logo_url}
                  onChange={(e) => handleChange("company_logo_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Add your social media links. Each click will be tracked.
              </p>
              {SOCIAL_ICONS.map((social) => (
                <div key={social.id}>
                  <Label htmlFor={`social_${social.id}`}>
                    {social.icon} {social.label}
                  </Label>
                  <Input
                    id={`social_${social.id}`}
                    value={formData.social_links[social.id] || ""}
                    onChange={(e) => handleSocialChange(social.id, e.target.value)}
                    placeholder={`https://${social.id}.com/...`}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="banner" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Add a promotional banner (600×200px recommended). Supports JPG, PNG, and animated GIFs.
              </p>
              
              {/* Banner Upload */}
              <div>
                <Label>Banner Image</Label>
                <div className="mt-2 space-y-3">
                  {formData.banner_image_url && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={formData.banner_image_url} 
                        alt="Banner preview" 
                        className="w-full h-auto max-h-32 object-contain bg-muted"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleChange("banner_image_url", "")}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 2 * 1024 * 1024) {
                            toast({
                              title: "File too large",
                              description: "Max file size is 2MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `banner_${signature.id}_${Date.now()}.${fileExt}`;
                            
                            const { data, error } = await supabase.storage
                              .from('signature-banners')
                              .upload(fileName, file, { upsert: true });
                            
                            if (error) throw error;
                            
                            const { data: urlData } = supabase.storage
                              .from('signature-banners')
                              .getPublicUrl(fileName);
                            
                            handleChange("banner_image_url", urlData.publicUrl);
                            toast({
                              title: "Banner uploaded",
                              description: "Your banner image has been uploaded",
                            });
                          } catch (error) {
                            console.error("Upload error:", error);
                            toast({
                              title: "Upload failed",
                              description: "Could not upload banner image",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload Banner
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or paste URL</span>
                    </div>
                  </div>
                  
                  <Input
                    id="banner_image_url"
                    value={formData.banner_image_url}
                    onChange={(e) => handleChange("banner_image_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="banner_cta_url">CTA Link (tracked)</Label>
                <Input
                  id="banner_cta_url"
                  value={formData.banner_cta_url}
                  onChange={(e) => handleChange("banner_cta_url", e.target.value)}
                  placeholder="https://example.com/promo"
                />
              </div>
              <div>
                <Label htmlFor="banner_alt_text">Alt Text</Label>
                <Input
                  id="banner_alt_text"
                  value={formData.banner_alt_text}
                  onChange={(e) => handleChange("banner_alt_text", e.target.value)}
                  placeholder="Describe the banner for accessibility"
                />
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div>
                <Label htmlFor="font_family">Font Family</Label>
                <select
                  id="font_family"
                  value={formData.font_family}
                  onChange={(e) => handleChange("font_family", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => handleChange("primary_color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleChange("primary_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => handleChange("secondary_color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => handleChange("secondary_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="link_color">Link Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="link_color"
                    value={formData.link_color}
                    onChange={(e) => handleChange("link_color", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.link_color}
                    onChange={(e) => handleChange("link_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <SignaturePreview formData={formData} signatureId={signature.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleCopyHtml} 
              variant="outline" 
              className="w-full justify-start gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy HTML Signature
            </Button>
            <Button 
              onClick={handleCopyPlainText} 
              variant="outline" 
              className="w-full justify-start gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Plain Text
            </Button>
            <p className="text-xs text-muted-foreground">
              Paste the HTML into Gmail Settings → Signature to enable tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions to generate signature HTML/text
function generateHtmlSignature(formData: any, signatureId: string): string {
  const baseUrl = "https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1";
  const trackingPixelUrl = `${baseUrl}/signature-tracking-pixel/${signatureId}.png`;
  const clickTrackingBase = `${baseUrl}/signature-click-tracking/${signatureId}`;

  let html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${formData.font_family}; font-size: 14px; color: ${formData.primary_color};">`;

  // Quote block
  if (formData.quote_text) {
    html += `
      <tr>
        <td style="padding-bottom: 12px; font-style: italic; color: ${formData.secondary_color};">
          "${formData.quote_text}"
        </td>
      </tr>`;
  }

  // Profile block
  if (formData.profile_name || formData.profile_title) {
    html += `
      <tr>
        <td style="padding-bottom: 8px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>`;
    
    if (formData.profile_photo_url) {
      html += `
              <td style="padding-right: 12px; vertical-align: top;">
                <img src="${formData.profile_photo_url}" alt="${formData.profile_name}" 
                     style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
              </td>`;
    }
    
    html += `
              <td style="vertical-align: middle;">
                ${formData.profile_name ? `<div style="font-weight: bold; font-size: 16px;">${formData.profile_name}</div>` : ""}
                ${formData.profile_title ? `<div style="color: ${formData.secondary_color};">${formData.profile_title}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  // Company block
  if (formData.company_name || formData.company_phone || formData.company_website) {
    html += `
      <tr>
        <td style="padding-bottom: 8px; color: ${formData.secondary_color};">`;
    
    if (formData.company_name) {
      html += `<div style="font-weight: 600;">${formData.company_name}</div>`;
    }
    if (formData.company_phone) {
      html += `<div>${formData.company_phone}</div>`;
    }
    if (formData.company_website) {
      const trackUrl = `${clickTrackingBase}/website?url=${encodeURIComponent(formData.company_website)}`;
      html += `<div><a href="${trackUrl}" style="color: ${formData.link_color}; text-decoration: none;">${formData.company_website.replace(/^https?:\/\//, "")}</a></div>`;
    }
    if (formData.company_address) {
      html += `<div style="font-size: 12px;">${formData.company_address}</div>`;
    }
    
    html += `
        </td>
      </tr>`;
  }

  // Social icons block
  const socialLinks = Object.entries(formData.social_links || {}).filter(([_, url]) => url);
  if (socialLinks.length > 0) {
    html += `
      <tr>
        <td style="padding: 8px 0;">`;
    
    for (const [platform, url] of socialLinks) {
      const trackUrl = `${clickTrackingBase}/social/${platform}?url=${encodeURIComponent(url as string)}`;
      const iconUrl = getSocialIconUrl(platform);
      html += `<a href="${trackUrl}" style="margin-right: 8px; text-decoration: none; display: inline-block;"><img src="${iconUrl}" alt="${platform}" width="24" height="24" style="border: 0; display: inline-block;" /></a>`;
    }
    
    html += `
        </td>
      </tr>`;
  }

  // Banner block
  if (formData.banner_image_url) {
    const bannerTrackUrl = formData.banner_cta_url 
      ? `${clickTrackingBase}/banner?url=${encodeURIComponent(formData.banner_cta_url)}`
      : formData.banner_cta_url;
    
    html += `
      <tr>
        <td style="padding-top: 12px;">`;
    
    if (bannerTrackUrl) {
      html += `<a href="${bannerTrackUrl}" target="_blank">`;
    }
    
    html += `<img src="${formData.banner_image_url}" alt="${formData.banner_alt_text || "Banner"}" 
                 style="max-width: 600px; width: 100%; height: auto; display: block;" />`;
    
    if (bannerTrackUrl) {
      html += `</a>`;
    }
    
    html += `
        </td>
      </tr>`;
  }

  // Tracking pixel (invisible)
  html += `
    <tr>
      <td>
        <img src="${trackingPixelUrl}" width="1" height="1" style="display: block;" alt="" />
      </td>
    </tr>`;

  html += `</table>`;
  
  return html;
}

function generatePlainTextSignature(formData: any): string {
  let text = "";

  if (formData.quote_text) {
    text += `"${formData.quote_text}"\n\n`;
  }

  if (formData.profile_name) {
    text += `${formData.profile_name}\n`;
  }
  if (formData.profile_title) {
    text += `${formData.profile_title}\n`;
  }

  if (formData.company_name) {
    text += `\n${formData.company_name}\n`;
  }
  if (formData.company_phone) {
    text += `${formData.company_phone}\n`;
  }
  if (formData.company_website) {
    text += `${formData.company_website}\n`;
  }
  if (formData.company_address) {
    text += `${formData.company_address}\n`;
  }

  return text.trim();
}

// Inline SVG icons as data URIs (email-client safe, no external dependencies)
function getSocialIconUrl(platform: string): string {
  const icons: Record<string, string> = {
    facebook: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231877F2'%3E%3Cpath d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/%3E%3C/svg%3E",
    twitter: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'/%3E%3C/svg%3E",
    instagram: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E4405F'%3E%3Cpath d='M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z'/%3E%3C/svg%3E",
    linkedin: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E",
    youtube: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF0000'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E",
    tiktok: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/%3E%3C/svg%3E",
    pinterest: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23BD081C'%3E%3Cpath d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z'/%3E%3C/svg%3E",
  };
  return icons[platform] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666666'%3E%3Cpath d='M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.43l-.47.47a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24.973.973 0 0 1 0-1.42z'/%3E%3C/svg%3E";
}
