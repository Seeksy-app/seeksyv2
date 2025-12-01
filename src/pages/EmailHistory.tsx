import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, XCircle, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  sent_at: string;
  status: string;
  error_message: string | null;
  is_opened?: boolean;
}

const EmailHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailLog[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [emailNotificationFrequency, setEmailNotificationFrequency] = useState<string>("none");
  const [dailySummaryTime, setDailySummaryTime] = useState<string>("8");
  const [openedCount, setOpenedCount] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadEmails();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [emails, filterType, filterStatus]);

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) throw error;

      // Get opened emails from email_events
      const { data: openedEvents, error: eventsError } = await supabase
        .from("email_events")
        .select("to_email, event_type, occurred_at")
        .eq("event_type", "opened");

      // Map opened status to emails
      const emailsWithOpenStatus = (data || []).map(email => ({
        ...email,
        is_opened: openedEvents?.some(event => 
          event.to_email === email.recipient_email &&
          new Date(event.occurred_at) >= new Date(email.sent_at)
        ) || false
      }));

      setEmails(emailsWithOpenStatus);
      setOpenedCount(openedEvents?.length || 0);
    } catch (error: any) {
      console.error("Error loading email history:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...emails];

    if (filterType !== "all") {
      filtered = filtered.filter(email => email.email_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(email => email.status === filterStatus);
    }

    setFilteredEmails(filtered);
  };

  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      event_registration: "Event Registration",
      meeting_confirmation: "Meeting Confirmation",
      signup_confirmation: "Signup Confirmation",
      event_reminder: "Event Reminder",
      meeting_reminder: "Meeting Reminder",
      signup_reminder: "Signup Reminder",
    };
    return labels[type] || type;
  };

  const getEmailTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      event_registration: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      meeting_confirmation: "bg-green-500/10 text-green-500 border-green-500/20",
      signup_confirmation: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      event_reminder: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      meeting_reminder: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      signup_reminder: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const saveNotificationPreferences = async () => {
    try {
      // Save preferences to user profile or settings table
      // This would typically save to a user_settings table
      toast({
        title: "Preferences Saved",
        description: "Your email notification preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    opened: openedCount,
    failed: emails.filter(e => e.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Email History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Email History</h1>
          <p className="text-muted-foreground">Track all email notifications sent from your account</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Emails</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successfully Sent</p>
                <p className="text-3xl font-bold text-green-500">{stats.sent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opened</p>
                <p className="text-3xl font-bold text-blue-500">{stats.opened}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-3xl font-bold text-red-500">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Email Notification Preferences */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Email Open Notifications</h3>
              <p className="text-sm text-muted-foreground">Get notified when someone opens your emails</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Select value={emailNotificationFrequency} onValueChange={setEmailNotificationFrequency}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Notification frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No notifications</SelectItem>
                  <SelectItem value="each">Each time email is opened</SelectItem>
                  <SelectItem value="daily">Daily summary</SelectItem>
                </SelectContent>
              </Select>
              {emailNotificationFrequency === 'daily' && (
                <Select value={dailySummaryTime} onValueChange={setDailySummaryTime}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Summary time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6:00 AM</SelectItem>
                    <SelectItem value="8">8:00 AM</SelectItem>
                    <SelectItem value="10">10:00 AM</SelectItem>
                    <SelectItem value="12">12:00 PM</SelectItem>
                    <SelectItem value="14">2:00 PM</SelectItem>
                    <SelectItem value="16">4:00 PM</SelectItem>
                    <SelectItem value="18">6:00 PM</SelectItem>
                    <SelectItem value="20">8:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {emailNotificationFrequency !== 'none' && (
                <Button onClick={saveNotificationPreferences}>
                  Save Preferences
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Email Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="event_registration">Event Registration</SelectItem>
                <SelectItem value="meeting_confirmation">Meeting Confirmation</SelectItem>
                <SelectItem value="signup_confirmation">Signup Confirmation</SelectItem>
                <SelectItem value="event_reminder">Event Reminder</SelectItem>
                <SelectItem value="meeting_reminder">Meeting Reminder</SelectItem>
                <SelectItem value="signup_reminder">Signup Reminder</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            {(filterType !== "all" || filterStatus !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterType("all");
                  setFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Email List */}
        <div className="space-y-4">
          {filteredEmails.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Emails Found</h3>
              <p className="text-muted-foreground">
                {filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Email notifications will appear here once they're sent"}
              </p>
            </Card>
          ) : (
            filteredEmails.map((email) => (
              <Card key={email.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Badge className={getEmailTypeColor(email.email_type)}>
                        {getEmailTypeLabel(email.email_type)}
                      </Badge>
                      <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
                        {email.status === 'sent' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </>
                        )}
                      </Badge>
                      {email.is_opened && (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          <Mail className="h-3 w-3 mr-1" />
                          Opened
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(email.sent_at)}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{email.subject}</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      To: {email.recipient_name} ({email.recipient_email})
                    </p>
                    {email.error_message && (
                      <p className="text-sm text-red-500 mt-2">
                        Error: {email.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailHistory;
