const IMAGE_PREFIX = 'pm_img_';

export async function uploadImageBase64(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const key = `${IMAGE_PREFIX}${crypto.randomUUID()}`;
      try {
        localStorage.setItem(key, base64);
      } catch {
        // localStorage might be full — fall back to returning the base64 directly
      }
      resolve(base64);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  bucket: string,
): Promise<string | null> {
  const base64 = await uploadImageBase64(file);
  if (base64) return base64;
  return null;
}
