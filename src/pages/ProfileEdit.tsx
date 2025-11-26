import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Save, Smartphone, Tablet, Monitor, Maximize2, Plus, X, Radio, Video } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { ProfileQRCode } from "@/components/ProfileQRCode";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [showFullPreview, setShowFullPreview] = useState(false);

  const [displayName, setDisplayName] = useState("Johnny Rocket");
  const [username, setUsername] = useState("johnny-rocket");
  const [bio, setBio] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ef4444");
  const [titleColor, setTitleColor] = useState("#3b82f6");
  const [imageStyle, setImageStyle] = useState<"circular" | "rounded-square" | "portrait">("portrait");
  const [titleFont, setTitleFont] = useState("sans");
  const [customLinks, setCustomLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [qrShape, setQrShape] = useState<"square" | "round">("square");
  const [qrColor, setQrColor] = useState("#000000");
  const [qrBackgroundColor, setQrBackgroundColor] = useState("#ffffff");
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [tippingEnabled, setTippingEnabled] = useState(false);
  const [tippingButtonText, setTippingButtonText] = useState("Support Me");
  const [tippingGoalEnabled, setTippingGoalEnabled] = useState(false);
  const [tippingGoalAmount, setTippingGoalAmount] = useState("100");

  const fontOptions = [
    { value: "sans", label: "Inter" },
    { value: "serif", label: "Playfair Display" },
    { value: "script", label: "Dancing Script" },
    { value: "mono", label: "Roboto Mono" },
    { value: "poppins", label: "Poppins" },
    { value: "montserrat", label: "Montserrat" },
    { value: "lato", label: "Lato" },
    { value: "opensans", label: "Open Sans" },
    { value: "raleway", label: "Raleway" },
    { value: "ubuntu", label: "Ubuntu" },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Changes saved!");
    } finally {
      setSaving(false);
    }
  };

  const getDeviceWidth = () => {
    switch (previewDevice) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      case "desktop": return "100%";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit My Page</h1>
              <p className="text-muted-foreground text-sm">Customize your profile</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="streaming">Streaming</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="grid lg:grid-cols-[400px,1fr] gap-6 mt-6">
            <div className="space-y-4">
              <TabsContent value="profile" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                      <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-sm">Username</Label>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-9" />
                      <p className="text-xs text-muted-foreground">seeksy.io/{username}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-sm">Description</Label>
                      <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="text-sm resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Image Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["circular", "rounded-square", "portrait"].map((style) => (
                          <Button key={style} type="button" size="sm" variant={imageStyle === style ? "default" : "outline"} onClick={() => setImageStyle(style as any)}>
                            {style === "rounded-square" ? "Square" : style.charAt(0).toUpperCase() + style.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Design</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Background</Label>
                      <Input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-10 cursor-pointer" />
                      <div className="flex gap-1.5">
                        {["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map((c) => (
                          <button key={c} onClick={() => setBackgroundColor(c)} className="w-8 h-8 rounded-full border-2 hover:scale-110 transition" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Title Color</Label>
                      <Input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-full h-10 cursor-pointer" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Font</Label>
                      <Select value={titleFont} onValueChange={setTitleFont}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {fontOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Custom Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {customLinks.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Title" value={link.title} onChange={(e) => { const n = [...customLinks]; n[i].title = e.target.value; setCustomLinks(n); }} className="h-9" />
                        <Input placeholder="URL" value={link.url} onChange={(e) => { const n = [...customLinks]; n[i].url = e.target.value; setCustomLinks(n); }} className="h-9" />
                        <Button variant="ghost" size="sm" onClick={() => setCustomLinks(customLinks.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCustomLinks([...customLinks, { title: "", url: "" }])} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Link</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qr" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">QR Code</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Shape</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant={qrShape === "square" ? "default" : "outline"} onClick={() => setQrShape("square")}>Square</Button>
                        <Button size="sm" variant={qrShape === "round" ? "default" : "outline"} onClick={() => setQrShape("round")}>Round</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start h-9" onClick={() => navigate("/podcasts")}><Radio className="w-4 h-4 mr-2" />RSS Feeds <span className="ml-auto text-xs">→</span></Button>
                    <Button variant="outline" className="w-full justify-start h-9" onClick={() => navigate("/media-library")}><Video className="w-4 h-4 mr-2" />Videos <span className="ml-auto text-xs">→</span></Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="streaming" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Streaming & Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div><Label className="text-sm">Streaming</Label><p className="text-xs text-muted-foreground">Live stream</p></div>
                      <Switch checked={streamingEnabled} onCheckedChange={setStreamingEnabled} />
                    </div>
                    {streamingEnabled && <div className="bg-muted p-3 rounded"><div className="aspect-[9/16] max-w-[180px] bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs">🎥 Live</div></div>}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div><Label className="text-sm">Tipping</Label><p className="text-xs text-muted-foreground">Accept tips</p></div>
                      <Switch checked={tippingEnabled} onCheckedChange={setTippingEnabled} />
                    </div>
                    {tippingEnabled && <Input value={tippingButtonText} onChange={(e) => setTippingButtonText(e.target.value)} className="h-9" />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Advanced</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">Coming soon...</p></CardContent>
                </Card>
              </TabsContent>
            </div>

            <div className="lg:sticky lg:top-6">
              <Card className="shadow-xl">
                <CardHeader className="border-b bg-muted/30 py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Live Preview</CardTitle>
                    <div className="flex gap-1">
                      {[["mobile", Smartphone], ["tablet", Tablet], ["desktop", Monitor]].map(([device, Icon]: any) => (
                        <Button key={device} variant="ghost" size="icon" className={`h-8 w-8 ${previewDevice === device ? "bg-accent" : ""}`} onClick={() => setPreviewDevice(device as any)}><Icon className="w-4 h-4" /></Button>
                      ))}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowFullPreview(true)}><Maximize2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-muted/20 flex justify-center">
                  <div className="transition-all" style={{ width: getDeviceWidth(), maxWidth: "100%" }}>
                    <div className="rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor }}>
                      <div className="aspect-[9/16] md:aspect-auto md:min-h-[600px] p-6 flex flex-col items-center">
                        <div className={`${imageStyle === "circular" ? "w-32 h-32 rounded-full" : imageStyle === "rounded-square" ? "w-32 h-32 rounded-2xl" : "w-40 h-56 rounded-2xl"} bg-gradient-to-br from-blue-400 to-purple-500 mb-4`} />
                        <h1 className={`text-2xl font-bold mb-2 font-${titleFont}`} style={{ color: titleColor }}>{displayName}</h1>
                        {bio && <p className="text-sm text-center mb-4 opacity-90" style={{ color: titleColor }}>{bio}</p>}
                        {customLinks.filter(l => l.title).map((link, i) => <Button key={i} variant="outline" className="w-full max-w-sm mb-2" size="sm">{link.title}</Button>)}
                        <div className="mt-4"><ProfileQRCode username={username} shape={qrShape} /></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>

        <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <div style={{ backgroundColor }} className="rounded-lg p-8">
              <div className="flex flex-col items-center">
                <div className={`${imageStyle === "circular" ? "w-40 h-40 rounded-full" : imageStyle === "rounded-square" ? "w-40 h-40 rounded-2xl" : "w-48 h-64 rounded-2xl"} bg-gradient-to-br from-blue-400 to-purple-500 mb-6`} />
                <h1 className={`text-4xl font-bold mb-4 font-${titleFont}`} style={{ color: titleColor }}>{displayName}</h1>
                {bio && <p className="text-center mb-6" style={{ color: titleColor }}>{bio}</p>}
                <div className="space-y-3 w-full max-w-md">{customLinks.filter(l => l.title).map((link, i) => <Button key={i} variant="outline" className="w-full">{link.title}</Button>)}</div>
                <div className="mt-6"><ProfileQRCode username={username} shape={qrShape} /></div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
