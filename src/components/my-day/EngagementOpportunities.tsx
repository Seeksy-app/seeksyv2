import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkIcon } from "@/components/spark/SparkIcon";

export function EngagementOpportunities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top Engagement Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <SparkIcon size={32} />
            <div className="flex-1">
              <p className="text-sm font-medium">Let Spark analyze your contacts</p>
              <p className="text-xs text-muted-foreground">Find who to reach out to today</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask Spark for Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
