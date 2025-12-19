import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft, Sparkles } from "lucide-react";
import { getModuleById } from "@/utils/routeValidation";

/**
 * Coming Soon page for modules that are not yet available.
 * This prevents "Profile Not Found" errors for valid but unimplemented modules.
 */
export default function ComingSoon() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get module ID from query params
  const searchParams = new URLSearchParams(location.search);
  const moduleId = searchParams.get('module');
  
  // Get module info if available
  const moduleInfo = moduleId ? getModuleById(moduleId) : null;
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {moduleInfo ? moduleInfo.name : 'Coming Soon'}
          </CardTitle>
          <CardDescription className="text-base">
            {moduleInfo 
              ? `${moduleInfo.name} is currently under development and will be available soon.`
              : 'This feature is coming soon. Stay tuned for updates!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {moduleInfo?.description && (
            <p className="text-sm text-muted-foreground">
              {moduleInfo.description}
            </p>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/my-day')} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Go to My Day
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          {moduleInfo?.isNew && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                This is a new feature in active development. Check back soon!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
