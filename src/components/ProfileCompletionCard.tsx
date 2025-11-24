import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, User, Phone, ImageIcon, Layout, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { MyPageWelcomeDialog } from "./MyPageWelcomeDialog";

interface ProfileCompletionCardProps {
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  bio: string | null;
}

export const ProfileCompletionCard = ({ fullName, phone, avatarUrl, bio }: ProfileCompletionCardProps) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("profileCompletionDismissed") === "true";
  });
  const [showMyPageWelcome, setShowMyPageWelcome] = useState(false);

  const fields = [
    { name: "Full Name", value: fullName, icon: User, page: "settings", fieldId: "full_name" },
    { name: "Phone Number", value: phone, icon: Phone, page: "settings", fieldId: "phone" },
    { name: "Profile Picture", value: avatarUrl, icon: ImageIcon, page: "settings", fieldId: "avatar" },
    { name: "Create My Page", value: bio, icon: Layout, page: "settings", fieldId: "bio", isMyPage: true },
  ];

  // More robust check: consider field complete if it has a truthy value with actual content
  const completedFields = fields.filter(field => {
    if (!field.value) return false;
    const stringValue = String(field.value).trim();
    return stringValue.length > 0 && stringValue !== "undefined" && stringValue !== "null";
  });
  const completionPercentage = Math.round((completedFields.length / fields.length) * 100);
  const isComplete = completionPercentage === 100;

  // Clear dismissal if profile becomes complete
  if (isComplete && localStorage.getItem("profileCompletionDismissed") === "true") {
    localStorage.removeItem("profileCompletionDismissed");
  }

  const handleDismiss = () => {
    localStorage.setItem("profileCompletionDismissed", "true");
    setIsDismissed(true);
  };

  // Hide if dismissed or complete
  if (isDismissed || isComplete) {
    return null;
  }

  return (
    <>
      <MyPageWelcomeDialog 
        open={showMyPageWelcome} 
        onClose={() => setShowMyPageWelcome(false)} 
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                {completionPercentage}% complete • {fields.length - completedFields.length} field{fields.length - completedFields.length !== 1 ? 's' : ''} remaining
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionPercentage} className="h-2" />
        
        <div className="space-y-3">
          {fields.map((field) => {
            const Icon = field.icon;
            const isCompleted = field.value && String(field.value).trim().length > 0 && String(field.value).trim() !== "undefined" && String(field.value).trim() !== "null";
            
            return (
              <div
                key={field.name}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className={isCompleted ? "text-muted-foreground line-through" : ""}>
                    {field.name}
                  </span>
                </div>
                {!isCompleted && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Show welcome dialog for My Page
                      if (field.isMyPage) {
                        setShowMyPageWelcome(true);
                        navigate(`/${field.page}`);
                      } else if (field.fieldId) {
                        // Navigate with hash to scroll to field
                        navigate(`/${field.page}#${field.fieldId}`);
                      } else {
                        navigate(`/${field.page}`);
                      }
                    }}
                    className="text-foreground hover:bg-accent"
                  >
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    </>
  );
};
