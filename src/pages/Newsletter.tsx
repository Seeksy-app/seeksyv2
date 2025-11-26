import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Users, Send, Plus, Eye, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Newsletter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  const { data: subscribers } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("status", "active")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["newsletter-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreateCampaign = async () => {
    if (!campaignTitle || !subject || !htmlContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await supabase
      .from("newsletter_campaigns")
      .insert({
        user_id: user.id,
        title: campaignTitle,
        subject,
        preview_text: previewText,
        html_content: htmlContent,
        status: "draft",
      });

    if (error) {
      toast.error("Failed to create campaign");
      return;
    }

    toast.success("Campaign created successfully");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
    setIsCreateOpen(false);
    setCampaignTitle("");
    setSubject("");
    setPreviewText("");
    setHtmlContent("");
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Send this newsletter to all active subscribers?")) return;

    toast.info("Sending newsletter...");

    const { error } = await supabase.functions.invoke("send-newsletter", {
      body: { campaignId },
    });

    if (error) {
      toast.error("Failed to send newsletter");
      return;
    }

    toast.success("Newsletter sent successfully!");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Delete this campaign?")) return;

    const { error } = await supabase
      .from("newsletter_campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      toast.error("Failed to delete campaign");
      return;
    }

    toast.success("Campaign deleted");
    queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Newsletter</h1>
              <p className="text-muted-foreground">Manage your email newsletter campaigns</p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Newsletter Campaign</DialogTitle>
                <DialogDescription>
                  Create a new email campaign to send to your subscribers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Internal campaign name"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line recipients will see"
                  />
                </div>
                <div>
                  <Label htmlFor="preview">Preview Text</Label>
                  <Input
                    id="preview"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Text shown in inbox preview"
                  />
                </div>
                <div>
                  <Label htmlFor="content">HTML Content</Label>
                  <Textarea
                    id="content"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Email HTML content"
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button onClick={handleCreateCampaign} className="w-full">
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">
              <Mail className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Users className="w-4 h-4 mr-2" />
              Subscribers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {campaigns && campaigns.length > 0 ? (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{campaign.title}</CardTitle>
                          <CardDescription className="mt-1">{campaign.subject}</CardDescription>
                        </div>
                        <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Created {format(new Date(campaign.created_at), "MMM d, yyyy")}
                          </div>
                          {campaign.sent_at && (
                            <div className="flex items-center gap-4">
                              <span>Sent to {campaign.recipient_count} recipients</span>
                              <span>{campaign.opened_count} opens</span>
                              <span>{campaign.clicked_count} clicks</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {campaign.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                  <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                    Create your first campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Subscribers</CardTitle>
                <CardDescription>
                  {subscribers?.length || 0} active subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscribers && subscribers.length > 0 ? (
                  <div className="space-y-2">
                    {subscribers.map((subscriber) => (
                      <div
                        key={subscriber.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{subscriber.name || subscriber.email}</p>
                          {subscriber.name && (
                            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No subscribers yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Newsletter;
