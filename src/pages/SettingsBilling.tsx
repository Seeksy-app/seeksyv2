import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function SettingsBilling() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Credits & Billing</h1>
          <p className="text-muted-foreground">
            Manage your credits and billing information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Credits Dashboard
            </CardTitle>
            <CardDescription>
              Your credit balance powers emails, AI, verifications, and media tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Credits Dashboard Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're building a comprehensive credits management system. You'll soon be able to:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground max-w-md mx-auto text-left">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>View detailed credit usage history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Purchase additional credits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Set up auto-reload when credits run low</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Track spending across different features</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
