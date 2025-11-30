import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { RoleProvider } from "@/contexts/RoleContext";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTaskReminders } from "@/hooks/useTaskReminders";
import { useAutoTheme } from "@/hooks/useAutoTheme";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { RouteTransition } from "@/components/RouteTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardV2 from "./pages/DashboardV2";
import DashboardOnboarding from "./pages/DashboardOnboarding";
import CommunicationHistory from "./pages/CommunicationHistory";
import Newsletter from "./pages/Newsletter";
import Unsubscribe from "./pages/Unsubscribe";
import NotificationPreferences from "./pages/NotificationPreferences";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import SignupSheets from "./pages/SignupSheets";
import CreateSignupSheet from "./pages/CreateSignupSheet";
import SignupSheetDetail from "./pages/SignupSheetDetail";
import MeetingTypes from "./pages/MeetingTypes";
import CreateMeetingType from "./pages/CreateMeetingType";
import EditMeetingType from "./pages/EditMeetingType";
import CreateMeeting from "./pages/CreateMeeting";
import EditMeeting from "./pages/EditMeeting";
import Meetings from "./pages/Meetings";
import MeetNow from "./pages/MeetNow";
import MeetingStudio from "./pages/MeetingStudio";
import MeetingRSVP from "./pages/MeetingRSVP";
import Availability from "./pages/Availability";
import MasterStudio from "./pages/MasterStudio";
import VideoStudio from "./pages/VideoStudio";
import LiveStudio from "./pages/LiveStudio";
import StudioLayout from "./pages/studio/StudioLayout";
import StudioHome from "./pages/studio/StudioHome";
import StudioRecording from "./pages/studio/StudioRecording";
import StudioPostSession from "./pages/studio/StudioPostSession";
import BookMeetings from "./pages/BookMeetings";
import BookMeetingSlot from "./pages/BookMeetingSlot";
import ProfileEdit from "./pages/ProfileEdit";
import MyPageBuilderV2 from "./components/mypage/v2/MyPageBuilderV2";
import MyPagePublic from "./pages/MyPagePublic";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdAnalyticsImport from "./pages/admin/AdAnalyticsImport";
import Contacts from "./pages/Contacts";
import CRM from "./pages/CRM";
import SMS from "./pages/SMS";
import SponsorshipMarketplace from "./pages/SponsorshipMarketplace";
import Integrations from "./pages/Integrations";
import Polls from "./pages/Polls";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Security from "./pages/Security";
import AdminLegal from "./pages/AdminLegal";
import Settings from "./pages/Settings";
import QRCodes from "./pages/QRCodes";
import Podcasts from "./pages/Podcasts";
import CreatePodcast from "./pages/CreatePodcast";
import Blog from "./pages/Blog";
import CreateBlogPost from "./pages/CreateBlogPost";
import PublicBlogPost from "./pages/PublicBlogPost";
import UserBlog from "./pages/UserBlog";
import MasterBlog from "./pages/MasterBlog";
import SeeksyAIBoostHelp from "./pages/SeeksyAIBoostHelp";
import PodcastDetail from "./pages/PodcastDetail";
import EditPodcast from "./pages/EditPodcast";
import ImportPodcast from "./pages/ImportPodcast";
import UploadEpisode from "./pages/UploadEpisode";
import RSSMigrationPage from "./pages/RSSMigrationPage";
import PaidAdsTerms from "./pages/legal/PaidAdsTerms";
import SubscriptionSettings from "./pages/SubscriptionSettings";
import { SeeksyAIChatWidget } from "./components/SeeksyAIChatWidget";
import { useHolidaySettings } from "./hooks/useHolidaySettings";
import { HolidayWelcomeModal, SantaAssistantButton, Snowfall } from "./components/holiday";
import AdminSettings from "./pages/admin/Settings";
import AdminAds from "./pages/AdminAds";
import AdminAudioAds from "./pages/AdminAudioAds";
import PodcastAds from "./pages/PodcastAds";
import PodcastRevenue from "./pages/PodcastRevenue";
import AdvertiserSignup from "./pages/AdvertiserSignup";
import AdvertiserServices from "./pages/AdvertiserServices";
import AdminAdvertisers from "./pages/AdminAdvertisers";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import AdvertiserCampaigns from "./pages/AdvertiserCampaigns";
import AdvertiserAdLibrary from "./pages/AdvertiserAdLibrary";
import CreateCampaignTypeSelection from "./pages/CreateCampaignTypeSelection";
import EditCampaign from "./pages/EditCampaign";
import CreateCampaign from "./pages/CreateCampaign";
import CreateAudioAd from "./pages/CreateAudioAd";
import CreateDigitalAd from "./pages/CreateDigitalAd";
import CreateConversationalAd from "./pages/CreateConversationalAd";
import CreateAudioAdWizard from "./pages/CreateAudioAdWizard";
import UploadReadyAd from "./pages/UploadReadyAd";
import CreateHostScript from "./pages/CreateHostScript";
import CreateSponsorship from "./pages/CreateSponsorship";
import AdminConversationalDemo from "./pages/AdminConversationalDemo";
import AdvertiserPricing from "./pages/AdvertiserPricing";
import VoiceProtection from "./pages/VoiceProtection";
import VoiceCredentials from "./pages/VoiceCredentialsSimple";
import VoiceCredentialsAdmin from "./pages/admin/VoiceCredentialsAdmin";
import CreateAudioAdCampaign from "./pages/CreateAudioAdCampaign";
import AdvertiserCampaignDashboard from "./pages/AdvertiserCampaignDashboard";
import AdvertiserCampaignDetail from "./pages/AdvertiserCampaignDetail";
import BroadcastStudio from "./pages/BroadcastStudio";
import CreditInfo from "./pages/CreditInfo";
import StudioTemplates from "./pages/StudioTemplates";
import MediaLibrary from "./pages/MediaLibrary";
import MediaVault from "./pages/MediaVault";
import PostProductionStudio from "./pages/PostProductionStudio";
import CreateClips from "./pages/CreateClips";
import SystemStatus from "./pages/SystemStatus";
import AdminSystemStatus from "./pages/admin/SystemStatus";
import Pricing from "./pages/Pricing";
import Awards from "./pages/Awards";
import CreateAwardsProgram from "./pages/CreateAwardsProgram";
import AwardsProgramDetail from "./pages/AwardsProgramDetail";
import PublicNomination from "./pages/PublicNomination";
import BrowseAwards from "./pages/BrowseAwards";
import AwardsVoting from "./pages/AwardsVoting";
import PurchaseSponsorship from "./pages/PurchaseSponsorship";
import TeamChat from "./pages/TeamChat";
import Team from "./pages/Team";
import AdminInternalChat from "./pages/AdminInternalChat";
import SupportChat from "./pages/SupportChat";
import CFODashboard from "./pages/CFODashboard";
import CFOCalculators from "./pages/CFOCalculators";
import ProForma from "./pages/ProForma";
import TechStack from "./pages/TechStack";
import Onboarding from "./pages/Onboarding";
import SalesDashboard from "./pages/SalesDashboard";
import SalesAdLibrary from "./pages/SalesAdLibrary";
import AdminMasterBlog from "./pages/AdminMasterBlog";
import CreatorCampaignBrowser from "./pages/CreatorCampaignBrowser";
import CreateMultiChannelCampaign from "./pages/CreateMultiChannelCampaign";
import MetaOAuthCallback from "./pages/MetaOAuthCallback";
import SeeksyArchitecture from "./pages/SeeksyArchitecture";
import SupportDesk from "./pages/admin/SupportDesk";
import SalesLeads from "./pages/admin/SalesLeads";
import AdvertisingManagement from "./pages/admin/AdvertisingManagement";
import ImpersonateUser from "./pages/admin/ImpersonateUser";
import CreditManagement from "./pages/admin/CreditManagement";
import AdminProfileSettings from "./pages/admin/AdminProfileSettings";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminIdentity from "./pages/admin/Identity";
import AppAudioAdmin from "./pages/admin/AppAudioAdmin";
import PersonaManagement from "./pages/admin/PersonaManagement";
import KeysVault from "./pages/KeysVault";
import ManageInvestorSpreadsheets from "./pages/ManageInvestorSpreadsheets";
import ModuleSelector from "./pages/ModuleSelector";
import Modules from "./pages/Modules";
import RoleSettings from "./pages/RoleSettings";
import InfluenceHub from "./pages/InfluenceHub";
import InfluenceHubConnect from "./pages/InfluenceHubConnect";
import InfluenceHubCreators from "./pages/InfluenceHubCreators";
import InfluenceHubMedia from "./pages/InfluenceHubMedia";
import UpdateMediaDurations from "./pages/UpdateMediaDurations";
import Tasks from "./pages/Tasks";
import CivicEvents from "./pages/civic/CivicEvents";
import ConstituentRequests from "./pages/civic/ConstituentRequests";
import CivicBlog from "./pages/civic/CivicBlog";
import PublicConstituentRequestForm from "./pages/civic/PublicConstituentRequestForm";
import CreateCivicEvent from "./pages/civic/CreateCivicEvent";
import CreateCivicArticle from "./pages/civic/CreateCivicArticle";
import CreatorCampaignResponses from "./pages/CreatorCampaignResponses";
import InfluencerSearch from "./pages/agency/InfluencerSearch";
import AgencyCampaigns from "./pages/agency/AgencyCampaigns";
import InfluencerProfileSettings from "./pages/InfluencerProfileSettings";
import InfluencerPortfolio from "./pages/InfluencerPortfolio";
import Marketing from "./pages/Marketing";
import ClientTickets from "./pages/ClientTickets";
import Proposals from "./pages/Proposals";
import CreateProposal from "./pages/CreateProposal";
import ProposalDetail from "./pages/ProposalDetail";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvestorPortal from "./pages/InvestorPortal";
import LeadsDashboard from "./pages/LeadsDashboard";
import ProjectManagement from "./pages/ProjectManagement";
import CreateLead from "./pages/CreateLead";
import LeadForm from "./pages/LeadForm";
import SignDocument from "./pages/SignDocument";
import PodcastDistribution from "./pages/PodcastDistribution";
import PublicTicketSubmission from "./pages/PublicTicketSubmission";
import FieldLeadCapture from "./pages/FieldLeadCapture";
import PublicTaskSubmission from "./pages/PublicTaskSubmission";
import HelpCenter from "./pages/HelpCenter";
import Comparison from "./pages/Comparison";
import Credits from "./pages/Credits";
import Certificate from "./pages/Certificate";
import ZoomIntegration from "./pages/help/ZoomIntegration";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import PublicForm from "./pages/PublicForm";
import Personas from "./pages/Personas";
import VoiceCertification from "./pages/VoiceCertification";
import VoiceTag from "./pages/VoiceTag";
import VoiceTagAdmin from "./pages/VoiceTagAdmin";
import ScreenshotGenerator from "./pages/admin/ScreenshotGenerator";
import RevenueReports from "./pages/admin/RevenueReports";
import Billing from "./pages/admin/Billing";
import Payments from "./pages/admin/Payments";
import AdFinancialModels from "./pages/admin/AdFinancialModels";
import CombinedFinancialModels from "./pages/admin/CombinedFinancialModels";
import AdminRateDesk from "./pages/admin/advertising/AdminRateDesk";
import AdminAdvertisersList from "./pages/admin/advertising/AdminAdvertisersList";
import AdminCreateCampaign from "./pages/admin/advertising/CreateCampaign";
import CampaignDetail from "./pages/admin/advertising/CampaignDetail";
import CreateAd from "./pages/admin/advertising/CreateAd";
import TranscriptLibrary from "./pages/transcripts/TranscriptLibrary";
import TranscriptDetailPage from "./pages/transcripts/TranscriptDetailPage";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminAdAnalytics from "./pages/admin/AdminAdAnalytics";
import VoiceCertificationDashboard from "./pages/voice-certification/VoiceCertificationDashboard";
import PublicCreatorIdentity from "./pages/PublicCreatorIdentity";
import VoiceVerificationUnified from "./pages/voice-certification/VoiceVerificationUnified";
import VoiceVerifying from "./pages/voice-certification/VoiceVerifying";
import VoiceSuccess from "./pages/voice-certification/VoiceSuccess";
import AdClickRedirect from "./pages/ad/AdClickRedirect";
import VoiceCredentialPublic from "./pages/public/VoiceCredentialPublic";
import MyVoiceIdentity from "./pages/MyVoiceIdentity";
import UploadContent from "./pages/content-certification/UploadContent";
import AIFingerprintMatch from "./pages/content-certification/AIFingerprintMatch";
import AuthenticityScan from "./pages/content-certification/AuthenticityScan";
import ApproveAndMintContent from "./pages/content-certification/ApproveAndMintContent";
import MintingProgressContent from "./pages/content-certification/MintingProgressContent";
import CertifiedContentSuccess from "./pages/content-certification/CertifiedContentSuccess";
import PodcastStudioHome from "./pages/podcast-studio/StudioHome";
import VoiceConsentScreen from "./pages/voice-certification/VoiceConsentScreen";
import VoiceScriptSelection from "./pages/voice-certification/VoiceScriptSelection";
import VoiceRecording from "./pages/voice-certification/VoiceRecording";
import VoiceProcessing from "./pages/voice-certification/VoiceProcessing";
import VoiceSuccessScreen from "./pages/voice-certification/VoiceSuccess";
import BlogLibrary from "./pages/blog/BlogLibrary";
import BlogEditor from "./pages/blog/BlogEditor";
import BlogCertify from "./pages/blog/BlogCertify";
import ContentCredentialPublic from "./pages/public/ContentCredentialPublic";
import MicrophoneSetup from "./pages/podcast-studio/MicrophoneSetup";
import RecordingConsole from "./pages/podcast-studio/RecordingConsole";
import AICleanup from "./pages/podcast-studio/AICleanup";
import SaveEpisode from "./pages/podcast-studio/SaveEpisode";
import ExportEpisode from "./pages/podcast-studio/ExportEpisode";
import StudioSuccess from "./pages/podcast-studio/StudioSuccess";
import AdvertiserDashboardNew from "./pages/advertiser/AdvertiserDashboard";
import AdvertiserCampaignsList from "./pages/advertiser/AdvertiserCampaignsList";
import CampaignDetails from "./pages/advertiser/CampaignDetails";
import CreateScript from "./pages/advertiser/CreateScript";
import AdvertiserCreatives from "./pages/advertiser/AdvertiserCreatives";
import AdvertiserCreators from "./pages/advertiser/AdvertiserCreators";
import AdvertiserReports from "./pages/advertiser/AdvertiserReports";
import AdvertiserBilling from "./pages/advertiser/AdvertiserBilling";
import AdvertiserIntegrations from "./pages/advertiser/AdvertiserIntegrations";
import { ProtectedRoute } from "./components/ProtectedRoute";
import EpisodeDetails from "./pages/episodes/EpisodeDetails";
import NewEpisodeFromStudio from "./pages/podcasts/NewEpisodeFromStudio";
import NewEpisode from "./pages/podcasts/NewEpisode";
import EpisodeDetailPublic from "./pages/podcasts/EpisodeDetailPublic";
import PodcastStats from "./pages/podcasts/PodcastStats";
import PodcastDashboard from "./pages/podcasts/PodcastDashboard";
import VoiceCloningWizard from "./pages/voice-cloning/VoiceCloningWizard";
import CertificationConsole from "./pages/admin/CertificationConsole";
import Verified from "./pages/Verified";
import { IdentityDashboard } from "./components/identity/IdentityDashboard";
import IdentityRights from "./pages/IdentityRights";
import IdentityCertificatePage from "./pages/IdentityCertificatePage";
import FaceUpload from "./pages/face-verification/FaceUpload";
import FaceProcessing from "./pages/face-verification/FaceProcessing";
import FaceSuccess from "./pages/face-verification/FaceSuccess";
import IdentityCertificateDetail from "./pages/IdentityCertificateDetail";
import AdminChecklists from "./pages/admin/Checklists";
import ChecklistTemplate from "./pages/admin/ChecklistTemplate";

