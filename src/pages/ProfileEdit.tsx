import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import ImageUpload from "@/components/ImageUpload";
import { ProfileSectionOrdering, ProfileSection } from "@/components/ProfileSectionOrdering";
import { ProfileQRCode } from "@/components/ProfileQRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, GripVertical, Pencil, ChevronDown, Sparkles, Monitor, Tablet, Smartphone, Maximize2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const [imageStyle, setImageStyle] = useState<'circular' | 'rounded-square' | 'portrait'>('circular');
  const [titleFont, setTitleFont] = useState<'serif' | 'sans' | 'script'>('serif');
  const [activeTab, setActiveTab] = useState<'profile' | 'design' | 'streaming' | 'advanced'>('profile');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [heroSectionColor, setHeroSectionColor] = useState("#1a1a1a");
  const [customThemeColors, setCustomThemeColors] = useState<string[]>([]);
  const [customBgColors, setCustomBgColors] = useState<string[]>([]);
  const [customHeroColors, setCustomHeroColors] = useState<string[]>([]);
  const [socialIconsColor, setSocialIconsColor] = useState(true);
  const [showBlogOnProfile, setShowBlogOnProfile] = useState(true);
  const [showLatestBlogOnly, setShowLatestBlogOnly] = useState(false);
  const [blogName, setBlogName] = useState("");
  const [tippingEnabled, setTippingEnabled] = useState(true);
  const [tippingButtonText, setTippingButtonText] = useState("Send a Tip");
  const [tippingGoalEnabled, setTippingGoalEnabled] = useState(false);
  const [tippingGoalAmount, setTippingGoalAmount] = useState("");
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

  // Celebration function
  const celebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

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
        .single();

      if (profileError) throw profileError;

      if (profile) {
        const loadedValues = {
          username: profile.username || "",
          fullName: profile.full_name || "",
          displayName: (profile as any).display_name || profile.full_name || "",
          bio: profile.bio || "",
          avatarUrl: profile.avatar_url || "",
          categories: profile.categories || [],
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
        
        const { data: sectionOrderData } = await supabase
          .from("profile_section_order")
          .select("*")
          .eq("profile_id", userId)
          .order("display_order");

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

        if (sectionOrderData && sectionOrderData.length > 0) {
          const orderMap = new Map(sectionOrderData.map(s => [s.section_type, s]));
          allSections = allSections.map(section => {
            const saved = orderMap.get(section.type);
            return saved ? {
              ...section,
              displayOrder: saved.display_order,
              isVisible: saved.is_visible,
            } : section;
          }).sort((a, b) => a.displayOrder - b.displayOrder);
        }

        setProfileSections(allSections);
        
        setOriginalValues({
          username: loadedValues.username,
          fullName: loadedValues.fullName,
          displayName: loadedValues.displayName,
          bio: loadedValues.bio,
          avatarUrl: loadedValues.avatarUrl,
          categories: loadedValues.categories,
          themeColor: loadedValues.themeColor,
          pageBackgroundColor: loadedValues.pageBackgroundColor,
          qrCodeColor: loadedValues.qrCodeColor,
          includeLogoInQR: loadedValues.includeLogoInQR,
          heroSectionColor: loadedValues.heroSectionColor,
          socialIconsColor: loadedValues.socialIconsColor,
          showBlogOnProfile: loadedValues.showBlogOnProfile,
          showLatestBlogOnly: loadedValues.showLatestBlogOnly,
          blogName: loadedValues.blogName,
          tippingEnabled: loadedValues.tippingEnabled,
          tippingButtonText: loadedValues.tippingButtonText,
          newsletterEnabled: loadedValues.newsletterEnabled,
          newsletterHeading: loadedValues.newsletterHeading,
          newsletterDescription: loadedValues.newsletterDescription,
          socialLinks: links || [],
          customLinks: customLinksData || [],
          sectionMetadata: metadata,
          profileSections: allSections,
        });
      }
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

  useEffect(() => {
    const changed = 
      username !== originalValues.username ||
      fullName !== originalValues.fullName ||
      displayName !== originalValues.displayName ||
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
      tippingEnabled !== originalValues.tippingEnabled ||
      tippingButtonText !== originalValues.tippingButtonText ||
      newsletterEnabled !== originalValues.newsletterEnabled ||
      newsletterHeading !== originalValues.newsletterHeading ||
      newsletterDescription !== originalValues.newsletterDescription ||
      JSON.stringify(socialLinks) !== JSON.stringify(originalValues.socialLinks) ||
      JSON.stringify(customLinks) !== JSON.stringify(originalValues.customLinks) ||
      JSON.stringify(Array.from(sectionMetadata.entries())) !== JSON.stringify(Array.from(originalValues.sectionMetadata.entries())) ||
      JSON.stringify(profileSections) !== JSON.stringify(originalValues.profileSections);
      
    setHasUnsavedChanges(changed);
  }, [username, fullName, displayName, bio, avatarUrl, categories, themeColor, pageBackgroundColor, qrCodeColor, includeLogoInQR, heroSectionColor, socialIconsColor, showBlogOnProfile, showLatestBlogOnly, blogName, tippingEnabled, tippingButtonText, newsletterEnabled, newsletterHeading, newsletterDescription, socialLinks, customLinks, sectionMetadata, profileSections, originalValues]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
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

      await supabase
        .from("social_links")
        .delete()
        .eq("profile_id", user.id);

      const socialLinksToInsert = socialLinks.map((link, index) => ({
        profile_id: user.id,
        platform: link.platform,
        url: link.url,
        display_order: index,
      }));

      if (socialLinksToInsert.length > 0) {
        const { error: socialLinksError } = await supabase
          .from("social_links")
          .insert(socialLinksToInsert);

        if (socialLinksError) throw socialLinksError;
      }

      await supabase
        .from("custom_links")
        .delete()
        .eq("profile_id", user.id);

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

      celebrate();

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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addCustomLink = () => {
    const newLink: CustomLink = {
      id: Math.random().toString(36).substring(7),
      title: "",
      url: "",
      description: "",
      image_url: "",
      display_order: customLinks.length,
      is_active: true,
      section: null,
    };
    setCustomLinks([...customLinks, newLink]);
  };

  const updateCustomLink = (id: string, field: keyof CustomLink, value: string | boolean) => {
    setCustomLinks(
      customLinks.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      )
    );
  };

  const removeCustomLink = (id: string) => {
    setCustomLinks(customLinks.filter((link) => link.id !== id));
  };

  const addSection = async () => {
    if (!newSectionName.trim()) {
      toast({
        title: "Section name required",
        description: "Please enter a name for your section",
        variant: "destructive",
      });
      return;
    }

    const newMetadata: SectionMetadata = {
      name: newSectionName.trim(),
      image_url: newSectionImage || null,
      display_order: sectionMetadata.size,
    };

    const updatedMetadata = new Map(sectionMetadata);
    updatedMetadata.set(newSectionName.trim(), newMetadata);
    setSectionMetadata(updatedMetadata);

    const newSection: ProfileSection = {
      id: `custom_section:${newSectionName.trim()}`,
      type: `custom_section:${newSectionName.trim()}`,
      label: newSectionName.trim(),
      isVisible: true,
      displayOrder: profileSections.length,
    };
    setProfileSections([...profileSections, newSection]);

    setShowSectionDialog(false);
    setNewSectionName("");
    setNewSectionImage("");

    celebrate();

    toast({
      title: "Section created",
      description: "Your new section has been added",
    });
  };

  const startEditSection = (sectionName: string) => {
    const section = sectionMetadata.get(sectionName);
    if (section) {
      setEditingSection(sectionName);
      setEditSectionName(sectionName);
      setEditSectionImage(section.image_url || "");
    }
  };

  const saveEditSection = async () => {
    if (!editingSection || !editSectionName.trim()) return;

    const updatedMetadata = new Map(sectionMetadata);
    const oldSection = updatedMetadata.get(editingSection);
    if (oldSection) {
      updatedMetadata.delete(editingSection);
      updatedMetadata.set(editSectionName.trim(), {
        ...oldSection,
        name: editSectionName.trim(),
        image_url: editSectionImage || null,
      });
      setSectionMetadata(updatedMetadata);

      const updatedSections = profileSections.map(section => {
        if (section.type === `custom_section:${editingSection}`) {
          return {
            ...section,
            id: `custom_section:${editSectionName.trim()}`,
            type: `custom_section:${editSectionName.trim()}`,
            label: editSectionName.trim(),
          };
        }
        return section;
      });
      setProfileSections(updatedSections);

      const updatedLinks = customLinks.map(link => {
        if (link.section === editingSection) {
          return { ...link, section: editSectionName.trim() };
        }
        return link;
      });
      setCustomLinks(updatedLinks);
    }

    setEditingSection(null);
    setEditSectionName("");
    setEditSectionImage("");

    celebrate();

    toast({
      title: "Section updated",
      description: "Your section has been updated",
    });
  };

  const confirmDeleteSection = (sectionName: string) => {
    setDeletingSection(sectionName);
  };

  const deleteSection = async () => {
    if (!deletingSection) return;

    const updatedMetadata = new Map(sectionMetadata);
    updatedMetadata.delete(deletingSection);
    setSectionMetadata(updatedMetadata);

    const updatedSections = profileSections.filter(
      section => section.type !== `custom_section:${deletingSection}`
    );
    setProfileSections(updatedSections);

    const updatedLinks = customLinks.filter(link => link.section !== deletingSection);
    setCustomLinks(updatedLinks);

    setDeletingSection(null);

    toast({
      title: "Section deleted",
      description: "The section and its links have been removed",
    });
  };

  const toggleSectionCollapse = (sectionName: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionName)) {
      newCollapsed.delete(sectionName);
    } else {
      newCollapsed.add(sectionName);
    }
    setCollapsedSections(newCollapsed);
    localStorage.setItem('collapsedSections', JSON.stringify(Array.from(newCollapsed)));
  };

  const getDevicePreviewSize = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
        return 'w-full';
      default:
        return 'w-[375px]';
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
      <main className="container mx-auto px-4 py-8 max-w-[1800px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Edit My Page</h1>
            <p className="text-muted-foreground mt-1">
              Customize your public profile
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Unsaved changes
                </span>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="streaming">Streaming</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
            {/* Left Column - Settings */}
            <div className="space-y-6">
              <TabsContent value="profile" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Your profile details and content categories</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="How your name appears on your profile"
                      />
                      <p className="text-xs text-muted-foreground">
                        This is shown at the top of your My Page
                      </p>
                      
                      <div className="mt-4">
                        <Label className="text-sm mb-2 block">Title Font Style</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={titleFont === 'serif' ? 'default' : 'outline'}
                            onClick={() => {
                              setTitleFont('serif');
                              celebrate();
                            }}
                          >
                            Serif
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={titleFont === 'sans' ? 'default' : 'outline'}
                            onClick={() => {
                              setTitleFont('sans');
                              celebrate();
                            }}
                          >
                            Sans
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={titleFont === 'script' ? 'default' : 'outline'}
                            onClick={() => {
                              setTitleFont('script');
                              celebrate();
                            }}
                          >
                            Script
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="yourusername"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your profile will be at: seeksy.io/{username}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Description</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell people about yourself..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Content Categories</Label>
                      <p className="text-xs text-muted-foreground">
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
                                  celebrate();
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
                      <Label>Profile Image</Label>
                      <div className="mt-2">
                        <Label className="text-sm mb-2 block">Image Style</Label>
                        <div className="flex gap-2 mb-4">
                          <Button
                            type="button"
                            size="sm"
                            variant={imageStyle === 'circular' ? 'default' : 'outline'}
                            onClick={() => {
                              setImageStyle('circular');
                              celebrate();
                            }}
                          >
                            Circular
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={imageStyle === 'rounded-square' ? 'default' : 'outline'}
                            onClick={() => {
                              setImageStyle('rounded-square');
                              celebrate();
                            }}
                          >
                            Rounded Square
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={imageStyle === 'portrait' ? 'default' : 'outline'}
                            onClick={() => {
                              setImageStyle('portrait');
                              celebrate();
                            }}
                          >
                            Portrait
                          </Button>
                        </div>
                      </div>
                      <ImageUpload
                        label=""
                        currentImage={avatarUrl}
                        onImageUploaded={(url) => {
                          setAvatarUrl(url);
                          celebrate();
                        }}
                        bucket="avatars"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Custom Links</CardTitle>
                        <CardDescription>Add custom buttons to your profile</CardDescription>
                      </div>
                      <Button onClick={addCustomLink} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={customLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                          {customLinks.map((link) => (
                            <SortableCustomLink
                              key={link.id}
                              link={link}
                              onUpdate={(field, value) => updateCustomLink(link.id, field, value)}
                              onRemove={() => removeCustomLink(link.id)}
                            />
                          ))}
                          {customLinks.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No custom links yet. Click "Add Link" to create one.</p>
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Colors & QR Code</CardTitle>
                    <CardDescription>Customize your page colors and QR code style</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Page Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={pageBackgroundColor}
                          onChange={(e) => setPageBackgroundColor(e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={pageBackgroundColor}
                          onChange={(e) => setPageBackgroundColor(e.target.value)}
                          placeholder="#1a1a1a"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Theme Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          placeholder="#FF6B6B"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                      <Label className="text-lg">QR Code Settings</Label>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">QR Code Shape</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={qrCodeShape === 'square' ? 'default' : 'outline'}
                            onClick={() => {
                              setQrCodeShape('square');
                              celebrate();
                            }}
                          >
                            Square
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={qrCodeShape === 'round' ? 'default' : 'outline'}
                            onClick={() => {
                              setQrCodeShape('round');
                              celebrate();
                            }}
                          >
                            Round
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">QR Code Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={qrCodeColor}
                            onChange={(e) => setQrCodeColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={qrCodeColor}
                            onChange={(e) => setQrCodeColor(e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Include Logo in QR Code</Label>
                          <p className="text-xs text-muted-foreground">Add your profile image to the center</p>
                        </div>
                        <Switch
                          checked={includeLogoInQR}
                          onCheckedChange={(checked) => {
                            setIncludeLogoInQR(checked);
                            if (checked) celebrate();
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="streaming" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle>Live Streaming Features</CardTitle>
                    </div>
                    <CardDescription>Enable live streaming and configure tipping options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-base">Enable Streaming</Label>
                        <p className="text-sm text-muted-foreground">Show streaming features on your page</p>
                      </div>
                      <Switch
                        checked={streamingEnabled}
                        onCheckedChange={(checked) => {
                          setStreamingEnabled(checked);
                          if (checked) celebrate();
                        }}
                      />
                    </div>

                    {streamingEnabled && (
                      <div className="space-y-6 animate-in slide-in-from-top">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Allow Tipping</Label>
                            <p className="text-sm text-muted-foreground">Let viewers send you tips during streams</p>
                          </div>
                          <Switch
                            checked={tippingEnabled}
                            onCheckedChange={setTippingEnabled}
                          />
                        </div>

                        {tippingEnabled && (
                          <>
                            <div className="space-y-2">
                              <Label>Tipping Button Text</Label>
                              <Input
                                value={tippingButtonText}
                                onChange={(e) => setTippingButtonText(e.target.value)}
                                placeholder="Send a Tip"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Show Tipping Goal</Label>
                                <p className="text-sm text-muted-foreground">Display a progress bar for your goal</p>
                              </div>
                              <Switch
                                checked={tippingGoalEnabled}
                                onCheckedChange={setTippingGoalEnabled}
                              />
                            </div>

                            {tippingGoalEnabled && (
                              <div className="space-y-2">
                                <Label>Goal Amount ($)</Label>
                                <Input
                                  type="number"
                                  value={tippingGoalAmount}
                                  onChange={(e) => setTippingGoalAmount(e.target.value)}
                                  placeholder="100"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>Profile sections and additional features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ProfileSectionOrdering
                      sections={profileSections}
                      onSectionsChange={setProfileSections}
                    />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Newsletter Signup</Label>
                        <p className="text-sm text-muted-foreground">Allow visitors to subscribe to your newsletter</p>
                      </div>
                      <Switch
                        checked={newsletterEnabled}
                        onCheckedChange={(checked) => {
                          setNewsletterEnabled(checked);
                          if (checked) celebrate();
                        }}
                      />
                    </div>

                    {newsletterEnabled && (
                      <div className="space-y-4 pl-4 border-l-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Newsletter Heading</Label>
                          <Input
                            value={newsletterHeading}
                            onChange={(e) => setNewsletterHeading(e.target.value)}
                            placeholder="Stay Updated"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            value={newsletterDescription}
                            onChange={(e) => setNewsletterDescription(e.target.value)}
                            placeholder="Subscribe to get the latest updates..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Right Column - Live Preview */}
            <div className="lg:sticky lg:top-8 h-fit">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Live Preview</CardTitle>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                        onClick={() => setPreviewDevice('mobile')}
                        className="h-7 px-2"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                        onClick={() => setPreviewDevice('tablet')}
                        className="h-7 px-2"
                      >
                        <Tablet className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                        onClick={() => setPreviewDevice('desktop')}
                        className="h-7 px-2"
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex justify-center">
                    <div 
                      className={cn(
                        "bg-background border rounded-lg overflow-hidden transition-all shadow-lg",
                        getDevicePreviewSize()
                      )}
                      style={{
                        backgroundColor: pageBackgroundColor,
                        minHeight: previewDevice === 'mobile' ? '667px' : '500px',
                        maxHeight: '800px',
                      }}
                    >
                      <div className="p-6 space-y-4">
                        {/* Profile Image Preview */}
                        {avatarUrl && (
                          <div className="flex justify-center">
                            <div
                              className={cn(
                                "overflow-hidden",
                                imageStyle === 'circular' && "rounded-full w-24 h-24",
                                imageStyle === 'rounded-square' && "rounded-xl w-24 h-24",
                                imageStyle === 'portrait' && "rounded-lg w-32 h-40"
                              )}
                            >
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Name Preview */}
                        <div className="text-center">
                          <h2
                            className={cn(
                              "text-2xl font-bold",
                              titleFont === 'serif' && "font-serif",
                              titleFont === 'sans' && "font-sans",
                              titleFont === 'script' && "font-script"
                            )}
                            style={{ color: themeColor }}
                          >
                            {displayName || "Your Name"}
                          </h2>
                          {bio && (
                            <p className="text-sm text-muted-foreground mt-2">{bio}</p>
                          )}
                        </div>

                        {/* Sample Link */}
                        <div
                          className="p-3 bg-white/10 rounded-lg text-center text-sm border"
                          style={{ borderColor: themeColor + '40' }}
                        >
                          Sample Link
                        </div>

                        {/* QR Code Preview */}
                        <div className="flex justify-center">
                          <ProfileQRCode
                            username={username || "preview"}
                            themeColor={qrCodeColor}
                            logoUrl={includeLogoInQR ? avatarUrl : undefined}
                            shape={qrCodeShape}
                          />
                        </div>

                        {/* Streaming Indicator */}
                        {streamingEnabled && (
                          <div className="flex items-center justify-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              LIVE STREAMING ENABLED
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(previewDevice === 'tablet' || previewDevice === 'desktop') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFullPreview(true)}
                      className="mt-4 w-full"
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>

        {/* Full Preview Dialog */}
        <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Full Preview - {previewDevice === 'tablet' ? 'Tablet' : 'Desktop'} View</DialogTitle>
              <DialogDescription>
                See how your page looks on larger screens
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-auto">
              <div
                className="w-full rounded-lg border"
                style={{
                  backgroundColor: pageBackgroundColor,
                  minHeight: '600px',
                }}
              >
                <div className="p-12 space-y-6 max-w-4xl mx-auto">
                  {avatarUrl && (
                    <div className="flex justify-center">
                      <div
                        className={cn(
                          "overflow-hidden",
                          imageStyle === 'circular' && "rounded-full w-32 h-32",
                          imageStyle === 'rounded-square' && "rounded-xl w-32 h-32",
                          imageStyle === 'portrait' && "rounded-lg w-40 h-48"
                        )}
                      >
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <h2
                      className={cn(
                        "text-4xl font-bold",
                        titleFont === 'serif' && "font-serif",
                        titleFont === 'sans' && "font-sans",
                        titleFont === 'script' && "font-script"
                      )}
                      style={{ color: themeColor }}
                    >
                      {displayName || "Your Name"}
                    </h2>
                    {bio && (
                      <p className="text-base text-muted-foreground mt-3 max-w-2xl mx-auto">{bio}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div
                      className="p-4 bg-white/10 rounded-lg text-center border"
                      style={{ borderColor: themeColor + '40' }}
                    >
                      Sample Link 1
                    </div>
                    <div
                      className="p-4 bg-white/10 rounded-lg text-center border"
                      style={{ borderColor: themeColor + '40' }}
                    >
                      Sample Link 2
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ProfileQRCode
                      username={username || "preview"}
                      themeColor={qrCodeColor}
                      logoUrl={includeLogoInQR ? avatarUrl : undefined}
                      shape={qrCodeShape}
                    />
                  </div>

                  {streamingEnabled && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-w-md mx-auto">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        LIVE STREAMING ENABLED
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Section Management Dialogs */}
        <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>
                Add a custom section to organize your links
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-name">Section Name</Label>
                <Input
                  id="section-name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g., My Products"
                />
              </div>
              <div className="space-y-2">
                <Label>Section Image (Optional)</Label>
                <ImageUpload
                  label=""
                  currentImage={newSectionImage}
                  onImageUploaded={setNewSectionImage}
                  bucket="event-images"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addSection}>Create Section</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update your section details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section-name">Section Name</Label>
                <Input
                  id="edit-section-name"
                  value={editSectionName}
                  onChange={(e) => setEditSectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Section Image</Label>
                <ImageUpload
                  label=""
                  currentImage={editSectionImage}
                  onImageUploaded={setEditSectionImage}
                  bucket="event-images"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditSection}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingSection} onOpenChange={(open) => !open && setDeletingSection(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Section</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingSection}"? This will also remove all links in this section. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default ProfileEdit;
