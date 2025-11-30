import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClipData {
  id: string;
  cert_status: string;
  created_at: string;
}

export const CertifiedClipsCard = () => {
  const navigate = useNavigate();

  const { data: clips } = useQuery<ClipData[]>({
    queryKey: ['certified-clips'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('clips')
        .select('id, cert_status, created_at')
        .eq('user_id', user.id)
        .eq('cert_status', 'minted')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return (data || []) as ClipData[];
    },
  });

  const certifiedCount = clips?.length || 0;
  const hasClips = certifiedCount > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Certified Clips</CardTitle>
        </div>
        <CardDescription>Blockchain-verified content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-6">
          <div className="text-4xl font-black text-primary mb-2">
            {certifiedCount}
          </div>
          <p className="text-sm text-muted-foreground">
            {hasClips ? 'certified clips' : 'No clips yet'}
          </p>
        </div>

        <Button 
          onClick={() => navigate(hasClips ? "/clips" : "/media/create-clips")}
          className="w-full"
        >
          <Scissors className="h-4 w-4 mr-2" />
          {hasClips ? "Manage Clips" : "Create Your First Clip"}
        </Button>
      </CardContent>
    </Card>
  );
};
