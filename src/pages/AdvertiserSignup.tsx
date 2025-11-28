import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { AdvertiserSignupSteps } from "@/components/advertiser/AdvertiserSignupSteps";

export default function AdvertiserSignup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Clear any old cached advertiser signup data on mount
  useEffect(() => {
    const cachedData = localStorage.getItem("advertiserSignupData");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // If it contains legacy fields, clear it
        if (parsed.sponsor_name || parsed.sponsor_email || parsed.sponsor_type) {
          console.log("Clearing legacy cached data");
          localStorage.removeItem("advertiserSignupData");
        }
      } catch (e) {
        // Invalid JSON, clear it
        localStorage.removeItem("advertiserSignupData");
      }
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("advertiser_onboarding_completed")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: existingAdvertiser } = useQuery({
    queryKey: ["advertiser-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const signupMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user) throw new Error("Please log in to continue");

      console.log("Mutation received data:", formData);

      // Filter to only include valid advertiser fields
      const validAdvertiserData = {
        user_id: user.id,
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || null,
        website_url: formData.website_url || null,
        business_description: formData.business_description || null,
        campaign_goals: formData.campaign_goals || [],
        target_categories: formData.target_categories || [],
        status: "pending",
      };

      console.log("Inserting advertiser data:", validAdvertiserData);

      // Insert advertiser record with only valid fields
      const { data: advertiserData, error } = await supabase
        .from("advertisers")
        .insert(validAdvertiserData)
        .select()
        .single();

      if (error) {
        console.error("Advertiser insert error:", error);
        throw error;
      }

      console.log("Advertiser created:", advertiserData);

      // Add creator as super_admin team member
      await supabase.from("advertiser_team_members").insert({
        advertiser_id: advertiserData.id,
        user_id: user.id,
        role: "super_admin",
        accepted_at: new Date().toISOString(),
      });

      // Create lead in contacts table
      try {
        const { error: contactError } = await supabase
          .from("contacts")
          .insert({
            name: formData.contact_name,
            email: formData.contact_email,
            phone: formData.contact_phone || null,
            company: formData.company_name,
            title: null,
            lead_source: "advertiser_signup",
            lead_status: "new",
            notes: `Business Description: ${formData.business_description || "N/A"}\nWebsite: ${formData.website_url || "N/A"}\nCampaign Goals: ${formData.campaign_goals.join(", ")}\nTarget Categories: ${formData.target_categories.join(", ")}`,
          });

        if (contactError) {
          console.error("Failed to create lead:", contactError);
        }

        // Notify sales team
        await supabase.functions.invoke('notify-sales-team-lead', {
          body: {
            contactId: advertiserData.id,
            leadSource: 'Advertiser Signup',
          },
        });
      } catch (leadError) {
        console.error('Lead creation failed:', leadError);
      }
    },
    onSuccess: async () => {
      toast.success("Application submitted! We'll review it and get back to you soon.");
      queryClient.invalidateQueries({ queryKey: ["advertiser-status", user?.id] });
    },
    onError: (error: any) => {
      toast.error("Failed to submit application: " + error.message);
    },
  });

  // Auto-submit advertiser data if user just signed up
  useEffect(() => {
    if (user && !existingAdvertiser) {
      const advertiserData = localStorage.getItem("advertiserSignupData");
      if (advertiserData) {
        try {
          const data = JSON.parse(advertiserData);
          // Clear the data immediately to prevent re-submission
          localStorage.removeItem("advertiserSignupData");
          
          // Filter out any legacy fields (like sponsor_name) that might be cached
          const cleanData = {
            company_name: data.company_name,
            contact_name: data.contact_name,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            website_url: data.website_url,
            business_description: data.business_description,
            campaign_goals: data.campaign_goals || [],
            target_categories: data.target_categories || [],
            team_members: data.team_members || [],
          };
          
          // Submit the cleaned advertiser application
          signupMutation.mutate(cleanData);
        } catch (e) {
          console.error("Failed to process advertiser data:", e);
        }
      }
    }
  }, [user, existingAdvertiser]);

  const handleComplete = (formData: any) => {
    if (!user) {
      toast.error("Please create an account first to continue");
      // Clean the data before storing
      const cleanData = {
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website_url: formData.website_url,
        business_description: formData.business_description,
        campaign_goals: formData.campaign_goals || [],
        target_categories: formData.target_categories || [],
        team_members: formData.team_members || [],
      };
      localStorage.setItem("advertiserSignupData", JSON.stringify(cleanData));
      localStorage.setItem("signupIntent", "/advertiser/signup");
      navigate("/auth?mode=signup");
      return;
    }

    // Clean the data before submitting
    const cleanData = {
      company_name: formData.company_name,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
      website_url: formData.website_url,
      business_description: formData.business_description,
      campaign_goals: formData.campaign_goals || [],
      target_categories: formData.target_categories || [],
      team_members: formData.team_members || [],
    };

    console.log("Submitting cleaned data:", cleanData);
    signupMutation.mutate(cleanData);
  };

  if (existingAdvertiser && profile?.advertiser_onboarding_completed !== false) {
    // Redirect approved advertisers to dashboard (unless they explicitly reset onboarding)
    if (existingAdvertiser.status === "approved") {
      navigate("/advertiser/dashboard");
      return null;
    }

    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {existingAdvertiser.status === "pending" ? (
                <Building2 className="h-16 w-16 text-yellow-500" />
              ) : existingAdvertiser.status === "rejected" ? (
                <Building2 className="h-16 w-16 text-red-500" />
              ) : (
                <Building2 className="h-16 w-16 text-gray-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {existingAdvertiser.status === "pending" && "Application Under Review"}
              {existingAdvertiser.status === "rejected" && "Application Not Approved"}
              {existingAdvertiser.status === "suspended" && "Account Suspended"}
            </CardTitle>
            <CardDescription>
              {existingAdvertiser.status === "pending" && (
                "We're reviewing your application. You'll receive an email once it's processed."
              )}
              {existingAdvertiser.status === "rejected" && existingAdvertiser.rejection_reason && (
                `Reason: ${existingAdvertiser.rejection_reason}`
              )}
              {existingAdvertiser.status === "suspended" && (
                "Please contact support for more information."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Become an Advertiser</h1>
        <p className="text-muted-foreground">
          Reach engaged podcast audiences with targeted advertising
        </p>
        {!user && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  localStorage.setItem("signupIntent", "/advertiser/signup");
                  navigate("/auth?mode=login");
                }}
              >
                Log in here
              </Button>
            </p>
          </div>
        )}
      </div>

      <AdvertiserSignupSteps 
        onComplete={handleComplete}
        isSubmitting={signupMutation.isPending}
      />
    </div>
  );
}
