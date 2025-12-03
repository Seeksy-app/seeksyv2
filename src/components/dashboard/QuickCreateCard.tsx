import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Upload, Shield, Mic, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickCreateCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          Quick Create
        </CardTitle>
        <CardDescription>Start creating instantly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {/* Create Clip - Pink */}
          <Button 
            onClick={() => navigate("/media/create-clips")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 border-border/60 hover:bg-[hsl(330,80%,97%)] hover:border-[hsl(330,70%,80%)] transition-all"
          >
            <div className="p-2 rounded-full bg-[hsl(330,80%,95%)]">
              <Scissors className="h-5 w-5 text-[hsl(330,70%,50%)]" />
            </div>
            <span className="text-xs font-medium">Create Clip</span>
          </Button>

          {/* Upload Media - Purple */}
          <Button 
            onClick={() => navigate("/media/library")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 border-border/60 hover:bg-[hsl(270,80%,97%)] hover:border-[hsl(270,70%,80%)] transition-all"
          >
            <div className="p-2 rounded-full bg-[hsl(270,80%,95%)]">
              <Upload className="h-5 w-5 text-[hsl(270,70%,50%)]" />
            </div>
            <span className="text-xs font-medium">Upload Media</span>
          </Button>

          {/* Verify Face - Green */}
          <Button 
            onClick={() => navigate("/identity")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 border-border/60 hover:bg-[hsl(142,70%,97%)] hover:border-[hsl(142,60%,80%)] transition-all"
          >
            <div className="p-2 rounded-full bg-[hsl(142,70%,95%)]">
              <Shield className="h-5 w-5 text-[hsl(142,70%,40%)]" />
            </div>
            <span className="text-xs font-medium">Verify Face</span>
          </Button>

          {/* Verify Voice - Blue */}
          <Button 
            onClick={() => navigate("/my-voice-identity")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 border-border/60 hover:bg-[hsl(217,100%,97%)] hover:border-[hsl(217,90%,80%)] transition-all"
          >
            <div className="p-2 rounded-full bg-[hsl(217,90%,95%)]">
              <Mic className="h-5 w-5 text-[hsl(217,90%,50%)]" />
            </div>
            <span className="text-xs font-medium">Verify Voice</span>
          </Button>

          {/* Book with Mia - Teal */}
          <Button 
            onClick={() => navigate("/meetings")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 col-span-2 border-border/60 hover:bg-[hsl(199,90%,97%)] hover:border-[hsl(199,80%,80%)] transition-all"
          >
            <div className="p-2 rounded-full bg-[hsl(199,90%,95%)]">
              <Calendar className="h-5 w-5 text-[hsl(199,80%,45%)]" />
            </div>
            <span className="text-xs font-medium">Book with Mia</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};