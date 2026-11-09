const WHATSAPP_PATTERN = /^52\d{10}$/;

export function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function isValidWhatsappNumber(number: string): boolean {
  return WHATSAPP_PATTERN.test(number);
}
