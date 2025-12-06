import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Chrome, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

interface ChromeExtensionDownloadProps {
  signatures: any[];
  apiKey: string | null;
}

export function ChromeExtensionDownload({ signatures, apiKey }: ChromeExtensionDownloadProps) {
  const { toast } = useToast();
  const [selectedSignature, setSelectedSignature] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const activeSignatures = signatures.filter(s => s.is_active);
  const selectedSig = signatures.find(s => s.id === selectedSignature);

  const generateExtensionFiles = () => {
    const manifest = {
      manifest_version: 3,
      name: "Seeksy Email Signatures",
      version: "1.0.0",
      description: "Inject Seeksy smart signatures into Gmail with tracking",
      permissions: ["activeTab", "storage"],
      host_permissions: ["https://mail.google.com/*"],
      content_scripts: [
        {
          matches: ["https://mail.google.com/*"],
          js: ["content.js"],
          css: ["styles.css"],
          run_at: "document_idle"
        }
      ],
      icons: {
        "16": "icon16.png",
        "48": "icon48.png",
        "128": "icon128.png"
      },
      action: {
        default_popup: "popup.html",
        default_icon: {
          "16": "icon16.png",
          "48": "icon48.png"
        }
      }
    };

    const contentScript = `
// Seeksy Email Signature Injector for Gmail
(function() {
  'use strict';
  
  const SEEKSY_CONFIG = {
    apiKey: '${apiKey || ""}',
    signatureId: '${selectedSignature}',
    baseUrl: 'https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1'
  };

  // Signature HTML (pre-generated with tracking)
  const SIGNATURE_HTML = ${JSON.stringify(generateSignatureHtml(selectedSig))};

  let injectionEnabled = true;
  let lastInjectedCompose = null;

  // Watch for Gmail compose windows
  function observeGmail() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            checkForComposeWindow(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function checkForComposeWindow(node) {
    // Look for Gmail compose containers
    const composeBox = node.querySelector ? 
      node.querySelector('[role="dialog"] [contenteditable="true"][aria-label*="Message"]') ||
      node.querySelector('.Am.Al.editable') :
      null;
    
    if (composeBox && composeBox !== lastInjectedCompose && injectionEnabled) {
      injectSignature(composeBox);
      lastInjectedCompose = composeBox;
    }
  }

  function injectSignature(composeBox) {
    // Check if signature already exists
    if (composeBox.querySelector('.seeksy-signature')) {
      return;
    }

    // Create signature wrapper
    const signatureWrapper = document.createElement('div');
    signatureWrapper.className = 'seeksy-signature';
    signatureWrapper.innerHTML = '<br><br>--<br>' + SIGNATURE_HTML;
    
    // Insert at the end of the compose area
    composeBox.appendChild(signatureWrapper);
    
    console.log('[Seeksy] Signature injected');
  }

  // Initialize
  function init() {
    console.log('[Seeksy] Extension initialized');
    observeGmail();
    
    // Also check existing compose windows
    document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
      if (el.getAttribute('aria-label')?.includes('Message')) {
        injectSignature(el);
      }
    });
  }

  // Wait for Gmail to fully load
  if (document.readyState === 'complete') {
    setTimeout(init, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1000));
  }
})();
`;

    const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .logo {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-radius: 4px;
    }
    h1 {
      font-size: 16px;
      margin: 0;
    }
    .status {
      padding: 12px;
      background: #f0fdf4;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .status.active {
      background: #f0fdf4;
      color: #166534;
    }
    .signature-name {
      font-weight: 600;
      margin-top: 4px;
    }
    .toggle-btn {
      width: 100%;
      padding: 10px;
      background: #18181b;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .toggle-btn:hover {
      background: #27272a;
    }
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"></div>
    <h1>Seeksy Signatures</h1>
  </div>
  
  <div class="status active">
    <div>✓ Active Signature</div>
    <div class="signature-name">${selectedSig?.name || "No signature selected"}</div>
  </div>
  
  <button class="toggle-btn" id="toggleBtn">Toggle Injection</button>
  
  <div class="footer">
    Tracking enabled • Opens & clicks logged
  </div>

  <script>
    document.getElementById('toggleBtn').addEventListener('click', () => {
      chrome.storage.local.get(['enabled'], (result) => {
        const newState = !result.enabled;
        chrome.storage.local.set({ enabled: newState });
        alert(newState ? 'Signature injection enabled' : 'Signature injection disabled');
      });
    });
  </script>
</body>
</html>`;

    const styles = `
.seeksy-signature {
  margin-top: 16px;
  padding-top: 8px;
}
.seeksy-signature img {
  max-width: 100%;
  height: auto;
}
.seeksy-signature a {
  color: inherit;
  text-decoration: none;
}
`;

    return { manifest, contentScript, popupHtml, styles };
  };

  const generateSignatureHtml = (sig: any): string => {
    if (!sig) return "";
    
    const baseUrl = "https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1";
    const trackingPixelUrl = `${baseUrl}/signature-tracking-pixel/${sig.id}.png`;
    const clickTrackingBase = `${baseUrl}/signature-click-tracking/${sig.id}`;

    let html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${sig.font_family || "Arial, sans-serif"}; font-size: 14px; color: ${sig.primary_color || "#000000"};">`;

    if (sig.quote_text) {
      html += `<tr><td style="padding-bottom: 12px; font-style: italic; color: ${sig.secondary_color || "#666666"};">"${sig.quote_text}"</td></tr>`;
    }

    if (sig.profile_name || sig.profile_title) {
      html += `<tr><td style="padding-bottom: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>`;
      if (sig.profile_photo_url) {
        html += `<td style="padding-right: 12px; vertical-align: top;"><img src="${sig.profile_photo_url}" alt="${sig.profile_name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" /></td>`;
      }
      html += `<td style="vertical-align: middle;">`;
      if (sig.profile_name) html += `<div style="font-weight: bold; font-size: 16px;">${sig.profile_name}</div>`;
      if (sig.profile_title) html += `<div style="color: ${sig.secondary_color || "#666666"};">${sig.profile_title}</div>`;
      html += `</td></tr></table></td></tr>`;
    }

    if (sig.company_name || sig.company_phone || sig.company_website) {
      html += `<tr><td style="padding-bottom: 8px; color: ${sig.secondary_color || "#666666"};">`;
      if (sig.company_name) html += `<div style="font-weight: 600;">${sig.company_name}</div>`;
      if (sig.company_phone) html += `<div>${sig.company_phone}</div>`;
      if (sig.company_website) {
        const trackUrl = `${clickTrackingBase}/website?url=${encodeURIComponent(sig.company_website)}`;
        const cleanUrl = sig.company_website.replace(/^https?:\/\//, "");
        html += `<div><a href="${trackUrl}" style="color: ${sig.link_color || "#0066cc"}; text-decoration: none;">${cleanUrl}</a></div>`;
      }
      if (sig.company_address) html += `<div style="font-size: 12px;">${sig.company_address}</div>`;
      html += `</td></tr>`;
    }

    const socialLinks = Object.entries(sig.social_links || {}).filter(([_, url]) => url);
    if (socialLinks.length > 0) {
      html += `<tr><td style="padding: 8px 0;">`;
      for (const [platform, url] of socialLinks) {
        const trackUrl = `${clickTrackingBase}/social/${platform}?url=${encodeURIComponent(url as string)}`;
        const icon = getSocialEmoji(platform);
        html += `<a href="${trackUrl}" style="margin-right: 8px; text-decoration: none;">${icon}</a>`;
      }
      html += `</td></tr>`;
    }

    if (sig.banner_image_url) {
      const bannerTrackUrl = sig.banner_cta_url 
        ? `${clickTrackingBase}/banner?url=${encodeURIComponent(sig.banner_cta_url)}`
        : null;
      html += `<tr><td style="padding-top: 12px;">`;
      if (bannerTrackUrl) html += `<a href="${bannerTrackUrl}" target="_blank">`;
      html += `<img src="${sig.banner_image_url}" alt="${sig.banner_alt_text || "Banner"}" style="max-width: 600px; width: 100%; height: auto; display: block;" />`;
      if (bannerTrackUrl) html += `</a>`;
      html += `</td></tr>`;
    }

    html += `<tr><td><img src="${trackingPixelUrl}" width="1" height="1" style="display: block;" alt="" /></td></tr>`;
    html += `</table>`;
    
    return html;
  };

  const getSocialEmoji = (platform: string): string => {
    const icons: Record<string, string> = {
      facebook: "📘",
      twitter: "🐦",
      instagram: "📷",
      linkedin: "💼",
      youtube: "🎬",
      tiktok: "🎵",
      pinterest: "📌",
    };
    return icons[platform] || "🔗";
  };

  const handleDownload = async () => {
    if (!selectedSignature) {
      toast({
        title: "Select a signature",
        description: "Please select a signature to include in the extension.",
        variant: "destructive"
      });
      return;
    }

    setDownloading(true);
    try {
      const { manifest, contentScript, popupHtml, styles } = generateExtensionFiles();
      
      const zip = new JSZip();
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("content.js", contentScript);
      zip.file("popup.html", popupHtml);
      zip.file("styles.css", styles);
      
      // Create simple placeholder icons (colored squares)
      const iconSvg = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fbbf24" rx="${size/8}"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-size="${size/2}" font-weight="bold">S</text></svg>`;
      
      // Convert SVG to PNG-like data (for simplicity, we'll use SVG as placeholder)
      // In production, you'd generate actual PNGs
      zip.file("icon16.png", iconSvg(16));
      zip.file("icon48.png", iconSvg(48));
      zip.file("icon128.png", iconSvg(128));

      const content = await zip.generateAsync({ type: "blob" });
      
      // Download
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "seeksy-signatures-extension.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Extension downloaded!",
        description: "Unzip and load as unpacked extension in Chrome."
      });
    } catch (error) {
      console.error("Error generating extension:", error);
      toast({
        title: "Download failed",
        description: "Could not generate extension ZIP.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Chrome className="h-5 w-5" />
          Chrome Extension
        </CardTitle>
        <CardDescription>
          Download the Seeksy Gmail extension to auto-inject signatures with tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiKey && (
          <Alert>
            <AlertDescription>
              Generate an API key in Settings to enable the extension.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Signature</label>
          <Select value={selectedSignature} onValueChange={setSelectedSignature}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a signature..." />
            </SelectTrigger>
            <SelectContent>
              {signatures.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.is_active && <Badge variant="secondary" className="ml-2">Active</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleDownload} 
          disabled={!selectedSignature || downloading}
          className="w-full gap-2"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generating..." : "Download Extension ZIP"}
        </Button>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium">Installation Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Download and unzip the extension</li>
            <li>Open <code className="bg-muted px-1 rounded">chrome://extensions</code></li>
            <li>Enable "Developer mode" (top right)</li>
            <li>Click "Load unpacked" and select the folder</li>
            <li>Open Gmail — signature auto-injects!</li>
          </ol>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Tracking pixel + click tracking included</span>
        </div>
      </CardContent>
    </Card>
  );
}