import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Save, Send, CheckCircle, Download, FileDown, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FieldValues {
  purchaser_name?: string;
  input_mode?: "amount" | "shares";
  purchase_amount?: number;
  number_of_shares?: number;
}

interface ComputedValues {
  price_per_share?: number;
  rounding_mode?: "whole_share" | "two_decimals";
  min_investment_amount?: number;
  min_shares?: number;
  computed_purchase_amount?: number;
  computed_number_of_shares?: number;
}

interface LegalDocFormProps {
  fieldValues: FieldValues;
  computedValues: ComputedValues;
  isAdmin: boolean;
  status: string;
  onFieldChange: (field: keyof FieldValues, value: any) => void;
  onComputedChange: (field: keyof ComputedValues, value: any) => void;
  onSaveDraft: () => void;
  onSubmitForReview: () => void;
  onFinalize?: () => void;
  onExport?: (format: 'pdf' | 'docx') => void;
  isSaving?: boolean;
}

export function LegalDocForm({
  fieldValues,
  computedValues,
  isAdmin,
  status,
  onFieldChange,
  onComputedChange,
  onSaveDraft,
  onSubmitForReview,
  onFinalize,
  onExport,
  isSaving,
}: LegalDocFormProps) {
  const [localAmount, setLocalAmount] = useState<string>(
    fieldValues.purchase_amount?.toString() || ""
  );
  const [localShares, setLocalShares] = useState<string>(
    fieldValues.number_of_shares?.toString() || ""
  );

  const inputMode = fieldValues.input_mode || "amount";
  const pricePerShare = computedValues.price_per_share || 0;
  const roundingMode = computedValues.rounding_mode || "whole_share";

  // Calculate dependent field
  const calculateShares = useCallback((amount: number): number => {
    if (!pricePerShare || pricePerShare <= 0) return 0;
    const shares = amount / pricePerShare;
    return roundingMode === "whole_share" ? Math.floor(shares) : Math.round(shares * 100) / 100;
  }, [pricePerShare, roundingMode]);

  const calculateAmount = useCallback((shares: number): number => {
    return shares * pricePerShare;
  }, [pricePerShare]);

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onFieldChange("purchase_amount", numValue);
      const calculatedShares = calculateShares(numValue);
      onComputedChange("computed_number_of_shares", calculatedShares);
      setLocalShares(calculatedShares.toString());
    }
  };

  // Handle shares change
  const handleSharesChange = (value: string) => {
    setLocalShares(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onFieldChange("number_of_shares", numValue);
      const calculatedAmount = calculateAmount(numValue);
      onComputedChange("computed_purchase_amount", calculatedAmount);
      setLocalAmount(calculatedAmount.toFixed(2));
    }
  };

  // Reset computed fields when mode changes
  useEffect(() => {
    if (inputMode === "amount" && localAmount) {
      const numValue = parseFloat(localAmount);
      if (!isNaN(numValue) && numValue > 0) {
        const calculatedShares = calculateShares(numValue);
        onComputedChange("computed_number_of_shares", calculatedShares);
        setLocalShares(calculatedShares.toString());
      }
    } else if (inputMode === "shares" && localShares) {
      const numValue = parseFloat(localShares);
      if (!isNaN(numValue) && numValue > 0) {
        const calculatedAmount = calculateAmount(numValue);
        onComputedChange("computed_purchase_amount", calculatedAmount);
        setLocalAmount(calculatedAmount.toFixed(2));
      }
    }
  }, [inputMode, pricePerShare, roundingMode]);

  const isFinalized = status === "finalized";
  const isSubmitted = status === "submitted" || status === "admin_review";
  const canEdit = !isFinalized && (isAdmin || status === "draft");
  const canExport = isFinalized || (isAdmin && isSubmitted);

  return (
    <div className="space-y-6 p-6">
      {/* Finalized Lock Alert */}
      {isFinalized && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This agreement has been finalized and is now read-only. You can export the final document.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Investment Details</h2>
        <Badge variant={
          status === "draft" ? "secondary" :
          status === "submitted" ? "default" :
          status === "admin_review" ? "outline" :
          "default"
        }>
          {status === "draft" && "Draft"}
          {status === "submitted" && "Submitted"}
          {status === "admin_review" && "Under Review"}
          {status === "finalized" && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Finalized
            </span>
          )}
        </Badge>
      </div>

      {/* Purchaser Info Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchaser Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purchaser_name">Purchaser Name</Label>
            <Input
              id="purchaser_name"
              value={fieldValues.purchaser_name || ""}
              onChange={(e) => onFieldChange("purchaser_name", e.target.value)}
              placeholder="Enter full legal name"
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Investment Details Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Investment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Per Share - Read-only for purchasers */}
          <div className="space-y-2">
            <Label htmlFor="price_per_share" className="flex items-center gap-2">
              Price Per Share
              {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price_per_share"
                type="number"
                step="0.01"
                value={computedValues.price_per_share || ""}
                onChange={(e) => onComputedChange("price_per_share", parseFloat(e.target.value))}
                className="pl-7"
                disabled={!isAdmin || isFinalized}
              />
            </div>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Price per share is set by the Company and cannot be changed.
              </p>
            )}
          </div>

          {/* Admin: Rounding Mode */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Rounding Mode</Label>
              <RadioGroup
                value={roundingMode}
                onValueChange={(value) => onComputedChange("rounding_mode", value)}
                className="flex gap-4"
                disabled={isFinalized}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whole_share" id="whole_share" />
                  <Label htmlFor="whole_share" className="font-normal">Whole Shares</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="two_decimals" id="two_decimals" />
                  <Label htmlFor="two_decimals" className="font-normal">2 Decimals</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="space-y-2">
            <Label>I want to enter</Label>
            <RadioGroup
              value={inputMode}
              onValueChange={(value) => onFieldChange("input_mode", value)}
              className="flex gap-4"
              disabled={!canEdit}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="amount_mode" />
                <Label htmlFor="amount_mode" className="font-normal">Investment Amount ($)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shares" id="shares_mode" />
                <Label htmlFor="shares_mode" className="font-normal">Number of Shares</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="purchase_amount" className="flex items-center gap-2">
              Investment Amount
              {inputMode === "shares" && <span className="text-xs text-muted-foreground">(calculated)</span>}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="purchase_amount"
                type="number"
                step="0.01"
                min="0"
                value={localAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-7"
                disabled={!canEdit || inputMode === "shares"}
              />
            </div>
          </div>

          {/* Shares Field */}
          <div className="space-y-2">
            <Label htmlFor="number_of_shares" className="flex items-center gap-2">
              Number of Shares
              {inputMode === "amount" && <span className="text-xs text-muted-foreground">(calculated)</span>}
            </Label>
            <Input
              id="number_of_shares"
              type="number"
              step={roundingMode === "whole_share" ? "1" : "0.01"}
              min="0"
              value={localShares}
              onChange={(e) => handleSharesChange(e.target.value)}
              disabled={!canEdit || inputMode === "amount"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canEdit && !isAdmin && (
          <>
            <Button onClick={onSaveDraft} variant="outline" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={onSubmitForReview} disabled={isSaving}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Admin Review
            </Button>
          </>
        )}
        
        {isAdmin && !isFinalized && (
          <>
            <Button onClick={onSaveDraft} variant="outline" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            {onFinalize && (
              <Button onClick={onFinalize} disabled={isSaving}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalize Agreement
              </Button>
            )}
          </>
        )}

        {/* Export buttons when finalized or for admin during review */}
        {onExport && canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Document
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('docx')}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
