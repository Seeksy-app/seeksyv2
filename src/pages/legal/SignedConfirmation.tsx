import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";

export default function SignedConfirmation() {
  const [searchParams] = useSearchParams();
  const instanceId = searchParams.get("instance");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Document Signed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for signing the document. All parties will receive a copy once everyone has signed.
          </p>
          
          {instanceId && (
            <p className="text-xs text-muted-foreground">
              Reference: {instanceId}
            </p>
          )}

          <Button asChild className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
