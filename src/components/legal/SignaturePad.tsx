import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  title: string;
  onSign: (signatureDataUrl: string) => void;
  existingSignature?: string;
  disabled?: boolean;
}

export function SignaturePad({ title, onSign, existingSignature, disabled }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL("image/png");
      onSign(dataUrl);
    }
  };

  if (existingSignature) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            {title} - Signed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-2 bg-muted/30">
            <img 
              src={existingSignature} 
              alt="Signature" 
              className="max-h-24 mx-auto"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (disabled) {
    return (
      <Card className="opacity-60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-muted/30 text-center text-muted-foreground text-sm">
            Awaiting previous signature
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border rounded-md bg-white">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: "w-full h-32",
              style: { width: "100%", height: "128px" }
            }}
            onEnd={() => setHasDrawn(true)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClear}
            disabled={!hasDrawn}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasDrawn}
          >
            <Check className="h-4 w-4 mr-1" />
            Apply Signature
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          By signing, you agree to the terms of this agreement.
        </p>
      </CardContent>
    </Card>
  );
}