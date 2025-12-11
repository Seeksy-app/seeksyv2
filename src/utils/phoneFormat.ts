/**
 * Formats a phone number as XXX-XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Strips formatting from phone number, returning only digits
 */
export function stripPhoneFormatting(value: string): string {
  return value.replace(/\D/g, '');
}
