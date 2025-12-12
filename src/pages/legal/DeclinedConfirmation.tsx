import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, Mail } from "lucide-react";

export default function DeclinedConfirmation() {
  const [searchParams] = useSearchParams();
  const instanceId = searchParams.get("instance");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Document Declined</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You have declined to sign this document. The sender has been notified.
          </p>
          
          <p className="text-sm text-muted-foreground">
            If you have questions or would like to discuss the document, please contact us.
          </p>

          {instanceId && (
            <p className="text-xs text-muted-foreground">
              Reference: {instanceId}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <a href="mailto:legal@seeksy.io">
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </a>
            </Button>
            
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
