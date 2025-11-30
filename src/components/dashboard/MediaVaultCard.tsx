import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Image, Music, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MediaVaultCard = () => {
  const navigate = useNavigate();

  const { data: recentMedia } = useQuery({
    queryKey: ['recent-media'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('media_files')
        .select('id, file_name, file_type, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(4);

      return data || [];
    },
  });

  const getMediaIcon = (type: string) => {
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    if (type.includes('audio')) return <Music className="h-4 w-4" />;
    if (type.includes('image')) return <Image className="h-4 w-4" />;
    return <Folder className="h-4 w-4" />;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          <CardTitle>Media Vault</CardTitle>
        </div>
        <CardDescription>Recent uploads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentMedia && recentMedia.length > 0 ? (
          <div className="space-y-2">
            {recentMedia.map((media) => (
              <div 
                key={media.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  {getMediaIcon(media.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{media.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(media.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No media yet</p>
          </div>
        )}

        <Button 
          onClick={() => navigate("/media/library")}
          className="w-full"
          variant="outline"
        >
          Open Media Vault
        </Button>
      </CardContent>
    </Card>
  );
};
