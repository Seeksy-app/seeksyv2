import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Shield, ArrowRight, FileText } from "lucide-react";
import { exportEpisode } from "@/lib/api/podcastStudioAPI";

const ExportEpisode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { episodeId, episodeTitle, tracks, duration, cleanupMethod, adReadEvents } = location.state || {};

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!episodeId) return;

    setIsExporting(true);

    try {
      const { downloadUrls } = await exportEpisode(episodeId, "bundled");
      
      // Simulate download
      console.log("Downloading from:", downloadUrls);
      
      setIsExporting(false);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/episodes/${episodeId}`, {
      state: {
        episodeTitle,
        duration,
        tracks,
        cleanupMethod,
        recordingDate: new Date(),
        adReadEvents: adReadEvents || [],
      },
    });
  };

  const handleCertify = () => {
    // Navigate to Content Certification Flow with full episode metadata
    navigate("/content-certification", {
      state: {
        contentType: "podcast-episode",
        episodeId,
        episodeTitle,
        tracks,
        cleanupMethod,
        recordingDate: new Date(),
        adReadEvents: adReadEvents || [],
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#053877]">
              Export Episode
            </h2>
            <p className="text-sm text-muted-foreground">
              Download your processed audio or certify it on-chain
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="font-semibold text-[#053877]">{episodeTitle}</div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Duration:</span>{" "}
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
              </div>
              <div>
                <span className="font-medium text-foreground">Tracks:</span>{" "}
                {tracks?.length || 0}
              </div>
              <div>
                <span className="font-medium text-foreground">Cleanup:</span>{" "}
                {cleanupMethod}
              </div>
              <div>
                <span className="font-medium text-foreground">Format:</span> WAV
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
            >
              {isExporting ? (
                "Exporting..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Processed Audio
                </>
              )}
            </Button>

            <Button
              onClick={handleViewDetails}
              variant="outline"
              className="w-full h-12 border-[#053877] text-[#053877] hover:bg-[#053877]/5"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Episode Details
            </Button>

            <Button
              onClick={handleCertify}
              variant="outline"
              className="w-full h-12 border-[#2C6BED] text-[#2C6BED] hover:bg-[#2C6BED]/5"
            >
              <Shield className="w-4 h-4 mr-2" />
              Certify This Episode
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Certification creates an on-chain record of authenticity for your episode
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ExportEpisode;
