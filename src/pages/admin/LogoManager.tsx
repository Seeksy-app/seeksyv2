import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Image } from "lucide-react";

export default function LogoManager() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Logos & Mascots
        </h1>
        <p className="text-muted-foreground">
          Manage logos and Spark mascot variants (holiday, default, seasonal)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Logos</CardTitle>
          <CardDescription>Upload and manage logos for different contexts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Main Logo</p>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Dark Mode Logo</p>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Favicon</p>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
