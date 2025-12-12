import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FieldValues {
  purchaser_name?: string;
  purchaser_email?: string;
  purchaser_street?: string;
  purchaser_city?: string;
  purchaser_state?: string;
  purchaser_zip?: string;
  seller_name?: string;
  seller_email?: string;
  seller_street?: string;
  seller_city?: string;
  seller_state?: string;
  seller_zip?: string;
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
    
    // Format addresses from components
    const formatAddress = (street?: string, city?: string, state?: string, zip?: string) => {
      const parts = [];
      if (street) parts.push(street);
      if (city || state || zip) {
        const cityStateZip = [city, state].filter(Boolean).join(", ") + (zip ? " " + zip : "");
        if (cityStateZip.trim()) parts.push(cityStateZip.trim());
      }
      return parts.join("\n");
    };
    
    // Get values with fallbacks
    const purchaserName = fieldValues.purchaser_name || "[PURCHASER_NAME]";
    const purchaserEmail = fieldValues.purchaser_email || "[PURCHASER_EMAIL]";
    const purchaserAddress = formatAddress(
      fieldValues.purchaser_street,
      fieldValues.purchaser_city,
      fieldValues.purchaser_state,
      fieldValues.purchaser_zip
    ) || "[PURCHASER_ADDRESS]";
    const sellerName = fieldValues.seller_name || "[SELLER_NAME]";
    const sellerEmail = fieldValues.seller_email || "[SELLER_EMAIL]";
    const sellerAddress = formatAddress(
      fieldValues.seller_street,
      fieldValues.seller_city,
      fieldValues.seller_state,
      fieldValues.seller_zip
    ) || "[SELLER_ADDRESS]";
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

    const hasPurchaserAddress = !!(fieldValues.purchaser_street || fieldValues.purchaser_city || fieldValues.purchaser_state || fieldValues.purchaser_zip);
    const hasSellerAddress = !!(fieldValues.seller_street || fieldValues.seller_city || fieldValues.seller_state || fieldValues.seller_zip);

    // Replace placeholders with values or highlighted placeholders
    const replacements: Record<string, { value: string; isFilled: boolean }> = {
      "[PURCHASER_NAME]": { value: purchaserName, isFilled: !!fieldValues.purchaser_name },
      "[PURCHASER_EMAIL]": { value: purchaserEmail, isFilled: !!fieldValues.purchaser_email },
      "[PURCHASER_ADDRESS]": { value: purchaserAddress, isFilled: hasPurchaserAddress },
      "[SELLER_NAME]": { value: sellerName, isFilled: !!fieldValues.seller_name },
      "[SELLER_EMAIL]": { value: sellerEmail, isFilled: !!fieldValues.seller_email },
      "[SELLER_ADDRESS]": { value: sellerAddress, isFilled: hasSellerAddress },
      "[PRICE_PER_SHARE]": { value: pricePerShare, isFilled: !!computedValues.price_per_share },
      "[NUMBER_OF_SHARES]": { value: sharesDisplay, isFilled: numberOfShares !== undefined },
      "[PURCHASE_AMOUNT]": { value: amountDisplay, isFilled: purchaseAmount !== undefined },
    };

    // Create regex pattern for all placeholders
    const placeholderPattern = /\[(PURCHASER_NAME|PURCHASER_EMAIL|PURCHASER_ADDRESS|SELLER_NAME|SELLER_EMAIL|SELLER_ADDRESS|PRICE_PER_SHARE|NUMBER_OF_SHARES|PURCHASE_AMOUNT)\]/g;
    
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

    // Format section headers (lines starting with numbers like "1.", "2.", etc.)
    text = text.replace(/^(\d+\.)\s+([A-Z][A-Z\s,]+[A-Z]\.?)/gm, '<h2 class="text-base font-bold mt-8 mb-3 text-foreground">$1 $2</h2>');
    
    // Format sub-sections (lines like "(a)", "(b)", "(i)", "(ii)")
    text = text.replace(/^(\([a-z]\)|\([ivx]+\))/gm, '<span class="font-semibold text-foreground/80">$1</span>');
    
    // Add paragraph spacing - convert double newlines to paragraph breaks
    text = text.replace(/\n\n/g, '</p><p class="mb-4">');
    
    // Add extra spacing before numbered sections
    text = text.replace(/\n(\d+\.)/g, '</p><p class="mb-4">$1');
    
    // Format the title if present
    text = text.replace(/^(COMMON STOCK PURCHASE AGREEMENT)/m, '<h1 class="text-xl font-bold text-center mb-8 text-foreground">$1</h1>');
    
    // Format RECITALS, WITNESSETH, etc.
    text = text.replace(/^(RECITALS|WITNESSETH|NOW, THEREFORE|IN WITNESS WHEREOF)/gm, '<h3 class="font-bold mt-6 mb-3 text-foreground">$1</h3>');

    // Wrap in paragraph tags
    text = '<p class="mb-4">' + text + '</p>';

    return text;
  }, [bodyText, fieldValues, computedValues, highlightPlaceholders]);

  return (
    <ScrollArea className="h-full">
      <div className="p-8 font-serif text-sm leading-relaxed">
        <div 
          className="[&>h1]:whitespace-normal [&>h2]:whitespace-normal [&>h3]:whitespace-normal [&>p]:whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      </div>
    </ScrollArea>
  );
}
