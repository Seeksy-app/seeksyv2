import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Palette, Link2, QrCode, Image, Video, Settings, Upload, Plus, X, Smartphone, Tablet, Monitor } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { ProfileQRCode } from "@/components/ProfileQRCode";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Profile
  const [displayName, setDisplayName] = useState("Johnny Rocket");
  const [username, setUsername] = useState("johnny-rocket");
  const [bio, setBio] = useState("");
  const [imageStyle, setImageStyle] = useState<"circular" | "square" | "portrait">("portrait");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Design
  const [backgroundColor, setBackgroundColor] = useState("#6ee7b7");
  const [titleColor, setTitleColor] = useState("#1f2937");
  const [titleFont, setTitleFont] = useState("sans");
  
  // Device preview
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  
  // Media
  const [selectedMedia, setSelectedMedia] = useState<string>("");
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  
  // Streaming
  const [selectedAd, setSelectedAd] = useState<string>("");
  const [streamingVideo, setStreamingVideo] = useState<string>("");

  // Links & Features
  const [showMeetings, setShowMeetings] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showSignupSheets, setShowSignupSheets] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [showQRCodes, setShowQRCodes] = useState(true);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [customLinks, setCustomLinks] = useState<Array<{ title: string; url: string }>>([]);

  // QR Code
  const [qrShape, setQrShape] = useState<"square" | "round">("square");

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

  const colorSwatches = [
    "#000000", "#1a3a2e", "#2d5f5d", "#4c6c74", "#6b8e8f", "#6ee7b7", "#9ca3af",
    "#9ca3af", "#a7f3d0", "#b8f7df", "#c7f0db", "#d1f4e0", "#facc15", "#fef3c7",
    "#fef9e7", "#d8b4fe", "#e5e7eb", "#f3f4f6", "#e0e7ff", "#c7d2fe", "#ffffff"
  ];

  const navItems = [
    { id: "profile", icon: User, label: "Profile", color: "bg-blue-500" },
    { id: "design", icon: Palette, label: "Design", color: "bg-gradient-to-br from-pink-500 to-purple-500" },
    { id: "links", icon: Link2, label: "Links", color: "bg-green-500" },
    { id: "qrcode", icon: QrCode, label: "QR Code", color: "bg-indigo-500" },
    { id: "media", icon: Image, label: "Media", color: "bg-yellow-500" },
    { id: "streaming", icon: Video, label: "Streaming", color: "bg-red-500" },
    { id: "advanced", icon: Settings, label: "Advanced", color: "bg-gray-600" },
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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card shrink-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit My Page</h1>
              <p className="text-muted-foreground text-sm">Customize your profile</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon Navigation */}
        <div className="w-20 border-r bg-card flex-shrink-0 overflow-y-auto">
          <div className="flex flex-col items-center py-4 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  activeSection === item.id
                    ? `${item.color} text-white shadow-lg scale-105`
                    : "hover:bg-muted text-muted-foreground"
                }`}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-[450px] border-r bg-background flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">seeksy.io/{username}</p>
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="mt-1.5 resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileImage" className="text-sm font-medium">Profile Image</Label>
                      <div className="mt-1.5">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                          <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => setProfileImage(e.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label htmlFor="profileImage" className="cursor-pointer">
                            {profileImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                                <p className="text-xs text-muted-foreground">Click to change</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">Upload profile image</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Image Style</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1.5">
                        {[
                          { value: "circular", label: "Circular" },
                          { value: "square", label: "Square" },
                          { value: "portrait", label: "Portrait" }
                        ].map((style) => (
                          <Button
                            key={style.value}
                            type="button"
                            size="sm"
                            variant={imageStyle === style.value ? "default" : "outline"}
                            onClick={() => setImageStyle(style.value as any)}
                          >
                            {style.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "design" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Design</h2>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium">Background</Label>
                      <div className="mt-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400 border-2 border-border hover:scale-110 transition-transform flex items-center justify-center"
                            onClick={() => {/* Color picker */}}
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                          {colorSwatches.map((color) => (
                            <button
                              key={color}
                              onClick={() => setBackgroundColor(color)}
                              className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                                backgroundColor === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Title Color</Label>
                      <div className="mt-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400 border-2 border-border hover:scale-110 transition-transform flex items-center justify-center"
                            onClick={() => {/* Color picker */}}
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                          {colorSwatches.map((color) => (
                            <button
                              key={color}
                              onClick={() => setTitleColor(color)}
                              className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                                titleColor === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Font</Label>
                      <Select value={titleFont} onValueChange={setTitleFont}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {fontOptions.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "links" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Links</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Seeksy Features</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Meetings</p>
                            <p className="text-xs text-muted-foreground">Show Meetings link</p>
                          </div>
                          <Switch checked={showMeetings} onCheckedChange={setShowMeetings} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Events</p>
                            <p className="text-xs text-muted-foreground">Show Events link</p>
                          </div>
                          <Switch checked={showEvents} onCheckedChange={setShowEvents} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Sign-up Sheets</p>
                            <p className="text-xs text-muted-foreground">Show Sign-up Sheets</p>
                          </div>
                          <Switch checked={showSignupSheets} onCheckedChange={setShowSignupSheets} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Polls</p>
                            <p className="text-xs text-muted-foreground">Show Polls link</p>
                          </div>
                          <Switch checked={showPolls} onCheckedChange={setShowPolls} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Awards</p>
                            <p className="text-xs text-muted-foreground">Show Awards link</p>
                          </div>
                          <Switch checked={showAwards} onCheckedChange={setShowAwards} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">QR Codes</p>
                            <p className="text-xs text-muted-foreground">Show QR Codes link</p>
                          </div>
                          <Switch checked={showQRCodes} onCheckedChange={setShowQRCodes} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Newsletter</p>
                            <p className="text-xs text-muted-foreground">Newsletter signup</p>
                          </div>
                          <Switch checked={showNewsletter} onCheckedChange={setShowNewsletter} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium mb-3 block">Custom Links</Label>
                      <div className="space-y-2">
                        {customLinks.map((link, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              placeholder="Title"
                              value={link.title}
                              onChange={(e) => {
                                const n = [...customLinks];
                                n[i].title = e.target.value;
                                setCustomLinks(n);
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="URL"
                              value={link.url}
                              onChange={(e) => {
                                const n = [...customLinks];
                                n[i].url = e.target.value;
                                setCustomLinks(n);
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCustomLinks(customLinks.filter((_, idx) => idx !== i))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomLinks([...customLinks, { title: "", url: "" }])}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Custom Link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "qrcode" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">QR Code</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Shape</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <Button
                          size="sm"
                          variant={qrShape === "square" ? "default" : "outline"}
                          onClick={() => setQrShape("square")}
                        >
                          Square
                        </Button>
                        <Button
                          size="sm"
                          variant={qrShape === "round" ? "default" : "outline"}
                          onClick={() => setQrShape("round")}
                        >
                          Round
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 flex justify-center">
                      <ProfileQRCode username={username} shape={qrShape} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "media" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Media</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mediaSelect" className="text-sm font-medium">Video from Library</Label>
                      <Select value={selectedMedia} onValueChange={setSelectedMedia}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select a video..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="video1">My Latest Video</SelectItem>
                          <SelectItem value="video2">Tutorial Recording</SelectItem>
                          <SelectItem value="video3">Interview with Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="podcastSelect" className="text-sm font-medium">Podcast</Label>
                      <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select a podcast..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="podcast1">The Creator's Journey</SelectItem>
                          <SelectItem value="podcast2">Tech Talks Weekly</SelectItem>
                          <SelectItem value="podcast3">Business Insights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "streaming" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Live Streaming</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="streamingVideo" className="text-sm font-medium">Upload Video or Record in Studio</Label>
                      <div className="mt-1.5 space-y-2">
                        <input
                          type="file"
                          id="streamingVideo"
                          accept="video/*"
                          className="w-full px-3 py-2 border rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setStreamingVideo(file.name);
                            }
                          }}
                        />
                        <Button variant="outline" className="w-full" onClick={() => navigate("/studio")}>
                          <Video className="w-4 h-4 mr-2" />
                          Record in Studio
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="adSelect" className="text-sm font-medium">Select Ad (Optional)</Label>
                      <Select value={selectedAd} onValueChange={setSelectedAd}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="No ad" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="none">No ad</SelectItem>
                          <SelectItem value="pre_roll">Pre-roll Ad</SelectItem>
                          <SelectItem value="mid_roll">Mid-roll Ad</SelectItem>
                          <SelectItem value="post_roll">Post-roll Ad</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Choose where to insert ads in your stream</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Enable Tipping</p>
                          <p className="text-sm text-muted-foreground">Allow viewers to send tips</p>
                        </div>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Subscriptions</p>
                          <p className="text-sm text-muted-foreground">Enable subscription button</p>
                        </div>
                        <Switch checked={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "advanced" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Coming soon...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 bg-muted/20 overflow-y-auto">
          <div className="p-8">
            <div className="mb-4 flex justify-center gap-2">
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === "mobile" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted hover:bg-muted/80"
                }`}
                title="Mobile"
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === "tablet" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted hover:bg-muted/80"
                }`}
                title="Tablet"
              >
                <Tablet className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === "desktop" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted hover:bg-muted/80"
                }`}
                title="Desktop"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>
            
            <Card className={`mx-auto shadow-2xl transition-all ${
              previewDevice === "mobile" ? "max-w-md" :
              previewDevice === "tablet" ? "max-w-2xl" :
              "max-w-4xl"
            }`}>
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden" style={{ backgroundColor }}>
                  <div className={`p-8 flex flex-col items-center ${
                    previewDevice === "mobile" ? "aspect-[9/16]" : "min-h-[600px]"
                  }`}>
                    {/* Profile Image */}
                    <div
                      className={`${
                        imageStyle === "circular"
                          ? "w-32 h-32 rounded-full"
                          : imageStyle === "square"
                          ? "w-32 h-32 rounded-2xl"
                          : "w-40 h-56 rounded-2xl"
                      } mb-4 shadow-lg overflow-hidden ${!profileImage ? "bg-gradient-to-br from-purple-500 to-blue-600" : ""}`}
                    >
                      {profileImage && (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Name */}
                    <h1
                      className={`text-2xl font-bold mb-2 font-${titleFont}`}
                      style={{ color: titleColor }}
                    >
                      {displayName}
                    </h1>

                    {/* Bio */}
                    {bio && (
                      <p className="text-sm text-center mb-4 opacity-90 px-4" style={{ color: titleColor }}>
                        {bio}
                      </p>
                    )}

                    {/* Feature Links */}
                    <div className={`w-full space-y-2 mb-4 ${
                      previewDevice === "desktop" ? "max-w-2xl grid grid-cols-2 gap-2" : ""
                    }`}>
                      {showMeetings && (
                        <Button style={{ backgroundColor: "#facc15", color: "#000000" }} className="w-full font-semibold" size="sm">
                          📅 Book a Meeting
                        </Button>
                      )}
                      {showEvents && (
                        <Button style={{ backgroundColor: "#fb923c", color: "#000000" }} className="w-full font-semibold" size="sm">
                          🎉 View Events
                        </Button>
                      )}
                      {showSignupSheets && (
                        <Button variant="secondary" className="w-full" size="sm">
                          📋 Sign Up
                        </Button>
                      )}
                      {showPolls && (
                        <Button variant="secondary" className="w-full" size="sm">
                          📊 Take a Poll
                        </Button>
                      )}
                      {showAwards && (
                        <Button variant="secondary" className="w-full" size="sm">
                          🏆 Awards
                        </Button>
                      )}
                      {showNewsletter && (
                        <Button variant="secondary" className="w-full" size="sm">
                          📧 Subscribe to Newsletter
                        </Button>
                      )}
                    </div>

                    {/* Custom Links */}
                    {customLinks.filter(l => l.title).map((link, i) => (
                      <Button key={i} variant="outline" className="w-full mb-2" size="sm">
                        {link.title}
                      </Button>
                    ))}

                    {/* QR Code */}
                    {showQRCodes && (
                      <div className="mt-4">
                        <div className="bg-white p-4 rounded-xl shadow-lg">
                          <ProfileQRCode username={username} shape={qrShape} />
                        </div>
                        <p className="text-xs text-center mt-2" style={{ color: titleColor }}>
                          https://seeksy.io/{username}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
