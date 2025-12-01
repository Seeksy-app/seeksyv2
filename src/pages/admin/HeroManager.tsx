import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

export default function HeroManager() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Camera className="h-8 w-8 text-primary" />
          Hero Images
        </h1>
        <p className="text-muted-foreground">
          Generate homepage hero images with Studio, Holiday, and Technology presets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hero Sections</CardTitle>
          <CardDescription>Upload and manage hero images for different pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Homepage Hero</p>
                    <p className="text-sm text-muted-foreground">Main landing page hero section</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dashboard Hero</p>
                    <p className="text-sm text-muted-foreground">Creator dashboard hero section</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Identity Hero</p>
                    <p className="text-sm text-muted-foreground">Identity & Rights hero section</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
