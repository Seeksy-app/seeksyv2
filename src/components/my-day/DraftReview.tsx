import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function DraftReview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Email Draft Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-center py-6">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No draft emails to review</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/email/drafts">View All Drafts</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