const queryClient = new QueryClient();

const HolidayFeatures = () => {
  const { data: settings } = useHolidaySettings();
  const holidayMode = settings?.holidayMode ?? false;
  const holidaySnow = settings?.holidaySnow ?? false;

  if (!holidayMode) return null;

  return (
    <>
      <HolidayWelcomeModal />
      <SantaAssistantButton />
      {holidaySnow && <Snowfall />}
    </>
  );
};

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  
  // Enable task reminders for logged-in users
  useTaskReminders();
  
  // Enable time-based auto theme (7am light, 7pm dark) and force dark mode in Studio
  useAutoTheme();
  
  // Restore scroll position on navigation
  useScrollRestoration();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Defer admin check to avoid blocking
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(roles?.some(r => r.role === "admin" || r.role === "super_admin") || false);
    } catch (error) {
      console.error("Exception checking admin status:", error);
      setIsAdmin(false);
    }
  };

  return (
    <RoleProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          {/* Hide Sidebar on Studio workspace (but show on Studio Hub) */}
          {user && location.pathname !== '/broadcast/session/:id' && !location.pathname.includes('/broadcast/session/') && <AppSidebar user={user} isAdmin={isAdmin} />}
        
        <div className="flex-1 flex flex-col">
          {/* Hide Header on all Studio pages */}
          {!location.pathname.startsWith('/studio') && <Header user={user} />}
          
          <main className="flex-1 bg-background overflow-hidden">
            <RouteTransition>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/comparison" element={<Comparison />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/personas" element={<Personas />} />
              <Route path="/voice-certification" element={<VoiceCertification />} />
              <Route path="/voice-tag" element={<VoiceTag />} />
              <Route path="/admin/voice-tag-certification" element={<VoiceTagAdmin />} />
              
              {/* Unified Voice Identity Hub */}
              <Route path="/my-voice-identity" element={<MyVoiceIdentity />} />
              <Route path="/voice-cloning" element={<ProtectedRoute requiredRole="creator"><VoiceCloningWizard /></ProtectedRoute>} />
              
              {/* Voice Verification Flow - Multi-Step */}
              <Route path="/identity/voice/consent" element={<VoiceConsentScreen />} />
              <Route path="/identity/voice/script" element={<VoiceScriptSelection />} />
              <Route path="/identity/voice/recording" element={<VoiceRecording />} />
              <Route path="/identity/voice/processing" element={<VoiceProcessing />} />
              <Route path="/identity/voice/success" element={<VoiceSuccessScreen />} />
              
              {/* Face Verification Flow */}
              <Route path="/face-verification" element={<FaceUpload />} />
              <Route path="/face-verification/processing" element={<FaceProcessing />} />
              <Route path="/face-verification/success" element={<FaceSuccess />} />
              
              {/* Content Certification Flow */}
              <Route path="/content-certification" element={<UploadContent />} />
              <Route path="/content-certification/fingerprint" element={<AIFingerprintMatch />} />
              <Route path="/content-certification/authenticity" element={<AuthenticityScan />} />
              <Route path="/content-certification/approve-mint" element={<ApproveAndMintContent />} />
              <Route path="/content-certification/minting-progress" element={<MintingProgressContent />} />
              <Route path="/content-certification/success" element={<CertifiedContentSuccess />} />
              
              {/* Clip Certification */}
              <Route path="/certificate/:clipId" element={<Certificate />} />
              <Route path="/verified" element={<Verified />} />
              
              {/* Podcast Studio Flow */}
              <Route path="/podcast-studio" element={<PodcastStudioHome />} />
              <Route path="/podcast-studio/mic-setup" element={<MicrophoneSetup />} />
              <Route path="/podcast-studio/record" element={<RecordingConsole />} />
              <Route path="/podcast-studio/cleanup" element={<AICleanup />} />
              <Route path="/podcast-studio/save" element={<SaveEpisode />} />
              <Route path="/podcast-studio/export" element={<ExportEpisode />} />
              <Route path="/podcast-studio/success" element={<StudioSuccess />} />
              
              {/* Advertiser Ad-Read Marketplace Routes */}
            <Route path="/advertiser" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserDashboardNew /></ProtectedRoute>} />
            <Route path="/advertiser/campaigns" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserCampaignsList /></ProtectedRoute>} />
            <Route path="/advertiser/campaigns/:id" element={<ProtectedRoute requiredRole="advertiser"><CampaignDetails /></ProtectedRoute>} />
            <Route path="/advertiser/creatives" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserCreatives /></ProtectedRoute>} />
            <Route path="/advertiser/scripts/new" element={<ProtectedRoute requiredRole="advertiser"><CreateScript /></ProtectedRoute>} />
            <Route path="/advertiser/creators" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserCreators /></ProtectedRoute>} />
            <Route path="/advertiser/reports" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserReports /></ProtectedRoute>} />
            <Route path="/advertiser/billing" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserBilling /></ProtectedRoute>} />
            <Route path="/advertiser/integrations" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserIntegrations /></ProtectedRoute>} />
            
            {/* Episode Details */}
            <Route path="/episodes/:id" element={<EpisodeDetails />} />
              
            <Route path="/investor" element={<InvestorPortal />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="/client-tickets" element={<ClientTickets />} />
            <Route path="/create-lead" element={<CreateLead />} />
            <Route path="/lead-form" element={<LeadForm />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/proposals/create" element={<CreateProposal />} />
            <Route path="/proposals/:id" element={<ProposalDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/sign/:token" element={<SignDocument />} />
            <Route path="/podcast-distribution" element={<PodcastDistribution />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/security" element={<Security />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-v2" element={<DashboardV2 />} />
          <Route path="/dashboard/onboarding" element={<DashboardOnboarding />} />
              <Route path="/email-history" element={<CommunicationHistory />} />
          <Route path="/communication-history" element={<CommunicationHistory />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/v/:username/voice-credential" element={<VoiceCredentialPublic />} />
              <Route path="/c/:id" element={<ContentCredentialPublic />} />
              <Route path="/ad/click/:adId" element={<AdClickRedirect />} />
              <Route path="/blog" element={<BlogLibrary />} />
              <Route path="/blog/new" element={<BlogEditor />} />
              <Route path="/blog/:id/edit" element={<BlogEditor />} />
              <Route path="/blog/:id/certify" element={<BlogCertify />} />
              <Route path="/blog-library" element={<BlogLibrary />} />
              <Route path="/transcripts" element={<TranscriptLibrary />} />
              <Route path="/transcripts/:id" element={<TranscriptDetailPage />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/event/:id/edit" element={<EditEvent />} />
              <Route path="/create-signup-sheet" element={<CreateSignupSheet />} />
              <Route path="/signup-sheet/:id" element={<SignupSheetDetail />} />
              <Route path="/meeting-types" element={<MeetingTypes />} />
              <Route path="/meeting-types/create" element={<CreateMeetingType />} />
              <Route path="/meeting-types/:id/edit" element={<EditMeetingType />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/meetings/now" element={<MeetNow />} />
              <Route path="/meeting-studio/:id" element={<MeetingStudio />} />
              <Route path="/meetings/create" element={<CreateMeeting />} />
              <Route path="/meetings/edit/:id" element={<EditMeeting />} />
              <Route path="/meeting-rsvp" element={<MeetingRSVP />} />
              
              {/* Master Studio Routes */}
              <Route path="/studio-old" element={<MasterStudio />} />
              <Route path="/studio/video" element={<VideoStudio />} />
              <Route path="/studio/solo" element={<VideoStudio />} />
              <Route path="/studio/live" element={<LiveStudio />} />
              
              {/* New Flagship Studio */}
              <Route path="/studio" element={<StudioLayout />}>
                <Route index element={<StudioHome />} />
                <Route path="recording/new" element={<StudioRecording />} />
                <Route path="post-session/:sessionId" element={<StudioPostSession />} />
              </Route>
              
            <Route path="/events" element={<Events />} />
            <Route path="/signup-sheets" element={<SignupSheets />} />
              <Route path="/meetings/create" element={<CreateMeeting />} />
              <Route path="/availability" element={<Availability />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/module-selector" element={<ModuleSelector />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/influencehub" element={<InfluenceHub />} />
          <Route path="/influencehub/connect" element={<InfluenceHubConnect />} />
          <Route path="/influencehub/creators" element={<InfluenceHubCreators />} />
          <Route path="/influencehub/media" element={<InfluenceHubMedia />} />
          <Route path="/tasks" element={<Tasks />} />
              <Route path="/polls" element={<Polls />} />
              <Route path="/create-poll" element={<CreatePoll />} />
              <Route path="/poll/:id" element={<PollDetail />} />
              <Route path="/podcasts" element={<Podcasts />} />
              <Route path="/podcasts/create" element={<CreatePodcast />} />
              <Route path="/podcasts/import" element={<ImportPodcast />} />
              <Route path="/podcasts/:id" element={<PodcastDashboard />} />
              <Route path="/podcasts/:id/edit" element={<EditPodcast />} />
              <Route path="/podcasts/:id/upload" element={<UploadEpisode />} />
              <Route path="/podcasts/:podcastId/stats" element={<PodcastStats />} />
              <Route path="/podcasts/:podcastId/episodes/new" element={<NewEpisode />} />
              <Route path="/podcasts/:podcastId/episodes/new-from-studio" element={<NewEpisodeFromStudio />} />
              <Route path="/podcasts/:podcastId/episodes/:episodeId" element={<EpisodeDetailPublic />} />
              <Route path="/podcasts/:id/migrate" element={<RSSMigrationPage />} />
              <Route path="/legal/paid-ads-terms" element={<PaidAdsTerms />} />
              <Route path="/my-blog" element={<Blog />} />
              <Route path="/my-blog/create" element={<CreateBlogPost />} />
              <Route path="/my-blog/edit/:id" element={<CreateBlogPost />} />
              <Route path="/blog" element={<MasterBlog />} />
              <Route path="/blog/create" element={<CreateBlogPost />} />
              <Route path="/blog/:slug" element={<PublicBlogPost />} />
              <Route path="/seeksy-ai-boost-help" element={<SeeksyAIBoostHelp />} />
              <Route path="/book/:username" element={<BookMeetings />} />
              <Route path="/book/:username/:meetingTypeId" element={<BookMeetingSlot />} />
              <Route path="/profile/edit" element={<MyPageBuilderV2 />} />
              <Route path="/profile/edit/legacy" element={<ProfileEdit />} />
              <Route path="/role-settings" element={<RoleSettings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/legal" element={<AdminLegal />} />
            <Route path="/admin/conversational-demo" element={<AdminConversationalDemo />} />
            <Route path="/admin/architecture" element={<SeeksyArchitecture />} />
            <Route path="/admin/master-blog" element={<AdminMasterBlog />} />
            <Route path="/admin/system-status" element={<AdminSystemStatus />} />
            <Route path="/admin/ad-analytics-import" element={<AdAnalyticsImport />} />
              <Route path="/admin/support" element={<SupportDesk />} />
              <Route path="/admin/sales" element={<SalesLeads />} />
              <Route path="/admin/advertising" element={<AdvertisingManagement />} />
              <Route path="/admin/impersonate" element={<ImpersonateUser />} />
              <Route path="/admin/credits" element={<CreditManagement />} />
              <Route path="/admin/profile-settings" element={<AdminProfileSettings />} />
              <Route path="/admin/creators" element={<AdminCreators />} />
              <Route path="/admin/identity" element={<AdminIdentity />} />
              <Route path="/admin/certification" element={<CertificationConsole />} />
              <Route path="/admin/investor-spreadsheets" element={<ManageInvestorSpreadsheets />} />
              <Route path="/marketing/app-audio" element={<AppAudioAdmin />} />
              <Route path="/admin/keys-vault" element={<KeysVault />} />
              <Route path="/admin/personas" element={<PersonaManagement />} />
              <Route path="/admin/screenshot-generator" element={<ScreenshotGenerator />} />
              <Route path="/admin/revenue-reports" element={<RevenueReports />} />
              <Route path="/admin/billing" element={<Billing />} />
              <Route path="/admin/payments" element={<Payments />} />
              <Route path="/admin/financial-models/ads/*" element={<AdFinancialModels />} />
              <Route path="/admin/financial-models/combined" element={<CombinedFinancialModels />} />
              <Route path="/admin/advertising/rate-desk" element={<AdminRateDesk />} />
              <Route path="/admin/advertising/advertisers" element={<AdminAdvertisersList />} />
              <Route path="/admin/advertising/campaigns/create" element={<AdminCreateCampaign />} />
              <Route path="/admin/advertising/campaigns/:campaignId" element={<CampaignDetail />} />
              <Route path="/admin/advertising/ads/create" element={<CreateAd />} />
              <Route path="/admin/advertisers" element={<AdminAdvertisers />} />
              <Route path="/admin/ad-campaigns" element={<AdminCampaigns />} />
              <Route path="/admin/ad-analytics" element={<AdminAdAnalytics />} />
          <Route path="/advertiser" element={<AdvertiserServices />} />
          <Route path="/advertiser/signup" element={<AdvertiserSignup />} />
          <Route path="/advertiser/dashboard" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserDashboard /></ProtectedRoute>} />
          <Route path="/advertiser/campaigns" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserCampaigns /></ProtectedRoute>} />
          <Route path="/advertiser/ads" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserAdLibrary /></ProtectedRoute>} />
          <Route path="/advertiser/campaigns/create" element={<ProtectedRoute requiredRole="advertiser"><CreateCampaign /></ProtectedRoute>} />
          <Route path="/advertiser/campaigns/:campaignId" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserCampaignDetail /></ProtectedRoute>} />
          <Route path="/advertiser/campaigns/:campaignId/edit" element={<ProtectedRoute requiredRole="advertiser"><EditCampaign /></ProtectedRoute>} />
          <Route path="/advertiser/campaigns/create-type" element={<ProtectedRoute requiredRole="advertiser"><CreateCampaignTypeSelection /></ProtectedRoute>} />
              <Route path="/advertiser/create-ad-wizard" element={<ProtectedRoute requiredRole="advertiser"><CreateAudioAdWizard /></ProtectedRoute>} />
              <Route path="/advertiser/create-audio-ad" element={<ProtectedRoute requiredRole="advertiser"><CreateAudioAd /></ProtectedRoute>} />
              <Route path="/advertiser/create-conversational-ad" element={<ProtectedRoute requiredRole="advertiser"><CreateConversationalAd /></ProtectedRoute>} />
              <Route path="/advertiser/create-host-script" element={<ProtectedRoute requiredRole="advertiser"><CreateHostScript /></ProtectedRoute>} />
              <Route path="/advertiser/create-sponsorship" element={<ProtectedRoute requiredRole="advertiser"><CreateSponsorship /></ProtectedRoute>} />
              <Route path="/advertiser/audio-ads/create" element={<ProtectedRoute requiredRole="advertiser"><CreateAudioAd /></ProtectedRoute>} />
              <Route path="/advertiser/audio-ads/create-campaign" element={<ProtectedRoute requiredRole="advertiser"><CreateAudioAdCampaign /></ProtectedRoute>} />
              <Route path="/advertiser/campaigns/:adId/dashboard" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserCampaignDashboard /></ProtectedRoute>} />
              <Route path="/advertiser/ads/create-digital" element={<ProtectedRoute requiredRole="advertiser"><CreateDigitalAd /></ProtectedRoute>} />
              <Route path="/advertiser/conversational-ads/create" element={<ProtectedRoute requiredRole="advertiser"><CreateConversationalAd /></ProtectedRoute>} />
              <Route path="/advertiser/upload-ad" element={<ProtectedRoute requiredRole="advertiser"><UploadReadyAd /></ProtectedRoute>} />
              <Route path="/advertiser/pricing" element={<ProtectedRoute requiredRole="advertiser"><AdvertiserPricing /></ProtectedRoute>} />
          <Route path="/podcast-ads" element={<PodcastAds />} />
          <Route path="/podcast-revenue" element={<PodcastRevenue />} />
          <Route path="/voice-protection" element={<VoiceProtection />} />
          <Route path="/voice-credentials" element={<MyVoiceIdentity />} />
          <Route path="/identity" element={<IdentityRights />} />
          <Route path="/certificate/identity/:id" element={<IdentityCertificatePage />} />
          <Route path="/creator/:username/identity" element={<PublicCreatorIdentity />} />
          <Route path="/identity-dashboard" element={<IdentityDashboard />} />
          <Route path="/admin/voice-credentials" element={<VoiceCredentialsAdmin />} />
          <Route path="/admin/checklists" element={<AdminChecklists />} />
          <Route path="/admin/checklists/new-template" element={<ChecklistTemplate />} />
          <Route path="/admin/checklists/template/:templateId" element={<ChecklistTemplate />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notification-preferences" element={<NotificationPreferences />} />
              <Route path="/subscription" element={<SubscriptionSettings />} />
              <Route path="/credit-info" element={<CreditInfo />} />
              <Route path="/qr-codes" element={<QRCodes />} />
          <Route path="/studio-templates" element={<StudioTemplates />} />
          <Route path="/broadcast/session/:id" element={<BroadcastStudio />} />
          <Route path="/broadcast/:id" element={<BroadcastStudio />} />
          <Route path="/media-library" element={<MediaVault />} />
          <Route path="/media-library-legacy" element={<MediaLibrary />} />
          <Route path="/update-media-durations" element={<UpdateMediaDurations />} />
          <Route path="/post-production-studio" element={<PostProductionStudio />} />
          <Route path="/create-clips" element={<CreateClips />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/help-center/:guideId" element={<HelpCenter />} />
          <Route path="/system-status" element={<SystemStatus />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/awards/create" element={<CreateAwardsProgram />} />
        <Route path="/awards/:id" element={<AwardsProgramDetail />} />
        <Route path="/awards/:id/vote" element={<AwardsVoting />} />
        <Route path="/awards/:id/sponsor" element={<PurchaseSponsorship />} />
        <Route path="/browse-awards" element={<BrowseAwards />} />
        <Route path="/nominate/:programId" element={<PublicNomination />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/sms" element={<SMS />} />
            <Route path="/sponsorship-marketplace" element={<SponsorshipMarketplace />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team-chat" element={<TeamChat />} />
            <Route path="/admin-chat" element={<AdminInternalChat />} />
            <Route path="/support-chat" element={<SupportChat />} />
            <Route path="/cfo-dashboard" element={<CFODashboard />} />
            <Route path="/leads-dashboard" element={<LeadsDashboard />} />
            <Route path="/cfo-calculators" element={<CFOCalculators />} />
            <Route path="/pro-forma" element={<ProForma />} />
            <Route path="/tech-stack" element={<TechStack />} />
            <Route path="/sales-dashboard" element={<SalesDashboard />} />
            <Route path="/sales/ad-library" element={<SalesAdLibrary />} />
            <Route path="/creator/campaigns" element={<CreatorCampaignBrowser />} />
            <Route path="/creator/campaign-browser" element={<CreatorCampaignBrowser />} />
            <Route path="/sales/create-campaign" element={<CreateMultiChannelCampaign />} />
            <Route path="/integrations/meta-callback" element={<MetaOAuthCallback />} />
            <Route path="/civic/events" element={<CivicEvents />} />
            <Route path="/civic/events/create" element={<CreateCivicEvent />} />
            <Route path="/civic/requests" element={<ConstituentRequests />} />
            <Route path="/civic/blog" element={<CivicBlog />} />
            <Route path="/civic/blog/create" element={<CreateCivicArticle />} />
          <Route path="/civic/contact" element={<PublicConstituentRequestForm />} />
          <Route path="/submit-ticket" element={<PublicTicketSubmission />} />
          <Route path="/lead-form/:userId" element={<FieldLeadCapture />} />
          <Route path="/submit-task" element={<PublicTaskSubmission />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/forms/create" element={<FormBuilder />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/f/:slug" element={<PublicForm />} />
          <Route path="/help/zoom-integration" element={<ZoomIntegration />} />
          <Route path="/docs/zoom-integration" element={<ZoomIntegration />} />
            <Route path="/tickets" element={<ClientTickets />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/proposals/create" element={<CreateProposal />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/creator/campaign-responses" element={<CreatorCampaignResponses />} />
          <Route path="/influencer/profile-settings" element={<InfluencerProfileSettings />} />
          
          {/* Agency Routes */}
          <Route path="/agency/influencer-search" element={<InfluencerSearch />} />
          <Route path="/agency/campaigns" element={<AgencyCampaigns />} />
              <Route path="/:username.portfolio" element={<InfluencerPortfolio />} />
              <Route path="/:username.blog" element={<UserBlog />} />
              <Route path="/:username" element={<MyPagePublic />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </RouteTransition>
          </main>
        </div>
        {user && !location.pathname.includes('/meeting-studio/') && !location.pathname.includes('/studio/') && <SeeksyAIChatWidget />}
        
        <HolidayFeatures />
        </div>
      </SidebarProvider>
    </RoleProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="seeksy-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
