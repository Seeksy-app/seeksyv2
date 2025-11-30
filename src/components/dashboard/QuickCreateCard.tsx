import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Upload, Shield, Mic, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickCreateCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Quick Create</CardTitle>
        <CardDescription>Start creating instantly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => navigate("/media/create-clips")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
          >
            <Scissors className="h-5 w-5" />
            <span className="text-xs">Create Clip</span>
          </Button>

          <Button 
            onClick={() => navigate("/media/library")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">Upload Media</span>
          </Button>

          <Button 
            onClick={() => navigate("/identity")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs">Verify Face</span>
          </Button>

          <Button 
            onClick={() => navigate("/my-voice-identity")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
          >
            <Mic className="h-5 w-5" />
            <span className="text-xs">Verify Voice</span>
          </Button>

          <Button 
            onClick={() => navigate("/meetings")}
            variant="outline"
            className="h-auto flex-col gap-2 py-4 col-span-2"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Book with Mia</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
