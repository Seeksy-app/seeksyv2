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
      ? `$${computedValues.price_per_share.toFixed(2)}` 
      : "[PRICE_PER_SHARE]";
    const numberOfShares = fieldValues.number_of_shares ?? computedValues.computed_number_of_shares;
    const purchaseAmount = fieldValues.purchase_amount ?? computedValues.computed_purchase_amount;
    
    const sharesDisplay = numberOfShares !== undefined 
      ? numberOfShares.toLocaleString() 
      : "[NUMBER_OF_SHARES]";
    const amountDisplay = purchaseAmount !== undefined 
      ? `$${purchaseAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "[PURCHASE_AMOUNT]";

    // Replace placeholders with values or highlighted placeholders
    const replacements: Record<string, { value: string; isFilled: boolean }> = {
      "[PURCHASER_NAME]": { value: purchaserName, isFilled: !!fieldValues.purchaser_name },
      "[PRICE_PER_SHARE]": { value: pricePerShare, isFilled: !!computedValues.price_per_share },
      "[NUMBER_OF_SHARES]": { value: sharesDisplay, isFilled: numberOfShares !== undefined },
      "[PURCHASE_AMOUNT]": { value: amountDisplay, isFilled: purchaseAmount !== undefined },
    };

    // Create regex pattern for all placeholders
    const placeholderPattern = /\[(PURCHASER_NAME|PRICE_PER_SHARE|NUMBER_OF_SHARES|PURCHASE_AMOUNT)\]/g;
    
    text = text.replace(placeholderPattern, (match) => {
      const replacement = replacements[match];
      if (!replacement) return match;
      
      if (highlightPlaceholders) {
        const className = replacement.isFilled 
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-medium"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium";
        return `<span class="${className}">${replacement.value}</span>`;
      }
      return replacement.value;
    });

    // Format section headers (lines starting with numbers like "1.", "2.", etc. followed by ALL CAPS or title case)
    text = text.replace(/^(\d+\.)\s+([A-Z][A-Z\s]+[A-Z]\.?)/gm, '<strong class="text-base">$1 $2</strong>');
    
    // Format sub-sections (lines like "(a)", "(b)", "(i)", "(ii)")
    text = text.replace(/^(\([a-z]\)|\([ivx]+\))/gm, '<span class="font-semibold text-foreground/80">$1</span>');
    
    // Add extra spacing before numbered sections
    text = text.replace(/\n(\d+\.)/g, '\n\n$1');
    
    // Format the title if present
    text = text.replace(/^(COMMON STOCK PURCHASE AGREEMENT)/m, '<h1 class="text-xl font-bold text-center mb-6 text-foreground">$1</h1>');
    
    // Format RECITALS, WITNESSETH, etc.
    text = text.replace(/^(RECITALS|WITNESSETH|NOW, THEREFORE|IN WITNESS WHEREOF)/gm, '<strong class="block mt-4 mb-2">$1</strong>');

    return text;
  }, [bodyText, fieldValues, computedValues, highlightPlaceholders]);

  return (
    <ScrollArea className="h-full">
      <div className="p-8 font-serif text-sm leading-loose">
        <div 
          className="whitespace-pre-wrap space-y-1 [&>h1]:whitespace-normal [&>strong]:block [&>strong]:mt-6 [&>strong]:mb-2"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      </div>
    </ScrollArea>
  );
}
