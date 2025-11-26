import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ImageUpload from "@/components/ImageUpload";
import { ProfileSectionOrdering, ProfileSection } from "@/components/ProfileSectionOrdering";
import { ProfileQRCode } from "@/components/ProfileQRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, GripVertical, Pencil, ChevronDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { PODCAST_CATEGORIES } from "@/lib/podcastCategories";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  display_name?: string;
  bio: string;
  avatar_url: string;
  theme_color: string;
  blog_name: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  section: string | null;
}

interface SortableCustomLinkProps {
  link: CustomLink;
  onUpdate: (field: keyof CustomLink, value: string | boolean) => void;
  onRemove: () => void;
}

const SortableCustomLink = ({ link, onUpdate, onRemove }: SortableCustomLinkProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex gap-4 items-start">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing mt-2"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 space-y-4">
          <Input
            placeholder="Link title (e.g., Shop My Store)"
            value={link.title}
            onChange={(e) => onUpdate("title", e.target.value)}
          />
          <Input
            placeholder="https://..."
            value={link.url}
            onChange={(e) => onUpdate("url", e.target.value)}
            type="url"
          />
          <Textarea
            placeholder="Description (optional)"
            value={link.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            rows={2}
          />
          <ImageUpload
            currentImage={link.image_url}
            onImageUploaded={(url) => onUpdate("image_url", url)}
            bucket="event-images"
            label="Link Image (optional)"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};

interface SectionMetadata {
  name: string;
  image_url: string | null;
  display_order: number;
}

const ProfileEdit = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState("#FF6B6B");
  const [pageBackgroundColor, setPageBackgroundColor] = useState("#1a1a1a");
  const [qrCodeColor, setQrCodeColor] = useState("#000000");
  const [includeLogoInQR, setIncludeLogoInQR] = useState(false);
  const [qrCodeShape, setQrCodeShape] = useState<'square' | 'round'>('square');
  const [heroSectionColor, setHeroSectionColor] = useState("#1a1a1a");
  const [customThemeColors, setCustomThemeColors] = useState<string[]>([]);
  const [customBgColors, setCustomBgColors] = useState<string[]>([]);
  const [customHeroColors, setCustomHeroColors] = useState<string[]>([]);
  const [socialIconsColor, setSocialIconsColor] = useState(true); // true = color, false = grayscale
  const [showBlogOnProfile, setShowBlogOnProfile] = useState(true);
  const [showLatestBlogOnly, setShowLatestBlogOnly] = useState(false);
  const [blogName, setBlogName] = useState("");
  const [tippingEnabled, setTippingEnabled] = useState(true);
  const [tippingButtonText, setTippingButtonText] = useState("Send a Tip");
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [newsletterHeading, setNewsletterHeading] = useState("Stay Updated");
  const [newsletterDescription, setNewsletterDescription] = useState("Subscribe to get the latest updates delivered to your inbox.");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [sectionMetadata, setSectionMetadata] = useState<Map<string, SectionMetadata>>(new Map());
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([]);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionImage, setNewSectionImage] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editSectionImage, setEditSectionImage] = useState("");
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('collapsedSections');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Track original values for unsaved changes detection
  const [originalValues, setOriginalValues] = useState({
    username: "",
    fullName: "",
    displayName: "",
    bio: "",
    avatarUrl: "",
    categories: [] as string[],
    themeColor: "#FF6B6B",
    pageBackgroundColor: "#FFFFFF",
    qrCodeColor: "#000000",
    includeLogoInQR: false,
    heroSectionColor: "#F3F4F6",
    socialIconsColor: true,
    showBlogOnProfile: true,
    showLatestBlogOnly: false,
    blogName: "",
    tippingEnabled: true,
    tippingButtonText: "Send a Tip",
    newsletterEnabled: false,
    newsletterHeading: "Stay Updated",
    newsletterDescription: "Subscribe to get the latest updates delivered to your inbox.",
    socialLinks: [] as SocialLink[],
    customLinks: [] as CustomLink[],
    sectionMetadata: new Map<string, SectionMetadata>(),
    profileSections: [] as ProfileSection[],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      // Mark that user has visited their My Page
      await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          my_page_visited: true,
        }, {
          onConflict: 'user_id'
        });

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // If no profile exists, create one
      if (!profile) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            username: user?.email?.split("@")[0] || `user${userId.slice(0, 8)}`,
            full_name: user?.user_metadata?.full_name || "",
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        // Reload with the newly created profile
        if (newProfile) {
          await loadProfile(userId);
        }
        return;
      }

      const loadedValues = {
        username: profile.username || "",
        fullName: profile.full_name || "",
        displayName: (profile as any).display_name || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatar_url || "",
        categories: (profile as any).categories || [],
        themeColor: profile.theme_color || "#FF6B6B",
        pageBackgroundColor: (profile as any).page_background_color || "#1a1a1a",
        qrCodeColor: (profile as any).qr_code_color || "#000000",
        includeLogoInQR: (profile as any).include_logo_in_qr || false,
        heroSectionColor: (profile as any).hero_section_color || "#1a1a1a",
        socialIconsColor: profile.social_icons_color !== false,
        showBlogOnProfile: profile.show_blog_on_profile !== false,
        showLatestBlogOnly: profile.show_latest_blog_only === true,
        blogName: profile.blog_name || profile.username || "",
        tippingEnabled: (profile as any).tipping_enabled !== false,
        tippingButtonText: (profile as any).tipping_button_text || "Send a Tip",
        newsletterEnabled: (profile as any).newsletter_enabled === true,
        newsletterHeading: (profile as any).newsletter_heading || "Stay Updated",
        newsletterDescription: (profile as any).newsletter_description || "Subscribe to get the latest updates delivered to your inbox.",
      };

      setUsername(loadedValues.username);
      setFullName(loadedValues.fullName);
      setDisplayName(loadedValues.displayName);
      setBio(loadedValues.bio);
      setAvatarUrl(loadedValues.avatarUrl);
      setCategories(loadedValues.categories);
      setThemeColor(loadedValues.themeColor);
      setPageBackgroundColor(loadedValues.pageBackgroundColor);
      setQrCodeColor(loadedValues.qrCodeColor);
      setIncludeLogoInQR(loadedValues.includeLogoInQR);
      setHeroSectionColor(loadedValues.heroSectionColor);
      setSocialIconsColor(loadedValues.socialIconsColor);
      setShowBlogOnProfile(loadedValues.showBlogOnProfile);
      setShowLatestBlogOnly(loadedValues.showLatestBlogOnly);
      setBlogName(loadedValues.blogName);
      setTippingEnabled(loadedValues.tippingEnabled);
      setTippingButtonText(loadedValues.tippingButtonText);
      setNewsletterEnabled(loadedValues.newsletterEnabled);
      setNewsletterHeading(loadedValues.newsletterHeading);
      setNewsletterDescription(loadedValues.newsletterDescription);
      
      // Load custom colors from database
      const customTheme = (profile as any).custom_theme_colors || [];
      const customBg = (profile as any).custom_bg_colors || [];
      const customHero = (profile as any).custom_hero_colors || [];
      setCustomThemeColors(Array.isArray(customTheme) ? customTheme : []);
      setCustomBgColors(Array.isArray(customBg) ? customBg : []);
      setCustomHeroColors(Array.isArray(customHero) ? customHero : []);

      const { data: links } = await supabase
        .from("social_links")
        .select("*")
        .eq("profile_id", userId)
        .order("display_order");

      setSocialLinks(links || []);

      const { data: customLinksData } = await supabase
        .from("custom_links")
        .select("*")
        .eq("profile_id", userId)
        .order("display_order");

      setCustomLinks(customLinksData || []);
      
      // Load section metadata
      const { data: sectionsData } = await supabase
        .from("custom_link_sections")
        .select("*")
        .eq("profile_id", userId)
        .order("display_order");

      const metadata = new Map<string, SectionMetadata>();
      if (sectionsData) {
        sectionsData.forEach(section => {
          metadata.set(section.name, {
            name: section.name,
            image_url: section.image_url,
            display_order: section.display_order || 0,
          });
        });
        setSectionMetadata(metadata);
      }
      
      // Load profile section ordering
      const { data: sectionOrderData } = await supabase
        .from("profile_section_order")
        .select("*")
        .eq("profile_id", userId)
        .order("display_order");

      // Build section list with custom sections
      const customSectionNames = Array.from(new Set((customLinksData || []).map(link => link.section).filter(Boolean)));
      const builtInSections: ProfileSection[] = [
        { id: 'events', type: 'events', label: 'Events', isVisible: false, displayOrder: 0 },
        { id: 'meetings', type: 'meetings', label: 'Book a Meeting', isVisible: false, displayOrder: 1 },
        { id: 'signup_sheets', type: 'signup_sheets', label: 'Sign-up Sheets', isVisible: false, displayOrder: 2 },
        { id: 'polls', type: 'polls', label: 'Polls', isVisible: false, displayOrder: 3 },
        { id: 'podcasts', type: 'podcasts', label: 'Podcasts', isVisible: false, displayOrder: 4 },
        { id: 'blog', type: 'blog', label: 'Blog', isVisible: false, displayOrder: 5 },
      ];

      const customSections: ProfileSection[] = customSectionNames.map((name, index) => ({
        id: `custom_section:${name}`,
        type: `custom_section:${name}`,
        label: name || 'Untitled Section',
        isVisible: false,
        displayOrder: builtInSections.length + index,
      }));

      let allSections = [...builtInSections, ...customSections];

      // Apply saved ordering if it exists
      if (sectionOrderData && sectionOrderData.length > 0) {
        const orderMap = new Map(sectionOrderData.map(s => [s.section_type, s]));
        allSections = allSections.map(section => {
          const saved = orderMap.get(section.type);
          return saved ? {
            ...section,
            isVisible: saved.is_visible,
            displayOrder: saved.display_order,
          } : section;
        }).sort((a, b) => a.displayOrder - b.displayOrder);
      }

      setProfileSections(allSections);
      
      // Store original values
      setOriginalValues({
        ...loadedValues,
        categories: loadedValues.categories,
        socialLinks: links || [],
        customLinks: customLinksData || [],
        sectionMetadata: new Map(metadata),
        profileSections: allSections,
      });
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save categories
  useEffect(() => {
    const saveCategories = async () => {
      if (!user) {
        console.log('No user, skipping category save');
        return;
      }

      const originalCats = [...(originalValues.categories || [])].sort();
      const currentCats = [...(categories || [])].sort();
      
      if (JSON.stringify(currentCats) === JSON.stringify(originalCats)) {
        console.log('Categories unchanged, skipping save');
        return;
      }

      console.log('Saving categories:', categories);

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ categories })
          .eq("id", user.id);

        if (error) throw error;

        setOriginalValues(prev => ({ ...prev, categories: [...categories] }));
        
        toast({
          title: "Categories saved",
          duration: 2000,
        });
      } catch (error: any) {
        console.error("Error saving categories:", error);
        toast({
          title: "Failed to save categories",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    const timeoutId = setTimeout(saveCategories, 1000);
    return () => clearTimeout(timeoutId);
  }, [categories, user, toast, originalValues.categories]);

  // Check for unsaved changes whenever form values change
  useEffect(() => {
    // Helper to compare Maps
    const mapsEqual = (map1: Map<string, SectionMetadata>, map2: Map<string, SectionMetadata>) => {
      if (map1.size !== map2.size) return false;
      for (const [key, value] of map1) {
        const otherValue = map2.get(key);
        if (!otherValue || JSON.stringify(value) !== JSON.stringify(otherValue)) {
          return false;
        }
      }
      return true;
    };

    const hasChanges = 
      username !== originalValues.username ||
      fullName !== originalValues.fullName ||
      bio !== originalValues.bio ||
      avatarUrl !== originalValues.avatarUrl ||
      JSON.stringify(categories) !== JSON.stringify(originalValues.categories) ||
      themeColor !== originalValues.themeColor ||
      pageBackgroundColor !== originalValues.pageBackgroundColor ||
      qrCodeColor !== originalValues.qrCodeColor ||
      includeLogoInQR !== originalValues.includeLogoInQR ||
      heroSectionColor !== originalValues.heroSectionColor ||
      socialIconsColor !== originalValues.socialIconsColor ||
      showBlogOnProfile !== originalValues.showBlogOnProfile ||
      showLatestBlogOnly !== originalValues.showLatestBlogOnly ||
      blogName !== originalValues.blogName ||
      JSON.stringify(socialLinks) !== JSON.stringify(originalValues.socialLinks) ||
      JSON.stringify(customLinks) !== JSON.stringify(originalValues.customLinks) ||
      !mapsEqual(sectionMetadata, originalValues.sectionMetadata) ||
      JSON.stringify(profileSections) !== JSON.stringify(originalValues.profileSections) ||
      JSON.stringify(customThemeColors) !== JSON.stringify([]) ||
      JSON.stringify(customBgColors) !== JSON.stringify([]) ||
      JSON.stringify(customHeroColors) !== JSON.stringify([]);
    setHasUnsavedChanges(hasChanges);
  }, [username, fullName, bio, avatarUrl, categories, themeColor, pageBackgroundColor, qrCodeColor, includeLogoInQR, heroSectionColor, socialIconsColor, blogName, showBlogOnProfile, showLatestBlogOnly, socialLinks, customLinks, sectionMetadata, profileSections, customThemeColors, customBgColors, customHeroColors, originalValues]);

  // Update profileSections when custom links change
  useEffect(() => {
    const customSectionNames = Array.from(new Set(customLinks.map(link => link.section).filter(Boolean)));
    const builtInSections: ProfileSection[] = [
      { id: 'events', type: 'events', label: 'Events', isVisible: false, displayOrder: 0 },
      { id: 'meetings', type: 'meetings', label: 'Book a Meeting', isVisible: false, displayOrder: 1 },
      { id: 'signup_sheets', type: 'signup_sheets', label: 'Sign-up Sheets', isVisible: false, displayOrder: 2 },
      { id: 'polls', type: 'polls', label: 'Polls', isVisible: false, displayOrder: 3 },
      { id: 'podcasts', type: 'podcasts', label: 'Podcasts', isVisible: false, displayOrder: 4 },
      { id: 'blog', type: 'blog', label: 'Blog', isVisible: false, displayOrder: 5 },
    ];

    const customSections: ProfileSection[] = customSectionNames.map((name) => ({
      id: `custom_section:${name}`,
      type: `custom_section:${name}`,
      label: name || 'Untitled Section',
      isVisible: false,
      displayOrder: builtInSections.length + customSectionNames.indexOf(name),
    }));

    // Merge with existing profileSections to preserve visibility and order settings
    const existingSectionsMap = new Map(profileSections.map(s => [s.id, s]));
    const updatedSections = [...builtInSections, ...customSections].map(section => {
      const existing = existingSectionsMap.get(section.id);
      return existing || section;
    });

    // Only update if sections actually changed
    if (JSON.stringify(updatedSections) !== JSON.stringify(profileSections)) {
      setProfileSections(updatedSections);
    }
  }, [customLinks]);


  const predefinedPlatforms = [
    "Instagram", "Twitter", "LinkedIn", "Facebook", "TikTok", "YouTube", 
    "GitHub", "Website", "Discord", "Twitch"
  ];

  const updateSocialLink = (platform: string, url: string) => {
    const existingIndex = socialLinks.findIndex(link => link.platform === platform);
    
    if (url.trim() === "") {
      // Remove if URL is empty
      if (existingIndex !== -1) {
        setSocialLinks(socialLinks.filter((_, i) => i !== existingIndex));
      }
    } else {
      // Update or add
      if (existingIndex !== -1) {
        const updated = [...socialLinks];
        updated[existingIndex].url = url;
        setSocialLinks(updated);
      } else {
        setSocialLinks([
          ...socialLinks,
          {
            id: `temp-${Date.now()}`,
            platform,
            url,
            display_order: socialLinks.length,
          },
        ]);
      }
    }
  };

  const getSocialLinkUrl = (platform: string) => {
    return socialLinks.find(link => link.platform === platform)?.url || "";
  };

  const addCustomLink = (section: string | null = null) => {
    setCustomLinks([
      ...customLinks,
      {
        id: crypto.randomUUID(),
        title: "",
        url: "",
        description: "",
        image_url: "",
        display_order: customLinks.length,
        is_active: true,
        section,
      },
    ]);
  };

  const addSection = () => {
    setShowSectionDialog(true);
  };

  const handleCreateSection = () => {
    if (newSectionName.trim()) {
      const sectionName = newSectionName.trim();
      
      // Add to section metadata
      const newMetadata = new Map(sectionMetadata);
      newMetadata.set(sectionName, {
        name: sectionName,
        image_url: newSectionImage || null,
        display_order: newMetadata.size,
      });
      setSectionMetadata(newMetadata);
      
      // Add the first link to the section
      addCustomLink(sectionName);
      
      setNewSectionName("");
      setNewSectionImage("");
      setShowSectionDialog(false);
    }
  };

  const handleEditSection = (oldSection: string) => {
    setEditingSection(oldSection);
    setEditSectionName(oldSection);
    // Load the current image for this section
    const metadata = sectionMetadata.get(oldSection);
    setEditSectionImage(metadata?.image_url || "");
  };

  const handleSaveEditSection = () => {
    if (editSectionName.trim() && editingSection) {
      const newSectionName = editSectionName.trim();
      
      // Update custom links with new section name
      setCustomLinks(customLinks.map(link => 
        link.section === editingSection
          ? { ...link, section: newSectionName }
          : link
      ));
      
      // Update section metadata
      const newMetadata = new Map(sectionMetadata);
      const oldMetadata = newMetadata.get(editingSection);
      newMetadata.delete(editingSection);
      newMetadata.set(newSectionName, {
        name: newSectionName,
        image_url: editSectionImage || null,
        display_order: oldMetadata?.display_order || 0,
      });
      setSectionMetadata(newMetadata);
      
      setEditingSection(null);
      setEditSectionName("");
      setEditSectionImage("");
    }
  };

  const handleDeleteSection = (section: string) => {
    setDeletingSection(section);
  };

  const confirmDeleteSection = () => {
    if (deletingSection) {
      setCustomLinks(customLinks.filter(link => link.section !== deletingSection));
      
      // Remove from section metadata
      const newMetadata = new Map(sectionMetadata);
      newMetadata.delete(deletingSection);
      setSectionMetadata(newMetadata);
      
      setDeletingSection(null);
    }
  };

  const toggleSectionCollapse = (section: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      localStorage.setItem('collapsedSections', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCustomLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Update display_order for all items
        return reordered.map((item, index) => ({
          ...item,
          display_order: index,
        }));
      });
    }
  };

  // Group links by section
  const sections = Array.from(new Set(customLinks.map(link => link.section)));
  const linksBySection = sections.reduce((acc, section) => {
    acc[section || ""] = customLinks.filter(link => link.section === section);
    return acc;
  }, {} as Record<string, CustomLink[]>);

  const updateCustomLink = (index: number, field: keyof CustomLink, value: string | boolean) => {
    const updated = [...customLinks];
    updated[index] = { ...updated[index], [field]: value };
    setCustomLinks(updated);
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!user) throw new Error("Not authenticated");

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username,
          full_name: fullName,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          categories,
          theme_color: themeColor,
          page_background_color: pageBackgroundColor,
          qr_code_color: qrCodeColor,
          include_logo_in_qr: includeLogoInQR,
          hero_section_color: heroSectionColor,
          social_icons_color: socialIconsColor,
          show_blog_on_profile: showBlogOnProfile,
          show_latest_blog_only: showLatestBlogOnly,
          blog_name: blogName,
          tipping_enabled: tippingEnabled,
          tipping_button_text: tippingButtonText,
          newsletter_enabled: newsletterEnabled,
          newsletter_heading: newsletterHeading,
          newsletter_description: newsletterDescription,
          custom_theme_colors: customThemeColors,
          custom_bg_colors: customBgColors,
          custom_hero_colors: customHeroColors,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Delete existing social links
      await supabase
        .from("social_links")
        .delete()
        .eq("profile_id", user.id);

      // Insert new social links
      const linksToInsert = socialLinks
        .filter(link => link.platform && link.url)
        .map((link, index) => ({
          profile_id: user.id,
          platform: link.platform,
          url: link.url,
          display_order: index,
        }));

      if (linksToInsert.length > 0) {
        const { error: linksError } = await supabase
          .from("social_links")
          .insert(linksToInsert);

        if (linksError) throw linksError;
      }

      // Delete existing custom links
      await supabase
        .from("custom_links")
        .delete()
        .eq("profile_id", user.id);

      // Insert new custom links
      const customLinksToInsert = customLinks
        .filter(link => link.title && link.url)
        .map((link, index) => ({
          profile_id: user.id,
          title: link.title,
          url: link.url,
          description: link.description || null,
          image_url: link.image_url || null,
          display_order: index,
          is_active: link.is_active,
          section: link.section || null,
        }));

      if (customLinksToInsert.length > 0) {
        const { error: customLinksError } = await supabase
          .from("custom_links")
          .insert(customLinksToInsert);

        if (customLinksError) throw customLinksError;
      }

      // Save section metadata
      await supabase
        .from("custom_link_sections")
        .delete()
        .eq("profile_id", user.id);

      const sectionsToInsert = Array.from(sectionMetadata.values()).map((section, index) => ({
        profile_id: user.id,
        name: section.name,
        image_url: section.image_url,
        display_order: index,
      }));

      if (sectionsToInsert.length > 0) {
        const { error: sectionsError } = await supabase
          .from("custom_link_sections")
          .insert(sectionsToInsert);

        if (sectionsError) throw sectionsError;
      }

      // Save profile section ordering
      await supabase
        .from("profile_section_order")
        .delete()
        .eq("profile_id", user.id);

      const sectionOrderToInsert = profileSections.map(section => ({
        profile_id: user.id,
        section_type: section.type,
        display_order: section.displayOrder,
        is_visible: section.isVisible,
      }));

      if (sectionOrderToInsert.length > 0) {
        const { error: orderError } = await supabase
          .from("profile_section_order")
          .insert(sectionOrderToInsert);

        if (orderError) throw orderError;
      }

      // Update original values after successful save
      setOriginalValues({
        username,
        fullName,
        displayName,
        bio,
        avatarUrl,
        categories,
        themeColor,
        pageBackgroundColor,
        qrCodeColor,
        includeLogoInQR,
        heroSectionColor,
        socialIconsColor,
        showBlogOnProfile,
        showLatestBlogOnly,
        blogName,
        tippingEnabled,
        tippingButtonText,
        newsletterEnabled,
        newsletterHeading,
        newsletterDescription,
        socialLinks,
        customLinks,
        sectionMetadata,
        profileSections,
      });

      setHasUnsavedChanges(false);

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });

      navigate(`/${username}`);
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground mt-2">
                Customize your public profile page
              </p>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Edit Form */}
          <div>
            <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-lg font-semibold">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your name appears on your profile"
            />
            <p className="text-sm text-muted-foreground">
              This is the name shown at the top of your My Page (e.g., "Johnny Rocket" instead of "Johnny-Rocket")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-lg font-semibold">Username *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="yourusername"
            />
            <p className="text-sm text-muted-foreground">
              Your profile will be at: seeksy.io/{username}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-lg font-semibold">Description</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Content Categories</Label>
            <p className="text-sm text-muted-foreground">
              Select categories that match your content for better ad targeting and discovery
            </p>
            <div className="flex flex-wrap gap-2">
              {PODCAST_CATEGORIES.map((category) => {
                const isSelected = categories.includes(category);
                return (
                  <Badge
                    key={category}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      if (isSelected) {
                        setCategories(categories.filter(c => c !== category));
                      } else {
                        setCategories([...categories, category]);
                      }
                    }}
                  >
                    {category}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-semibold">Profile Image</Label>
            <ImageUpload
              label=""
              onImageUploaded={setAvatarUrl}
              currentImage={avatarUrl}
              bucket="avatars"
              variant="avatar"
            />
          </div>

          {/* Page Design Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !collapsedSections.has('page-design');
                  setCollapsedSections(prev => {
                    const newSet = new Set(prev);
                    if (newState) {
                      newSet.add('page-design');
                    } else {
                      newSet.delete('page-design');
                    }
                    return newSet;
                  });
                }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    collapsedSections.has('page-design') ? '-rotate-90' : ''
                  }`}
                />
                <h3 className="text-lg font-semibold">Page Design</h3>
              </button>
            </div>
            
            {!collapsedSections.has('page-design') && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Theme Color</h4>
                  <p className="text-sm text-muted-foreground">
                    Accent color for buttons, links, and highlights on your profile
                  </p>
                  <div className="flex gap-3 items-center">
                    <label className="relative w-12 h-12 rounded-full cursor-pointer hover:scale-110 transition-transform shrink-0">
                      <div className="w-12 h-12 rounded-full" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-[1px]">
                          <Plus className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <Input
                        id="themeColor"
                        type="color"
                        value={themeColor}
                        onChange={(e) => {
                          const newColor = e.target.value.toUpperCase();
                          setThemeColor(newColor);
                          // Add to custom colors immediately if not already present
                          const defaultColors = ['#000000', '#424242', '#757575', '#BDBDBD', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'];
                          if (!defaultColors.includes(newColor) && !customThemeColors.includes(newColor)) {
                            setCustomThemeColors([...customThemeColors, newColor]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
                      <div 
                        className="w-8 h-8 rounded-md border-2 border-border shrink-0" 
                        style={{ backgroundColor: themeColor }}
                      />
                      <span className="text-sm font-mono">{themeColor}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {customThemeColors.map((color, index) => (
                      <button
                        key={`custom-theme-${index}`}
                        type="button"
                        onClick={() => setThemeColor(color)}
                        className={`w-12 h-12 rounded-full border-4 hover:scale-110 transition-all ${themeColor === color ? 'border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <p className="text-xs text-muted-foreground w-full mb-1">Default colors:</p>
                    {['#000000', '#424242', '#757575', '#BDBDBD', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setThemeColor(color)}
                        className="w-10 h-10 rounded-full border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Page Background Color</h4>
                  <p className="text-sm text-muted-foreground">
                    Background color for your profile page
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <label className="relative w-12 h-12 rounded-full cursor-pointer hover:scale-110 transition-transform">
                      <div className="w-12 h-12 rounded-full" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-[1px]">
                          <Plus className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <Input
                        id="pageBackgroundColor"
                        type="color"
                        value={pageBackgroundColor}
                        onChange={(e) => {
                          const newColor = e.target.value.toUpperCase();
                          setPageBackgroundColor(newColor);
                          // Add to custom colors immediately if not already present
                          const defaultColors = ['#000000', '#424242', '#757575', '#BDBDBD', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'];
                          if (!defaultColors.includes(newColor) && !customBgColors.includes(newColor)) {
                            setCustomBgColors([...customBgColors, newColor]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    {customBgColors.map((color, index) => (
                      <button
                        key={`custom-bg-${index}`}
                        type="button"
                        onClick={() => setPageBackgroundColor(color)}
                        className={`w-12 h-12 rounded-full border-4 hover:scale-110 transition-all ${pageBackgroundColor === color ? 'border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <p className="text-xs text-muted-foreground w-full mb-1">Default colors:</p>
                    {['#000000', '#424242', '#757575', '#BDBDBD', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPageBackgroundColor(color)}
                        className="w-10 h-10 rounded-full border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Hero Section Color</h4>
                  <p className="text-sm text-muted-foreground">
                    Background color for the profile image and name section
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <label className="relative w-12 h-12 rounded-full cursor-pointer hover:scale-110 transition-transform">
                      <div className="w-12 h-12 rounded-full" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-[1px]">
                          <Plus className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <Input
                        id="heroSectionColor"
                        type="color"
                        value={heroSectionColor}
                        onChange={(e) => {
                          const newColor = e.target.value.toUpperCase();
                          setHeroSectionColor(newColor);
                          // Add to custom colors immediately if not already present
                          const defaultColors = ['#000000', '#424242', '#757575', '#BDBDBD', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'];
                          if (!defaultColors.includes(newColor) && !customHeroColors.includes(newColor)) {
                            setCustomHeroColors([...customHeroColors, newColor]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    {customHeroColors.map((color, index) => (
                      <button
                        key={`custom-hero-${index}`}
                        type="button"
                        onClick={() => setHeroSectionColor(color)}
                        className={`w-12 h-12 rounded-full border-4 hover:scale-110 transition-all ${heroSectionColor === color ? 'border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <p className="text-xs text-muted-foreground w-full mb-1">Default colors:</p>
                    {['#000000', '#424242', '#757575', '#BDBDBD', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setHeroSectionColor(color)}
                        className="w-10 h-10 rounded-full border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !collapsedSections.has('qr-code');
                  setCollapsedSections(prev => {
                    const newSet = new Set(prev);
                    if (newState) {
                      newSet.add('qr-code');
                    } else {
                      newSet.delete('qr-code');
                    }
                    return newSet;
                  });
                }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    collapsedSections.has('qr-code') ? '-rotate-90' : ''
                  }`}
                />
                <h3 className="text-lg font-semibold">QR Code</h3>
              </button>
            </div>
            
            {!collapsedSections.has('qr-code') && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="qrCodeColor" className="text-sm font-medium">QR Code Color</Label>
                      <div className="flex gap-3 items-center mt-2">
                        <Input
                          id="qrCodeColor"
                          type="color"
                          value={qrCodeColor}
                          onChange={(e) => setQrCodeColor(e.target.value)}
                          className="w-16 h-10 cursor-pointer"
                        />
                        <div className="flex gap-2 flex-wrap">
                          {['#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', '#1F2937'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setQrCodeColor(color)}
                              className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Label className="text-sm font-medium">QR Shape</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant={qrCodeShape === 'square' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQrCodeShape('square')}
                          className="px-3"
                        >
                          Square
                        </Button>
                        <Button
                          type="button"
                          variant={qrCodeShape === 'round' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setQrCodeShape('round')}
                          className="px-3"
                        >
                          Round
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Include Logo in QR Code</p>
                      <p className="text-xs text-muted-foreground">
                        Show your profile image in the center of the QR code
                      </p>
                    </div>
                    <Switch
                      checked={includeLogoInQR}
                      onCheckedChange={setIncludeLogoInQR}
                    />
                  </div>
                </div>
                <ProfileQRCode 
                  username={username} 
                  themeColor={qrCodeColor} 
                  logoUrl={includeLogoInQR ? avatarUrl : undefined}
                  shape={qrCodeShape}
                />
              </div>
            )}
          </div>

          {/* Tipping Settings Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !collapsedSections.has('tipping');
                  setCollapsedSections(prev => {
                    const newSet = new Set(prev);
                    if (newState) {
                      newSet.add('tipping');
                    } else {
                      newSet.delete('tipping');
                    }
                    return newSet;
                  });
                }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    collapsedSections.has('tipping') ? '-rotate-90' : ''
                  }`}
                />
                <h3 className="text-lg font-semibold">Tipping & Donations</h3>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure how viewers can support you during live streams
            </p>
            
            {!collapsedSections.has('tipping') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Enable Tipping</p>
                    <p className="text-sm text-muted-foreground">
                      Show tipping button to viewers during live streams
                    </p>
                  </div>
                  <Switch
                    checked={tippingEnabled}
                    onCheckedChange={setTippingEnabled}
                  />
                </div>

                {tippingEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="tipping-button-text">Button Text</Label>
                    <select
                      id="tipping-button-text"
                      value={tippingButtonText}
                      onChange={(e) => setTippingButtonText(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="Send a Tip">Send a Tip</option>
                      <option value="Donate">Donate</option>
                      <option value="Send Funds">Send Funds</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Choose how the button will appear to your viewers
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Newsletter Settings Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !collapsedSections.has('newsletter');
                  setCollapsedSections(prev => {
                    const newSet = new Set(prev);
                    if (newState) {
                      newSet.add('newsletter');
                    } else {
                      newSet.delete('newsletter');
                    }
                    return newSet;
                  });
                }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    collapsedSections.has('newsletter') ? '-rotate-90' : ''
                  }`}
                />
                <h3 className="text-lg font-semibold">Newsletter Subscription</h3>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Let visitors subscribe to your newsletter from your profile page
            </p>
            
            {!collapsedSections.has('newsletter') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Show Newsletter Signup</p>
                    <p className="text-sm text-muted-foreground">
                      Display newsletter subscription form on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={newsletterEnabled}
                    onCheckedChange={setNewsletterEnabled}
                  />
                </div>

                {newsletterEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newsletter-heading">Heading</Label>
                      <Input
                        id="newsletter-heading"
                        value={newsletterHeading}
                        onChange={(e) => setNewsletterHeading(e.target.value)}
                        placeholder="Stay Updated"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newsletter-description">Description</Label>
                      <Textarea
                        id="newsletter-description"
                        value={newsletterDescription}
                        onChange={(e) => setNewsletterDescription(e.target.value)}
                        placeholder="Subscribe to get the latest updates delivered to your inbox."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !collapsedSections.has('social-media');
                  setCollapsedSections(prev => {
                    const newSet = new Set(prev);
                    if (newState) {
                      newSet.add('social-media');
                    } else {
                      newSet.delete('social-media');
                    }
                    return newSet;
                  });
                }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    collapsedSections.has('social-media') ? '-rotate-90' : ''
                  }`}
                />
                <h3 className="text-lg font-semibold">Social Links</h3>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add links to your social media profiles
            </p>
            
            {!collapsedSections.has('social-media') && (
              <>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                  <div>
                    <p className="font-medium">Colorful Icons</p>
                    <p className="text-sm text-muted-foreground">
                      Show social media icons in their brand colors
                    </p>
                  </div>
                  <Switch
                    checked={socialIconsColor}
                    onCheckedChange={setSocialIconsColor}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predefinedPlatforms.map((platform) => (
                    <div key={platform} className="space-y-2">
                      <Label htmlFor={platform} className="text-sm font-medium">
                        {platform}
                      </Label>
                      <Input
                        id={platform}
                        placeholder={`Your ${platform} URL`}
                        value={getSocialLinkUrl(platform)}
                        onChange={(e) => updateSocialLink(platform, e.target.value)}
                        type="url"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Blog Settings */}
          <div className="space-y-4 pt-6 border-t">
            <div>
              <h3 className="text-lg font-semibold mb-2">Blog Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Control how your blog appears on your profile
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-name">Blog Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="blog-name"
                  placeholder="Your blog name"
                  value={blogName}
                  onChange={(e) => setBlogName(e.target.value)}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.blog</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your blog will be available at seeksy.io/{blogName}.blog
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Show Blog on Profile</p>
                <p className="text-sm text-muted-foreground">
                  Display your blog posts on your public profile
                </p>
              </div>
              <Switch
                checked={showBlogOnProfile}
                onCheckedChange={setShowBlogOnProfile}
              />
            </div>
            {showBlogOnProfile && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Show Latest Blog Only</p>
                  <p className="text-sm text-muted-foreground">
                    Display only your most recent blog post
                  </p>
                </div>
                <Switch
                  checked={showLatestBlogOnly}
                  onCheckedChange={setShowLatestBlogOnly}
                />
              </div>
            )}
          </div>

          {/* Streaming Channel Settings */}
          <div className="pt-6 border-t">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Streaming Channel Settings <span className="text-muted-foreground font-normal">(optional)</span></h3>
              <p className="text-sm text-muted-foreground mt-2">
                Configure streaming settings in the Studio when you're ready to go live
              </p>
            </div>
          </div>

          {/* Section Ordering */}
          <div className="space-y-4 pt-6 border-t">
            <ProfileSectionOrdering
              sections={profileSections}
              onSectionsChange={setProfileSections}
            />
          </div>

          {/* Custom Links Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Custom Links</h3>
                <p className="text-sm text-muted-foreground">
                  Organize your links into sections
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomLink(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={customLinks.map(link => link.id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <div key={section || "no-section"} className="space-y-3">
                    {section ? (
                      <>
                        {/* Section Header with Chevron */}
                        <div className="flex items-center gap-2 mt-6 mb-3 pb-2 border-b">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSectionCollapse(section);
                            }}
                            className="flex items-center gap-2 flex-1 text-left hover:opacity-70 transition-opacity"
                          >
                            <ChevronDown 
                              className={`h-5 w-5 transition-transform duration-200 ${
                                collapsedSections.has(section) ? '-rotate-90' : ''
                              }`}
                            />
                            <h3 className="font-semibold text-lg">{section}</h3>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSection(section)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSection(section)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addCustomLink(section)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Links under this section */}
                        {!collapsedSections.has(section) && (
                          <div className="space-y-2 pl-4">
                            {linksBySection[section || ""].map((link) => (
                              <SortableCustomLink
                                key={link.id}
                                link={link}
                                onUpdate={(field, value) => {
                                  const index = customLinks.findIndex(l => l.id === link.id);
                                  updateCustomLink(index, field, value);
                                }}
                                onRemove={() => {
                                  const index = customLinks.findIndex(l => l.id === link.id);
                                  removeCustomLink(index);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Links without a section */
                      <div className="space-y-2">
                        {linksBySection[""].map((link) => (
                          <SortableCustomLink
                            key={link.id}
                            link={link}
                            onUpdate={(field, value) => {
                              const index = customLinks.findIndex(l => l.id === link.id);
                              updateCustomLink(index, field, value);
                            }}
                            onRemove={() => {
                              const index = customLinks.findIndex(l => l.id === link.id);
                              removeCustomLink(index);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </SortableContext>
            </DndContext>

            {customLinks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No custom links yet</p>
                <p className="text-xs mt-1">Add custom links to promote your content</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasUnsavedChanges || !username}
              className="flex-1"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasUnsavedChanges ? "Save Changes" : "No Changes"}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="link"
              onClick={() => navigate(`/${username}`)}
              className="w-full"
            >
              Preview Your Profile →
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Column - Phone Preview */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
          <div className="relative">
            {/* Phone Frame */}
            <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl border-8 border-gray-800">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10" />
              
              {/* Screen */}
              <div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ height: '667px' }}>
                {/* Live Preview Content */}
                <div className="h-full overflow-y-auto" style={{ backgroundColor: pageBackgroundColor }}>
                  {/* Hero Section */}
                  <div className="py-8 px-6 text-center" style={{ backgroundColor: heroSectionColor }}>
                    {avatarUrl && (
                      <img
                        src={avatarUrl}
                        alt={displayName || fullName || username}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4"
                        style={{ borderColor: themeColor }}
                      />
                    )}
                    <h1 className="text-2xl font-bold mb-2" style={{ color: pageBackgroundColor === '#FFFFFF' || pageBackgroundColor === '#ffffff' ? '#000000' : '#FFFFFF' }}>
                      {displayName || fullName || username}
                    </h1>
                    {bio && (
                      <p className="text-sm opacity-80" style={{ color: pageBackgroundColor === '#FFFFFF' || pageBackgroundColor === '#ffffff' ? '#000000' : '#FFFFFF' }}>
                        {bio}
                      </p>
                    )}
                  </div>
                  
                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {categories.slice(0, 3).map((category) => (
                          <span
                            key={category}
                            className="text-xs px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: themeColor,
                              color: '#FFFFFF',
                            }}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Sample Links */}
                  <div className="px-6 py-4 space-y-3">
                    <div className="p-4 rounded-xl border-2" style={{ borderColor: themeColor, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                      <div className="font-semibold" style={{ color: themeColor }}>Sample Link</div>
                      <div className="text-sm text-gray-600">Click to visit</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* All changes saved indicator */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs rounded-full shadow-lg">
              Live Preview
            </div>
          </div>
        </div>
      </div>
    </div>
      </main>

      {/* Section Name Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Enter a name for your new section to organize your links
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                placeholder="e.g., Shop, Services, Resources"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSection();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-image">Section Image (optional)</Label>
              <ImageUpload
                currentImage={newSectionImage}
                onImageUploaded={setNewSectionImage}
                bucket="avatars"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSectionDialog(false);
                setNewSectionName("");
                setNewSectionImage("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateSection}
              disabled={!newSectionName.trim()}
            >
              Create Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Change the name and image of this section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-section-name">Section Name</Label>
              <Input
                id="edit-section-name"
                placeholder="e.g., Shop, Services, Resources"
                value={editSectionName}
                onChange={(e) => setEditSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEditSection();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-section-image">Section Image (optional)</Label>
              <ImageUpload
                currentImage={editSectionImage}
                onImageUploaded={setEditSectionImage}
                bucket="avatars"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingSection(null);
                setEditSectionName("");
                setEditSectionImage("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditSection}
              disabled={!editSectionName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={!!deletingSection} onOpenChange={(open) => !open && setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deletingSection}" section? This will also delete all {linksBySection[deletingSection || ""]?.length || 0} link(s) in this section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileEdit;
