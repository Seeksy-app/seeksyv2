import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useMyPageVideo } from "@/hooks/useMyPageVideo";
import { Card } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Settings, Clock, MapPin, Link2, Users, LayoutGrid, ChevronDown, Vote, Radio, FileText, Eye, Phone, MessageSquare } from "lucide-react";
import heroVirtualStudio from "@/assets/hero-virtual-studio.jpg";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import ShareProfileButton from "@/components/ShareProfileButton";
import { TipButton } from "@/components/TipButton";
import { NewsletterSubscribeWidget } from "@/components/NewsletterSubscribeWidget";
import {
  SiX,
  SiLinkedin,
  SiFacebook,
  SiInstagram,
  SiGithub,
  SiYoutube,
  SiTiktok,
  SiDiscord,
} from "react-icons/si";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  display_name?: string | null;
  bio: string;
  avatar_url: string;
  theme_color: string;
  social_icons_color: boolean | null;
  legal_on_profile: boolean | null;
  show_blog_on_profile: boolean | null;
  show_latest_blog_only: boolean | null;
  is_live_on_profile: boolean | null;
  live_stream_title: string | null;
  live_video_url: string | null;
  my_page_video_type: 'own' | 'ad' | null;
  my_page_video_id: string | null;
  my_page_ad_id: string | null;
  my_page_video_loop: boolean | null;
  tipping_enabled: boolean | null;
  tipping_button_text: string | null;
  my_page_cta_button_text: string | null;
  my_page_cta_phone_number: string | null;
  my_page_cta_text_keyword: string | null;
  newsletter_enabled: boolean | null;
  newsletter_heading: string | null;
  newsletter_description: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url?: string;
}

interface MeetingType {
  id: string;
  name: string;
  description: string;
  duration: number;
  location_type: string;
}

interface SignupSheet {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  image_url: string | null;
  section: string | null;
}

interface SectionMetadata {
  name: string;
  image_url: string | null;
}

