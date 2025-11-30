import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ExternalLink, Shield, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FaceIdentityAsset {
  id: string;
  cert_status: string;
  face_hash: string | null;
  cert_explorer_url: string | null;
  cert_tx_hash: string | null;
}

interface FaceIdentitySectionProps {
  asset: FaceIdentityAsset | undefined;
}

export function FaceIdentitySection({ asset }: FaceIdentitySectionProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const status = asset?.cert_status || "not_set";

  const statusConfig = {
    not_set: {
      color: "bg-muted text-muted-foreground",
      label: "Not set",
    },
    pending: {
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      label: "Verification in progress",
    },
    minting: {
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      label: "Certifying…",
    },
    minted: {
      color: "bg-green-500/10 text-green-600 border-green-200",
      label: "Verified",
    },
    failed: {
      color: "bg-red-500/10 text-red-600 border-red-200",
      label: "Verification failed",
    },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_set;

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const readers = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((images) => {
      setSelectedImages((prev) => [...prev, ...images].slice(0, 5)); // Max 5 images
    });
  }, []);

  const handleStartVerification = async () => {
    if (selectedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { images: selectedImages },
      });

      if (error) throw error;

      if (data.status === "verified") {
        toast.success("Face identity verified successfully!");
        queryClient.invalidateQueries({ queryKey: ["identity-assets"] });
        setIsDialogOpen(false);
        setSelectedImages([]);
      } else if (data.status === "failed") {
        toast.error(data.message || "Face verification failed");
      }
    } catch (error) {
      console.error("Face verification error:", error);
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Face Identity</h4>
                <Badge variant="outline" className={currentStatus.color}>
                  {currentStatus.label}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Create a blockchain-verified face identity to protect your likeness.
          </p>

          {status === "not_set" || status === "failed" ? (
            <Button 
              className="w-full" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              {status === "failed" ? "Retry Face Verification" : "Start Face Verification"}
            </Button>
          ) : status === "pending" || status === "minting" ? (
            <Button className="w-full" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verification in progress…
            </Button>
          ) : status === "minted" ? (
            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.open(`/certificate/${asset.id}`, "_blank")}
              >
                <Shield className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
              {asset.cert_explorer_url && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open(asset.cert_explorer_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Polygon
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Face Identity Verification</DialogTitle>
            <DialogDescription>
              Upload 3–5 photos or record a short selfie video to create your blockchain-verified face identity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Confirm your real identity and protect how your face is used.</p>
              <p className="text-sm text-muted-foreground">
                Upload a few clear photos and we'll generate a secure FaceHash—your cryptographic identity signature stored on the blockchain.
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-3">
                <p className="text-sm font-medium">Upload Instructions</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Upload 3–5 photos</li>
                  <li>• Face forward and well lit</li>
                  <li>• No filters or heavy editing</li>
                  <li>• Include at least one neutral expression</li>
                </ul>
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" asChild>
                  <label>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                </Button>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Selected Images ({selectedImages.length}/5)
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={img} alt={`Face ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  We'll use these images to generate a secure, private face signature.
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleStartVerification}
              disabled={isVerifying || selectedImages.length === 0}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Start Face Verification"
              )}
            </Button>

            {isVerifying && (
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Verifying your photos…</p>
                <p className="text-xs text-muted-foreground">
                  We're creating your encrypted FaceHash and preparing your certificate.
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Identity Promise</p>
              <p className="text-xs text-muted-foreground">
                We never sell or share your likeness without explicit permission. 
                You control how your real face and AI clones can be used.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}