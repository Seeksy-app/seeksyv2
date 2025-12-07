import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, Settings, Download, Activity, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SignatureEditor } from "@/components/signatures/SignatureEditor";
import { SignatureList } from "@/components/signatures/SignatureList";
import { SignatureAnalytics } from "@/components/signatures/SignatureAnalytics";
import { SignatureSettings } from "@/components/signatures/SignatureSettings";
import { SignatureActivityLog } from "@/components/signatures/SignatureActivityLog";

export default function SignatureBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analytics");
  const [signatures, setSignatures] = useState<any[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("email_signatures")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error("Error fetching signatures:", error);
      toast({
        title: "Error",
        description: "Failed to load signatures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSignature = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_signatures")
        .insert({
          user_id: user.id,
          name: `Signature ${signatures.length + 1}`,
          profile_name: user.user_metadata?.full_name || "",
          blocks: [
            { type: "profile", enabled: true, order: 0 },
            { type: "company", enabled: true, order: 1 },
            { type: "social", enabled: true, order: 2 },
            { type: "banner", enabled: false, order: 3 },
          ],
        })
        .select()
        .single();

      if (error) throw error;

      setSignatures([data, ...signatures]);
      setSelectedSignature(data);
      setActiveTab("editor");
      
      toast({
        title: "Signature created",
        description: "Start customizing your new signature",
      });
    } catch (error) {
      console.error("Error creating signature:", error);
      toast({
        title: "Error",
        description: "Failed to create signature",
        variant: "destructive",
      });
    }
  };

  const handleSignatureSelect = (signature: any) => {
    setSelectedSignature(signature);
    setActiveTab("editor");
  };

  const handleSignatureUpdate = async (updatedSignature: any) => {
    setSignatures(signatures.map(s => 
      s.id === updatedSignature.id ? updatedSignature : s
    ));
    setSelectedSignature(updatedSignature);
  };

  const handleSignatureDelete = async (signatureId: string) => {
    try {
      const { error } = await supabase
        .from("email_signatures")
        .delete()
        .eq("id", signatureId);

      if (error) throw error;

      setSignatures(signatures.filter(s => s.id !== signatureId));
      if (selectedSignature?.id === signatureId) {
        setSelectedSignature(null);
        setActiveTab("signatures");
      }

      toast({
        title: "Signature deleted",
        description: "The signature has been removed",
      });
    } catch (error) {
      console.error("Error deleting signature:", error);
      toast({
        title: "Error",
        description: "Failed to delete signature",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Signatures & Tracking</h1>
            <p className="text-muted-foreground">
              Create trackable signatures for Gmail with analytics
            </p>
          </div>
          <Button onClick={createNewSignature} className="gap-2">
            <Plus className="h-4 w-4" />
            New Signature
          </Button>
        </div>

        {/* Tabs for management */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Log
            </TabsTrigger>
            <TabsTrigger value="signatures" className="gap-2">
              <Mail className="h-4 w-4" />
              Signatures
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2" disabled={!selectedSignature}>
              <Settings className="h-4 w-4" />
              Edit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signatures">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : signatures.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No signatures yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first trackable email signature
                  </p>
                  <Button onClick={createNewSignature} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Signature
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <SignatureList 
                signatures={signatures}
                onSelect={handleSignatureSelect}
                onDelete={handleSignatureDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="editor">
            {selectedSignature ? (
              <SignatureEditor 
                signature={selectedSignature}
                onUpdate={handleSignatureUpdate}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <p className="text-muted-foreground">Select a signature to edit</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <SignatureAnalytics signatures={signatures} />
          </TabsContent>

          <TabsContent value="activity">
            <SignatureActivityLog signatures={signatures} />
          </TabsContent>

          <TabsContent value="settings">
            <SignatureSettings signatures={signatures} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
