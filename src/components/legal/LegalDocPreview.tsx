import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FieldValues {
  purchaser_name?: string;
  purchase_amount?: number;
  number_of_shares?: number;
}

interface ComputedValues {
  price_per_share?: number;
  computed_purchase_amount?: number;
  computed_number_of_shares?: number;
}

interface LegalDocPreviewProps {
  bodyText: string;
  fieldValues: FieldValues;
  computedValues: ComputedValues;
  highlightPlaceholders?: boolean;
}

export function LegalDocPreview({
  bodyText,
  fieldValues,
  computedValues,
  highlightPlaceholders = true,
}: LegalDocPreviewProps) {
  const renderedText = useMemo(() => {
    let text = bodyText;
    
    // Get values with fallbacks
    const purchaserName = fieldValues.purchaser_name || "[PURCHASER_NAME]";
    const pricePerShare = computedValues.price_per_share 
      ? computedValues.price_per_share.toFixed(2) 
      : "[PRICE_PER_SHARE]";
    const numberOfShares = fieldValues.number_of_shares ?? computedValues.computed_number_of_shares;
    const purchaseAmount = fieldValues.purchase_amount ?? computedValues.computed_purchase_amount;
    
    const sharesDisplay = numberOfShares !== undefined 
      ? numberOfShares.toLocaleString() 
      : "[NUMBER_OF_SHARES]";
    const amountDisplay = purchaseAmount !== undefined 
      ? purchaseAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "[PURCHASE_AMOUNT]";

    // Replace placeholders with values or highlighted placeholders
    const replacements: Record<string, { value: string; isFilled: boolean }> = {
      "[PURCHASER_NAME]": { value: purchaserName, isFilled: !!fieldValues.purchaser_name },
      "[PRICE_PER_SHARE]": { value: pricePerShare, isFilled: !!computedValues.price_per_share },
      "[NUMBER_OF_SHARES]": { value: sharesDisplay, isFilled: numberOfShares !== undefined },
      "[PURCHASE_AMOUNT]": { value: amountDisplay, isFilled: purchaseAmount !== undefined },
    };

    // Create regex pattern for all placeholders
    const pattern = /\[(PURCHASER_NAME|PRICE_PER_SHARE|NUMBER_OF_SHARES|PURCHASE_AMOUNT)\]/g;
    
    return text.replace(pattern, (match) => {
      const replacement = replacements[match];
      if (!replacement) return match;
      
      if (highlightPlaceholders) {
        const className = replacement.isFilled 
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-1 rounded font-medium"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1 rounded font-medium";
        return `<span class="${className}">${replacement.value}</span>`;
      }
      return replacement.value;
    });
  }, [bodyText, fieldValues, computedValues, highlightPlaceholders]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 font-serif text-sm leading-relaxed">
        <div 
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      </div>
    </ScrollArea>
  );
}
