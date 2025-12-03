import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface IdentityWidgetProps {
  faceVerified?: boolean;
  voiceVerified?: boolean;
}

export function IdentityWidget({ faceVerified = false, voiceVerified = false }: IdentityWidgetProps) {
  const navigate = useNavigate();
  
  const isFullyVerified = faceVerified && voiceVerified;
  const isPartiallyVerified = faceVerified || voiceVerified;

  const status = isFullyVerified ? "verified" : isPartiallyVerified ? "partial" : "unverified";
  
  const statusConfig = {
    verified: {
      label: "Fully Verified",
      bgColor: "bg-[hsl(142,70%,96%)]",
      borderColor: "border-[hsl(142,60%,85%)]",
      textColor: "text-[hsl(142,70%,35%)]",
      iconBg: "bg-[hsl(142,70%,92%)]",
      icon: CheckCircle,
    },
    partial: {
      label: "Partially Verified",
      bgColor: "bg-[hsl(45,100%,96%)]",
      borderColor: "border-[hsl(45,90%,80%)]",
      textColor: "text-[hsl(45,90%,35%)]",
      iconBg: "bg-[hsl(45,90%,90%)]",
      icon: AlertCircle,
    },
    unverified: {
      label: "Not Verified",
      bgColor: "bg-muted/30",
      borderColor: "border-border/50",
      textColor: "text-muted-foreground",
      iconBg: "bg-muted",
      icon: Shield,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className={`shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${config.bgColor} ${config.borderColor}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${config.iconBg}`}>
                <Shield className={`h-4 w-4 ${config.textColor}`} />
              </div>
              <span className="font-semibold text-sm">Identity Verification</span>
            </div>
            <Badge variant="secondary" className={`text-[10px] ${config.textColor}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`p-2 rounded-lg ${faceVerified ? 'bg-[hsl(142,70%,94%)]' : 'bg-background/50'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {faceVerified ? (
                  <CheckCircle className="h-3 w-3 text-[hsl(142,70%,40%)]" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                )}
                <span className="text-xs font-medium">Face</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {faceVerified ? "Verified on-chain" : "Not verified"}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${voiceVerified ? 'bg-[hsl(142,70%,94%)]' : 'bg-background/50'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {voiceVerified ? (
                  <CheckCircle className="h-3 w-3 text-[hsl(142,70%,40%)]" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                )}
                <span className="text-xs font-medium">Voice</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {voiceVerified ? "Verified on-chain" : "Not verified"}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => navigate("/identity")}
          >
            {isFullyVerified ? "View Certificates" : "Complete Verification"}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}