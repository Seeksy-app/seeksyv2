import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock } from "lucide-react";

export default function Permissions() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">Manage user permissions and access controls</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Coming Soon
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Permission Management
          </CardTitle>
          <CardDescription>
            Advanced permission controls for managing user access across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This feature is currently under development.</p>
            <p className="text-sm mt-2">Check back soon for granular permission controls.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}