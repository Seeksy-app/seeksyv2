import EmailHome from "@/pages/EmailHome";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminEmailClient() {
  usePageTitle("Admin Inbox");
  
  // Reuse the full EmailHome component for admin email client
  // This ensures admin has access to the complete email functionality
  return <EmailHome />;
}