interface ProfileSectionOrder {
  section_type: string;
  display_order: number;
  is_visible: boolean;
}

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface Episode {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  publish_date: string;
  duration_seconds: number | null;
  podcast_id: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  is_ai_generated?: boolean;
  views_count?: number;
}

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [signupSheets, setSignupSheets] = useState<SignupSheet[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [sectionMetadata, setSectionMetadata] = useState<Map<string, SectionMetadata>>(new Map());
  const [sectionOrder, setSectionOrder] = useState<ProfileSectionOrder[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [currentLiveViewers, setCurrentLiveViewers] = useState(0);
  const viewerSessionRef = useRef<string | null>(null);
  const { videoUrl: myPageVideoUrl, trackImpression, shouldLoop } = useMyPageVideo(profile);

  const isOwnProfile = profile?.id === currentUser?.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    loadProfile();
  }, [username]);

  // Track live stream viewers
  useEffect(() => {
    if (profile?.is_live_on_profile) {
      trackLiveViewer();
      subscribeToViewerCount();
    }
    
    return () => {
      if (viewerSessionRef.current && profile) {
        // Mark viewer as inactive when leaving
        supabase
          .from('live_stream_viewers')
          .update({ is_active: false })
          .eq('session_id', viewerSessionRef.current)
          .eq('profile_id', profile.id);
      }
    };
  }, [profile?.is_live_on_profile, profile?.id]);

  const trackLiveViewer = async () => {
    if (!profile) return;
    
    const sessionId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    viewerSessionRef.current = sessionId;

    // Add viewer to active viewers
    await supabase
      .from('live_stream_viewers')
      .insert({
        profile_id: profile.id,
        session_id: sessionId,
        is_active: true
      });

    // Update last_seen periodically (every 30 seconds)
    const heartbeatInterval = setInterval(async () => {
      await supabase
        .from('live_stream_viewers')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('profile_id', profile.id);
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  };

  const subscribeToViewerCount = async () => {
    if (!profile) return;

    // Subscribe to viewer count changes
    const channel = supabase
      .channel(`live-viewers-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stream_viewers',
          filter: `profile_id=eq.${profile.id}`
        },
        async () => {
          // Fetch updated count of active viewers
          const { count } = await supabase
            .from('live_stream_viewers')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .eq('is_active', true)
            .gte('last_seen_at', new Date(Date.now() - 60000).toISOString()); // Active in last minute
          
          setCurrentLiveViewers(count || 0);
        }
      )
      .subscribe();

    // Get initial count
    const { count } = await supabase
      .from('live_stream_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .gte('last_seen_at', new Date(Date.now() - 60000).toISOString());
    
    setCurrentLiveViewers(count || 0);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Update SEO meta tags when profile loads
  useEffect(() => {
    if (profile) {
      document.title = `${profile.full_name} (@${profile.username}) - Seeksy`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', profile.bio || `Connect with ${profile.full_name} on Seeksy`);
      }

      // Update OG tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `${profile.full_name} (@${profile.username})`);

      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', profile.bio || `Connect with ${profile.full_name} on Seeksy`);

      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', profile.avatar_url);

      // Update Twitter tags
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', profile.avatar_url);
    }

    return () => {
      // Reset to default on unmount
      document.title = 'Seeksy - Connect, Schedule & Engage';
    };
  }, [profile]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username || "")
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setLoading(false);
        return;
      }
      
      setProfile({
        ...profileData,
        my_page_video_type: profileData.my_page_video_type as 'own' | 'ad' | null,
      } as Profile);

      // Track profile view (only if not own profile)
      if (!isOwnProfile) {
        await supabase.from("profile_views").insert({
          profile_id: profileData.id,
        });
      }

      // Load events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("is_published", true)
        .eq("show_on_profile", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      setEvents(eventsData || []);

      // Load meeting types
      const { data: meetingTypesData } = await supabase
        .from("meeting_types")
        .select("id, name, description, duration, location_type")
        .eq("user_id", profileData.id)
        .eq("is_active", true);

      setMeetingTypes(meetingTypesData || []);

      // Load signup sheets
      const { data: signupSheetsData } = await supabase
        .from("signup_sheets")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("is_published", true)
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true});

      setSignupSheets(signupSheetsData || []);

      // Load polls
      const { data: pollsData } = await supabase
        .from("polls")
        .select("id, title, description, deadline")
        .eq("user_id", profileData.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      setPolls(pollsData || []);

      // Load social links
      const { data: linksData } = await supabase
        .from("social_links")
        .select("*")
        .eq("profile_id", profileData.id)
        .order("display_order");

      setSocialLinks(linksData || []);

      // Load custom links
      const { data: customLinksData } = await supabase
        .from("custom_links")
        .select("*")
        .eq("profile_id", profileData.id)
        .eq("is_active", true)
        .order("display_order");

      setCustomLinks(customLinksData || []);

      // Load section metadata
      const { data: sectionsData } = await supabase
        .from("custom_link_sections")
        .select("*")
        .eq("profile_id", profileData.id);

      if (sectionsData) {
        const metadataMap = new Map<string, SectionMetadata>();
        sectionsData.forEach(section => {
          metadataMap.set(section.name, {
            name: section.name,
            image_url: section.image_url
          });
        });
        setSectionMetadata(metadataMap);
      }

      // Load section ordering
      const { data: orderData } = await supabase
        .from("profile_section_order")
        .select("*")
        .eq("profile_id", profileData.id)
        .order("display_order");

      setSectionOrder(orderData || []);

      // Load podcasts
      const { data: podcastsData } = await supabase
        .from("podcasts")
        .select("id, title, description, cover_image_url")
        .eq("user_id", profileData.id)
        .eq("is_published", true)
        .eq("show_on_profile", true);

      setPodcasts(podcastsData || []);

      // Load published episodes for all podcasts
      if (podcastsData && podcastsData.length > 0) {
        const { data: episodesData } = await supabase
          .from("episodes")
          .select("*")
          .in("podcast_id", podcastsData.map(p => p.id))
          .eq("is_published", true)
          .order("publish_date", { ascending: false });

        setEpisodes(episodesData || []);
      }

      // Load blog posts
      const { data: blogPostsData } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, published_at, is_ai_generated, views_count")
        .eq("user_id", profileData.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);

      setBlogPosts(blogPostsData || []);

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string, isColored: boolean) => {
    const lowerPlatform = platform.toLowerCase();
    const baseClass = "h-7 w-7";
    // Use white text on dark backgrounds for better contrast
    const colorClass = isColored ? "" : "text-white dark:text-foreground";
    const iconClass = `${baseClass} ${colorClass}`;
    
    if (lowerPlatform.includes("twitter") || lowerPlatform.includes("x")) {
      return <SiX className={iconClass} style={isColored ? { color: '#FFFFFF' } : undefined} />;
    } else if (lowerPlatform.includes("linkedin")) {
      return <SiLinkedin className={iconClass} style={isColored ? { color: '#0A66C2' } : undefined} />;
    } else if (lowerPlatform.includes("facebook")) {
      return <SiFacebook className={iconClass} style={isColored ? { color: '#1877F2' } : undefined} />;
    } else if (lowerPlatform.includes("instagram")) {
      return <SiInstagram className={iconClass} style={isColored ? { color: '#E4405F' } : undefined} />;
    } else if (lowerPlatform.includes("github")) {
      return <SiGithub className={iconClass} style={isColored ? { color: '#FFFFFF' } : undefined} />;
    } else if (lowerPlatform.includes("youtube")) {
      return <SiYoutube className={iconClass} style={isColored ? { color: '#FF0000' } : undefined} />;
    } else if (lowerPlatform.includes("tiktok")) {
      return <SiTiktok className={iconClass} style={isColored ? { color: '#000000' } : undefined} />;
    } else if (lowerPlatform.includes("discord")) {
      return <SiDiscord className={iconClass} style={isColored ? { color: '#5865F2' } : undefined} />;
    }
    return null;
  };

  const getLocationLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone: "Phone Call",
      zoom: "Zoom",
      teams: "Microsoft Teams",
      meet: "Google Meet",
      "in-person": "In Person",
      custom: "Custom Location",
    };
    return labels[type] || type;
  };

  const trackLinkClick = async (url: string, type: string) => {
    if (!profile || isOwnProfile) return;
    
    await supabase.from("link_clicks").insert({
      profile_id: profile.id,
      link_url: url,
      link_type: type,
    });
  };

  const trackTabView = async (tabName: string) => {
    if (!profile || isOwnProfile) return;

    await supabase.from("tab_views").insert({
      profile_id: profile.id,
      tab_name: tabName,
    });
  };

  // Helper to get element visibility from page builder
  const getElementVisibility = (elementType: string) => {
    const element = layoutElements.find(el => el.element_type === elementType);
    return element ? element.is_visible : false;
  };
  
  // Get sorted visible elements
  const sortedElements = [...layoutElements].sort((a, b) => a.position_order - b.position_order);

  // Helper to get section display order
  const getSectionOrder = (sectionType: string) => {
    const sectionConfig = sectionOrder.find(s => s.section_type === sectionType);
    return sectionConfig ? sectionConfig.display_order : 999; // Default to end if not configured
  };

  // Helper to render sections in order
  const renderSectionsInOrder = () => {
    type SectionConfig = {
      type: string;
      render: () => JSX.Element | null;
    };

    const sectionConfigs: SectionConfig[] = [
      {
        type: 'events',
        render: () => events.length > 0 && getSectionVisibility('events') ? (
          <div className="space-y-4 mb-8" key="events">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold">Upcoming Events</h2>
            </div>
            {events.slice(0, 3).map((event) => (
              <InteractiveCard
                key={event.id}
                className="p-5 hover:shadow-lg transition-all"
                style={{ 
                  borderTop: `3px solid ${profile?.theme_color}`,
                }}
                onInteract={() => {
                  trackLinkClick(`/event/${event.id}`, 'event');
                  navigate(`/event/${event.id}`);
                }}
              >
                <div className="flex gap-4">
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-28 h-28 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        ) : null,
      },
      {
        type: 'meetings',
        render: () => meetingTypes.length > 0 && getSectionVisibility('meetings') ? (
          <div className="space-y-4 mb-8" key="meetings">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold">Book a Meeting</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {meetingTypes.map((meeting) => (
                <InteractiveCard
                  key={meeting.id}
                  className="p-5 hover:shadow-lg transition-all"
                  style={{ 
                    borderTop: `3px solid ${profile?.theme_color}`,
                  }}
                  onInteract={() => {
                    trackLinkClick(`/book/${username}/${meeting.id}`, 'meeting');
                    navigate(`/book/${username}/${meeting.id}`);
                  }}
                >
                  <h3 className="font-semibold mb-2">{meeting.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {meeting.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{meeting.duration} min</span>
                    <span>•</span>
                    <span>{getLocationLabel(meeting.location_type)}</span>
                  </div>
                </InteractiveCard>
              ))}
            </div>
          </div>
        ) : null,
      },
      {
        type: 'signup_sheets',
        render: () => signupSheets.length > 0 && getSectionVisibility('signup_sheets') ? (
          <div className="space-y-4 mb-8" key="signup_sheets">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold">Sign Up Opportunities</h2>
            </div>
            {signupSheets.slice(0, 2).map((sheet) => (
              <InteractiveCard
                key={sheet.id}
                className="p-5 hover:shadow-lg transition-all"
                style={{ 
                  borderTop: `3px solid ${profile?.theme_color}`,
                }}
                onInteract={() => {
                  trackLinkClick(`/signup-sheet/${sheet.id}`, 'signup');
                  navigate(`/signup-sheet/${sheet.id}`);
                }}
              >
                <h3 className="text-lg font-semibold mb-2">{sheet.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {sheet.description}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(sheet.start_date).toLocaleDateString()} - {new Date(sheet.end_date).toLocaleDateString()}
                  </span>
                  {sheet.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {sheet.location}
                    </span>
                  )}
                </div>
              </InteractiveCard>
            ))}
          </div>
        ) : null,
      },
      {
        type: 'polls',
        render: () => polls.length > 0 && getSectionVisibility('polls') ? (
          <div className="space-y-4 mb-8" key="polls">
            <div className="flex items-center gap-2 mb-4">
              <Vote className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold">Polls</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {polls.map((poll) => (
                <InteractiveCard
                  key={poll.id}
                  className="p-5 hover:shadow-lg transition-all"
                  style={{ 
                    borderTop: `3px solid ${profile?.theme_color}`,
                  }}
                  onInteract={() => {
                    trackLinkClick(`/poll/${poll.id}`, 'poll');
                    navigate(`/poll/${poll.id}`);
                  }}
                >
                  <h3 className="text-lg font-semibold mb-2">{poll.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {poll.description}
                  </p>
                  {poll.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Closes: {new Date(poll.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </InteractiveCard>
              ))}
            </div>
          </div>
        ) : null,
      },
      {
        type: 'podcasts',
        render: () => podcasts.length > 0 && getSectionVisibility('podcasts') ? (
          <div className="space-y-4 mb-8" key="podcasts">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-5 w-5" style={{ color: profile?.theme_color }} />
              <h2 className="text-xl font-bold">Podcasts</h2>
            </div>
            {podcasts.map((podcast) => {
              const podcastEpisodes = episodes.filter(ep => ep.podcast_id === podcast.id);
              if (podcastEpisodes.length === 0) return null;
              
              return (
                <div key={podcast.id} className="space-y-3">
                  <h3 className="text-lg font-semibold">{podcast.title}</h3>
                  {podcast.description && (
                    <p className="text-sm text-muted-foreground">{podcast.description}</p>
                  )}
                  <PodcastPlayer podcast={podcast} episodes={podcastEpisodes} creatorId={profile?.id || ''} />
                </div>
              );
            })}
          </div>
        ) : null,
      },
      {
        type: 'blog',
        render: () => {
          const showBlog = profile?.show_blog_on_profile !== false && blogPosts.length > 0 && getSectionVisibility('blog');
          if (!showBlog) return null;
          
          const postsToShow = profile?.show_latest_blog_only ? blogPosts.slice(0, 1) : blogPosts;
          
          return (
            <div className="space-y-4 mb-8" key="blog">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" style={{ color: profile?.theme_color }} />
                <h2 className="text-xl font-bold">Blog</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {postsToShow.map((post) => (
                <InteractiveCard
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-all"
                  style={{ 
                    borderTop: `3px solid ${profile?.theme_color}`,
                  }}
                  onInteract={() => {
                    trackLinkClick(`/blog/${post.slug}`, 'blog');
                    window.open(`/blog/${post.slug}`, '_blank');
                  }}
                >
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    {post.published_at && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.published_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </InteractiveCard>
                ))}
              </div>
            </div>
          );
        },
      },
    ];

    // Add custom link sections
    const customSectionNames = Array.from(new Set(customLinks.map(link => link.section).filter(Boolean)));
    customSectionNames.forEach(sectionName => {
      const sectionType = `custom_section:${sectionName}`;
      if (!getSectionVisibility(sectionType)) return;

      sectionConfigs.push({
        type: sectionType,
        render: () => {
          const sectionLinks = customLinks.filter(link => link.section === sectionName).slice(0, 4);
          const isOpen = openSections.has(sectionName || "no-section");
          
          return (
            <Collapsible
              key={sectionType}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenSections(prev => {
                  const newSet = new Set(prev);
                  if (open) {
                    newSet.add(sectionName || "no-section");
                  } else {
                    newSet.delete(sectionName || "no-section");
                  }
                  return newSet;
                });
              }}
              className="space-y-3 mb-8"
            >
              <CollapsibleTrigger className="w-full group">
                <Card 
                  className="p-5 transition-all duration-300 hover:shadow-xl border-2 cursor-pointer"
                  style={{ 
                    borderColor: isOpen ? profile?.theme_color : 'transparent',
                    background: 'hsl(var(--card))'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {sectionMetadata.get(sectionName!)?.image_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-110">
                          <img 
                            src={sectionMetadata.get(sectionName!)?.image_url || ''} 
                            alt={sectionName!}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            background: `linear-gradient(135deg, ${profile?.theme_color}20, ${profile?.theme_color}10)`
                          }}
                        >
                          <Link2 
                            className="h-6 w-6"
                            style={{ color: profile?.theme_color }}
                          />
                        </div>
                      )}
                      <div className="text-left">
                        <h2 className="text-xl font-bold">{sectionName}</h2>
                        <p className="text-sm text-muted-foreground">{sectionLinks.length} items</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`}
                      style={{ color: profile?.theme_color }}
                    />
                  </div>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {sectionLinks.map((link) => (
                    <InteractiveCard
                      key={link.id}
                      className="p-5 hover:shadow-lg transition-all duration-200"
                      onInteract={() => {
                        trackLinkClick(link.url, 'custom_link');
                        window.open(link.url, '_blank');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {link.image_url && (
                          <img
                            src={link.image_url}
                            alt={link.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 break-words">{link.title}</h3>
                          {link.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </InteractiveCard>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        },
      });
    });

    // Sort sections by display order
    const sortedSections = sectionConfigs
      .map(config => ({
        ...config,
        order: getSectionOrder(config.type),
      }))
      .sort((a, b) => a.order - b.order)
      .map(config => config.render())
      .filter(Boolean);

    return sortedSections;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackTabView(value);
  };

  const totalItems = events.length + meetingTypes.length + signupSheets.length + polls.length + customLinks.length + podcasts.length + blogPosts.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">This user doesn't exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-x-hidden w-full"
      style={{ 
        backgroundColor: (profile as any).page_background_color || '#000000'
      }}
    >
      <main className="w-full mx-auto max-w-4xl overflow-x-hidden">
        {/* Hero Section - Responsive Design */}
        <div className="relative w-full overflow-hidden mb-6 animate-fade-in">
          {/* Large Profile Image - Full width on mobile, contained on desktop */}
          <div className="relative w-full md:h-auto" style={{ backgroundColor: (profile as any).hero_section_color || '#000000' }}>
            {profile.avatar_url ? (
              <div className="relative md:flex md:justify-center md:py-12">
                {/* Mobile: Full-width with fade */}
                <div className="relative md:hidden w-full h-[60vh]">
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"
                    style={{ 
                      background: `linear-gradient(to bottom, transparent 0%, transparent 40%, ${(profile as any).hero_section_color || '#000000'}dd 100%)`
                    }}
                  />
                </div>
                
                {/* Desktop: Contained square with visible background */}
                <div className="hidden md:block relative md:max-w-md md:mx-auto">
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name}
                    className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
                  />
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-[60vh] md:h-96 flex items-center justify-center text-6xl md:text-8xl font-bold text-white"
                style={{ color: profile.theme_color }}
              >
                {profile.full_name?.charAt(0) || profile.username?.charAt(0)}
              </div>
            )}
            
            {/* Content Overlay - Mobile */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 p-6 text-center">
              {/* Action Buttons - Mobile */}
              <div className="flex justify-end gap-2 mb-4 absolute top-4 right-4">
                {isOwnProfile && (
                  <Link to="/profile/edit">
                    <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white text-black border-white/20 backdrop-blur-sm">
                      <Settings className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                )}
                <ShareProfileButton username={profile.username} />
              </div>

              <h1 className="text-3xl font-bold mb-2 text-black drop-shadow-lg">
                {profile.display_name || profile.full_name || profile.username}
              </h1>
              
              {/* Social Links - Mobile */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-4">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackLinkClick(link.url, 'social')}
                      className="p-2.5 rounded-full hover:scale-110 transition-all bg-white/20 backdrop-blur-sm border border-white/30"
                      style={profile.social_icons_color !== true ? { 
                        filter: 'grayscale(100%)',
                      } : undefined}
                      title={link.platform}
                    >
                      {getSocialIcon(link.platform, profile.social_icons_color === true)}
                    </a>
                  ))}
                </div>
              )}

              {profile.bio && (
                <p className="text-base text-black max-w-2xl mx-auto leading-relaxed drop-shadow px-4 break-words">
                  {profile.bio}
                </p>
              )}
            </div>
            
            {/* Content - Desktop (Below Image) */}
            <div className="hidden md:block text-center px-8 pb-8">
              {/* Action Buttons - Desktop */}
              <div className="flex justify-center gap-2 mb-6">
                {isOwnProfile && (
                  <Link to="/profile/edit">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                )}
                <ShareProfileButton username={profile.username} />
              </div>

              <h1 className="text-4xl font-bold mb-4 text-black">
                {profile.display_name || profile.full_name || profile.username}
              </h1>
              
              {/* Social Links - Desktop */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackLinkClick(link.url, 'social')}
                      className="p-3 rounded-full hover:scale-110 transition-all border-2"
                      style={{ 
                        borderColor: profile.theme_color,
                        ...(profile.social_icons_color !== true ? { filter: 'grayscale(100%)' } : {})
                      }}
                      title={link.platform}
                    >
                      {getSocialIcon(link.platform, profile.social_icons_color === true)}
                    </a>
                  ))}
                </div>
              )}

              {profile.bio && (
                <p className="text-lg max-w-2xl mx-auto leading-relaxed break-words text-black">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Video Section - Before Live Stream */}
        <div className="px-4">
        {myPageVideoUrl && !profile?.is_live_on_profile && (
          <Card className="mb-6 overflow-hidden">
            <div className="aspect-video bg-black relative">
              <video
                src={myPageVideoUrl}
                loop={shouldLoop}
                controls
                playsInline
                muted
                className="w-full h-full object-cover"
                onPlay={trackImpression}
              />
            </div>
          </Card>
        )}

        {/* Live Stream Section */}
        {profile?.is_live_on_profile ? (
          <Card className="mb-6 overflow-hidden border-2 border-brand-red/50 shadow-lg animate-fade-in">
            <div className="bg-gradient-to-r from-brand-red/90 to-brand-navy/90 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white font-bold text-sm">LIVE</span>
                </div>
                <span className="text-white font-medium text-sm">
                  Streaming now
                </span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                <Users className="h-3 w-3 mr-1" />
                {currentLiveViewers} watching
              </Badge>
            </div>
            <div className="aspect-video bg-gradient-to-br from-brand-navy to-black relative">
              {profile.live_video_url ? (
                <video 
                  ref={(el) => {
                    if (el && !el.dataset.tracked) {
                      el.dataset.tracked = 'true';
                      
                      console.log("Live video element mounted:", profile.live_video_url);
                      
                      // Track stream impression on play
                      const trackImpression = async () => {
                        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const startTime = Date.now();
                        
                        console.log("Tracking stream impression:", sessionId);
                        
                        // Create impression record
                        const { data: impression } = await supabase
                          .from('stream_impressions')
                          .insert({
                            creator_id: profile.id,
                            viewer_ip_hash: 'anonymous', // Will be hashed on backend
                            session_id: sessionId,
                            stream_type: 'video',
                            stream_title: profile.live_stream_title || 'Live Stream',
                          })
                          .select()
                          .single();

                        // Update watch time periodically
                        const updateInterval = setInterval(async () => {
                          const watchDuration = Math.floor((Date.now() - startTime) / 1000);
                          if (impression) {
                            await supabase
                              .from('stream_impressions')
                              .update({
                                watch_duration_seconds: watchDuration,
                                ended_at: new Date().toISOString(),
                              })
                              .eq('id', impression.id);
                          }
                        }, 10000); // Update every 10 seconds

                        // Clear interval on pause/end
                        el.addEventListener('pause', () => clearInterval(updateInterval));
                        el.addEventListener('ended', () => clearInterval(updateInterval));
                      };

                      el.addEventListener('play', trackImpression, { once: true });
                      
                      // Add error handling
                      el.addEventListener('error', (e) => {
                        console.error("Video loading error:", e, el.error);
                      });
                      
                      // Log successful loading
                      el.addEventListener('loadeddata', () => {
                        console.log("Video loaded successfully");
                      });
                    }
                  }}
                  src={profile.live_video_url} 
                  autoPlay
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => console.error("Video element error:", e)}
                />
              ) : (
                <>
                  <img 
                    src={heroVirtualStudio} 
                    alt="Live stream" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </>
              )}
            </div>
            {/* Call-to-Action Section - Only show when enabled */}
            {profile.tipping_enabled !== false && (
              <div className="p-4 bg-gradient-to-r from-background/95 to-background/90 backdrop-blur-sm border-t border-border/50 space-y-3">
                {/* Tip/Donate Button */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Enjoying the stream?</p>
                    <p className="text-xs text-muted-foreground">Show your support</p>
                  </div>
                  <TipButton 
                    creatorId={profile.id} 
                    creatorName={profile.full_name || profile.username}
                    buttonText={profile.my_page_cta_button_text || 'Tip'}
                  />
                </div>
                
                {/* Phone/Text Options */}
                {profile.my_page_cta_phone_number && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => window.open(`tel:${profile.my_page_cta_phone_number}`, '_self')}
                    >
                      <Phone className="h-4 w-4" />
                      Call {profile.my_page_cta_phone_number}
                    </Button>
                    {profile.my_page_cta_text_keyword && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(`sms:${profile.my_page_cta_phone_number}?body=${encodeURIComponent(profile.my_page_cta_text_keyword)}`, '_self')}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Text "{profile.my_page_cta_text_keyword}"
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card className="mb-6 overflow-hidden border border-border/50">
            <div className="aspect-video bg-muted relative">
              <img 
                src={heroVirtualStudio} 
                alt="Virtual studio" 
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
                    <Radio className="h-3.5 w-3.5 mr-1.5" />
                    Not Live
                  </Badge>
                  <p className="text-sm text-foreground/90 px-4 font-medium">
                    Check back later for live streams
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
        </div>

        {/* Tabbed Content - Auto-Smart Organization */}
        <div className="px-4 w-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full overflow-hidden">
          <div className="overflow-x-auto mb-8 scrollbar-hide w-full">
            <TabsList className="inline-flex w-auto min-w-full justify-start sm:grid sm:grid-cols-7 sm:w-full">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-4"
                style={{ 
                  borderBottomColor: activeTab === 'all' ? profile?.theme_color : 'transparent'
                }}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
                <Badge variant="secondary" className="ml-1 text-xs">{totalItems}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-4"
                style={{ 
                  borderBottomColor: activeTab === 'events' ? profile?.theme_color : 'transparent'
                }}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
                <Badge variant="secondary" className="ml-1 text-xs">{events.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="meetings" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-4"
                style={{ 
                  borderBottomColor: activeTab === 'meetings' ? profile?.theme_color : 'transparent'
                }}
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Book</span>
                <Badge variant="secondary" className="ml-1 text-xs">{meetingTypes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-2"
                style={{ 
                  borderBottomColor: activeTab === 'signup' ? profile?.theme_color : 'transparent'
                }}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Up</span>
                <Badge variant="secondary" className="ml-1 text-xs">{signupSheets.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="podcasts" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-2"
                style={{ 
                  borderBottomColor: activeTab === 'podcasts' ? profile?.theme_color : 'transparent'
                }}
              >
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">Podcasts</span>
                <Badge variant="secondary" className="ml-1 text-xs">{podcasts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="blog" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-2"
                style={{ 
                  borderBottomColor: activeTab === 'blog' ? profile?.theme_color : 'transparent'
                }}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Blog</span>
                <Badge variant="secondary" className="ml-1 text-xs">{blogPosts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="links" 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 data-[state=active]:border-b-2"
                style={{ 
                  borderBottomColor: activeTab === 'links' ? profile?.theme_color : 'transparent'
                }}
              >
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Links</span>
                <Badge variant="secondary" className="ml-1 text-xs">{customLinks.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-0 animate-fade-in max-w-full">
            {totalItems === 0 ? (
              <Card className="p-12 text-center max-w-full">
                <p className="text-muted-foreground">No content available yet.</p>
              </Card>
            ) : (
              <div className="max-w-full overflow-hidden">
                {renderSectionsInOrder()}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4 animate-fade-in">
            {events.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming events</p>
              </Card>
            ) : (
              events.map((event) => (
                <InteractiveCard
                  key={event.id}
                  className="p-5 hover:shadow-lg transition-shadow"
                  onInteract={() => {
                    trackLinkClick(`/event/${event.id}`, 'event');
                    navigate(`/events/${event.id}`);
                  }}
                >
                  <div className="flex gap-4">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              ))
            )}
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-4 animate-fade-in">
            {meetingTypes.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No meeting types available</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {meetingTypes.map((meeting) => (
                  <InteractiveCard
                    key={meeting.id}
                    className="p-5 hover:shadow-lg transition-shadow"
                    onInteract={() => {
                      trackLinkClick(`/book-meeting-slot/${meeting.id}`, 'meeting');
                      navigate(`/book-meeting-slot/${meeting.id}`);
                    }}
                  >
                    <h3 className="text-lg font-semibold mb-2">{meeting.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {meeting.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meeting.duration} minutes
                      </span>
                      <span>•</span>
                      <span>{getLocationLabel(meeting.location_type)}</span>
                    </div>
                  </InteractiveCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup" className="space-y-4 animate-fade-in">
            {signupSheets.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No sign-up opportunities available</p>
              </Card>
            ) : (
              signupSheets.map((sheet) => (
                <InteractiveCard
                  key={sheet.id}
                  className="p-5 hover:shadow-lg transition-shadow"
                  onInteract={() => {
                    trackLinkClick(`/signup-sheet/${sheet.id}`, 'signup');
                    navigate(`/signup-sheet/${sheet.id}`);
                  }}
                >
                  <h3 className="text-lg font-semibold mb-2">{sheet.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {sheet.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(sheet.start_date).toLocaleDateString()} - {new Date(sheet.end_date).toLocaleDateString()}
                    </span>
                    {sheet.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {sheet.location}
                      </span>
                    )}
                  </div>
                </InteractiveCard>
              ))
            )}
          </TabsContent>

          {/* Podcasts Tab */}
          <TabsContent value="podcasts" className="space-y-6 animate-fade-in">
            {podcasts.length === 0 ? (
              <Card className="p-12 text-center">
                <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No podcasts available</p>
              </Card>
            ) : (
              podcasts.map((podcast) => {
                const podcastEpisodes = episodes.filter(ep => ep.podcast_id === podcast.id);
                if (podcastEpisodes.length === 0) return null;
                
                return (
                  <div key={podcast.id} className="space-y-3">
                    <div className="flex items-start gap-4">
                      {podcast.cover_image_url && (
                        <img
                          src={podcast.cover_image_url}
                          alt={podcast.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">{podcast.title}</h3>
                        {podcast.description && (
                          <p className="text-sm text-muted-foreground mt-1">{podcast.description}</p>
                        )}
                      </div>
                    </div>
                    <PodcastPlayer podcast={podcast} episodes={podcastEpisodes} creatorId={profile?.id || ''} />
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="space-y-6 animate-fade-in">
            {blogPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No blog posts yet</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {blogPosts.map((post, index) => (
                  <Card 
                    key={post.id} 
                    className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                      index === 0 ? 'md:grid md:grid-cols-2 md:gap-6' : ''
                    }`}
                    onClick={() => {
                      trackLinkClick(`/blog/${post.slug}`, 'blog');
                      window.open(`/blog/${post.slug}`, '_blank');
                    }}
                  >
                    {post.featured_image_url && (
                      <div className={`overflow-hidden ${
                        index === 0 ? 'aspect-video md:aspect-square' : 'aspect-video'
                      }`}>
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className={`p-6 ${index === 0 && post.featured_image_url ? 'flex flex-col justify-center' : ''}`}>
                      {post.is_ai_generated && (
                        <Badge variant="secondary" className="w-fit mb-2 text-xs">
                          AI Generated
                        </Badge>
                      )}
                      <h3 className={`font-bold mb-3 line-clamp-2 ${
                        index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'
                      }`}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className={`text-muted-foreground mb-4 ${
                          index === 0 ? 'text-base line-clamp-4' : 'text-sm line-clamp-2'
                        }`}>
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count || 0} views
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-6 animate-fade-in">
            {customLinks.length === 0 ? (
              <Card className="p-12 text-center">
                <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No custom links available</p>
              </Card>
            ) : (
              <>
                {/* Group links by section */}
                {Array.from(new Set(customLinks.map(link => link.section))).map((section) => {
                  const sectionLinks = customLinks.filter(link => link.section === section);
                  const isOpen = openSections.has(section || "no-section");
                  
                  return (
                    <Collapsible
                      key={section || "no-section"}
                      open={isOpen}
                      onOpenChange={(open) => {
                        setOpenSections(prev => {
                          const newSet = new Set(prev);
                          if (open) {
                            newSet.add(section || "no-section");
                          } else {
                            newSet.delete(section || "no-section");
                          }
                          return newSet;
                        });
                      }}
                      className="space-y-4"
                    >
                      {section && (
                        <CollapsibleTrigger className="w-full group">
                          <Card 
                            className="p-5 transition-all duration-300 hover:shadow-xl border-2 cursor-pointer"
                            style={{ 
                              borderColor: isOpen ? profile.theme_color : 'transparent',
                              background: 'hsl(var(--card))'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {sectionMetadata.get(section)?.image_url ? (
                                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-110">
                                    <img 
                                      src={sectionMetadata.get(section)?.image_url || ''} 
                                      alt={section}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                                    style={{ 
                                      background: `linear-gradient(135deg, ${profile.theme_color}20, ${profile.theme_color}10)`
                                    }}
                                  >
                                    <Link2 
                                      className="h-6 w-6"
                                      style={{ color: profile.theme_color }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1 text-left">
                                  <h3 
                                    className="text-2xl font-bold mb-1 transition-colors duration-300"
                                    style={{ 
                                      color: isOpen ? profile.theme_color : 'hsl(var(--foreground))'
                                    }}
                                  >
                                    {section}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {sectionLinks.length} {sectionLinks.length === 1 ? 'item' : 'items'}
                                  </p>
                                </div>
                              </div>
                              <ChevronDown 
                                className="h-6 w-6 transition-all duration-300 ml-4"
                                style={{ 
                                  color: profile.theme_color,
                                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                              />
                            </div>
                          </Card>
                        </CollapsibleTrigger>
                      )}
                      
                      <CollapsibleContent className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2 pt-2">
                          {sectionLinks.map((link) => (
                            <InteractiveCard
                              key={link.id}
                              className="p-5 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                              onInteract={() => {
                                trackLinkClick(link.url, 'custom_link');
                                window.open(link.url, '_blank');
                              }}
                            >
                              <div className="flex gap-4">
                                {link.image_url && (
                                  <img
                                    src={link.image_url}
                                    alt={link.title}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold mb-1 break-words">{link.title}</h3>
                                  {link.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                                      {link.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </InteractiveCard>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>
        
        {/* Newsletter Subscription Section */}
        {profile?.newsletter_enabled && !isOwnProfile && (
          <div className="mt-12 px-4 max-w-md mx-auto">
            <NewsletterSubscribeWidget 
              userId={profile.id}
              heading={profile.newsletter_heading || "Stay Updated"}
              description={profile.newsletter_description || "Subscribe to get the latest updates delivered to your inbox."}
            />
          </div>
        )}
        
        {/* Footer Section */}
        <footer className="mt-12 pt-8 border-t border-border text-center space-y-6 px-4">
          {/* Create Your Own Seeksy CTA - Always visible for non-owners */}
          {!isOwnProfile && (
            <div className="py-6">
              <Link to="/auth">
                <Button size="lg" className="font-semibold">
                  Create your own Seeksy Page
                </Button>
              </Link>
            </div>
          )}
          
          {/* Legal Links - Only if enabled */}
          {profile?.legal_on_profile && (
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-muted-foreground pb-4">
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a>
              <span>•</span>
              <a href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
};

export default Profile;
