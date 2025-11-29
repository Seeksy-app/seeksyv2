import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Calendar, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HolidayCreatorBannerProps {
  firstName?: string;
}

export const HolidayCreatorBanner = ({ firstName = "Creator" }: HolidayCreatorBannerProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-red-600/20 via-green-600/20 to-red-600/20 border-2 border-red-500/30 relative overflow-hidden">
      {/* Decorative snowflakes */}
      <div className="absolute top-2 right-2 text-white/20 text-4xl">❄️</div>
      <div className="absolute bottom-2 left-2 text-white/20 text-3xl">🎄</div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-red-600 text-white border-0">🎅 Holiday Special</Badge>
        </div>
        
        <h2 className="text-3xl font-black mb-2">
          Ho Ho Ho, <span className="text-red-500">{firstName}</span>! 🎄
        </h2>
        
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
          This season is all about turning your events, podcasts, and meetings into content that works while you sleep.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            onClick={() => navigate("/media/create-clips?template=holiday")}
            className="bg-gradient-to-r from-red-600 to-green-600 hover:opacity-90 text-white font-bold"
          >
            <Video className="h-4 w-4 mr-2" />
            Create a Holiday Clip
          </Button>
          
          <Button
            onClick={() => navigate("/meetings/new")}
            variant="outline"
            className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule a Year-End Meeting
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 backdrop-blur-sm p-3 rounded-lg">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>
            <strong>Not sure where to start?</strong> Ask Spark to build a holiday content plan for your next 3 weeks.
          </span>
        </div>
      </div>
    </Card>
  );
};
