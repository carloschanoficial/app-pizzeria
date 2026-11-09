export const TICKET_BUCKET = 'comprobantes';

const TICKET_MAX_BYTES = 5 * 1024 * 1024;
const TICKET_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateTicketFile(file: File): string | null {
  if (!(file.type in TICKET_MIME_EXTENSIONS)) return 'Sube una imagen JPG, PNG o WebP.';
  if (file.size > TICKET_MAX_BYTES) return 'La imagen no puede pesar más de 5 MB.';
  return null;
}

export function ticketExtension(file: File): string {
  return TICKET_MIME_EXTENSIONS[file.type] ?? 'jpg';
}
