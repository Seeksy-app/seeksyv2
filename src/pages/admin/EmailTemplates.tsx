import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Edit, History, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmailTemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_name");

      if (error) throw error;
      return data as Array<{
        id: string;
        template_key: string;
        template_name: string;
        description: string | null;
        variables: Record<string, any> | null;
        is_active: boolean;
        version: string | null;
        created_at: string;
        updated_at: string;
      }>;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template status updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  const renderPreview = async (template: any) => {
    try {
      // Generate sample variables for preview
      const sampleVariables: Record<string, any> = {
        name: "John Doe",
        code: "123456",
        resetLink: "https://seeksy.io/reset-password?token=sample",
        hostName: "Jane Smith",
        meetingTitle: "Product Demo",
        date: "December 15, 2024",
        time: "2:00 PM EST",
        meetingLink: "https://seeksy.io/meeting/sample",
        eventName: "Creator Summit 2024",
        location: "Virtual Event",
        addToCalendarLink: "https://seeksy.io/calendar/add",
        episodeTitle: "Episode 42: The Future of AI",
        showName: "Tech Talks",
        episodeLink: "https://seeksy.io/podcast/episode/42",
        sessionTitle: "Morning Podcast Recording",
        downloadLink: "https://seeksy.io/download/sample",
        clipsLink: "https://seeksy.io/clips/sample",
        subscriberEmail: "subscriber@example.com",
        preferencesLink: "https://seeksy.io/preferences",
        subject: "Welcome to Our Community",
        body: "<p>This is a sample campaign email body with <strong>rich formatting</strong>.</p>",
        ctaText: "Get Started",
        ctaLink: "https://seeksy.io/get-started",
        type: "Face",
        certificateUrl: "https://seeksy.io/certificate/sample",
      };

      const { data, error } = await supabase.functions.invoke("render-email-template", {
        body: {
          templateKey: template.template_key,
          variables: sampleVariables,
          recipientEmail: "preview@seeksy.io",
        },
      });

      if (error) throw error;

      setSelectedTemplate({ ...template, renderedHtml: data.html });
    } catch (error: any) {
      toast.error(error.message || "Failed to render preview");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground mt-2">
          Manage and preview all email templates used across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.template_key}
                  </CardDescription>
                </div>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Variables:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.variables && Object.keys(template.variables).map((key: string) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) =>
                      toggleActive.mutate({ id: template.id, isActive: checked })
                    }
                  />
                  <Label className="text-sm">Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => renderPreview(template)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <History className="h-4 w-4" />
                </Button>
              </div>

              {template.version && (
                <div className="text-xs text-muted-foreground">
                  Version {template.version}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTemplate?.template_name}</span>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-normal">Theme:</Label>
                <Button
                  variant={previewMode === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("light")}
                >
                  Light
                </Button>
                <Button
                  variant={previewMode === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("dark")}
                >
                  Dark
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Preview of {selectedTemplate?.template_key}
            </DialogDescription>
          </DialogHeader>

          <div
            className={`border rounded-lg p-4 ${
              previewMode === "dark" ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            {selectedTemplate?.renderedHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: selectedTemplate.renderedHtml }}
                className="max-w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
