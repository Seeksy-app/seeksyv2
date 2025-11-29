import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateShotstackClipParams {
  clipId: string;
  cloudflareDownloadUrl: string;
  start?: number;
  length: number;
  orientation?: 'vertical' | 'horizontal';
}

export const useShotstackClips = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const submitShotstackRender = async (params: CreateShotstackClipParams) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-shotstack-render', {
        body: params,
      });

      if (error) throw error;

      toast({
        title: "Clip render started",
        description: "Your clip is being processed by Shotstack. You'll be notified when it's ready.",
      });

      return data;
    } catch (error) {
      console.error("Shotstack render submission error:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Render failed",
        description: `${errorMessage}. Please try again or contact support.`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const getClipStatus = async (clipId: string) => {
    const { data, error } = await supabase
      .from("clips")
      .select("id, status, shotstack_status, vertical_url, thumbnail_url, error_message")
      .eq("id", clipId)
      .single();

    if (error) throw error;
    return data;
  };

  const pollClipStatus = async (
    clipId: string,
    onStatusChange?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<any> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;

        try {
          const clip = await getClipStatus(clipId);

          if (onStatusChange) {
            onStatusChange(clip.status);
          }

          // Check if render is complete
          if (clip.status === "ready" && clip.vertical_url) {
            clearInterval(interval);
            resolve(clip);
            return;
          }

          // Check if render failed
          if (clip.status === "failed") {
            clearInterval(interval);
            reject(new Error(clip.error_message || "Render failed"));
            return;
          }

          // Check if max attempts reached
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error("Polling timeout - render is taking longer than expected"));
            return;
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, intervalMs);
    });
  };

  return {
    submitShotstackRender,
    getClipStatus,
    pollClipStatus,
    isProcessing,
  };
};
