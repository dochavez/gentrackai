/**
 * Shared multipart-upload helpers for the API layer. A React Native `FormData`
 * file part is the `{ uri, name, type }` shape (not a web `Blob`), so we build
 * it here once and reuse it across features (generator scans, chat photos).
 */

export type ImageFile = { uri: string; name?: string | null; mimeType?: string | null };

/** Appends an image to a FormData under `field` using the RN file-part shape. */
export function appendImage(form: FormData, image: ImageFile, field = 'image'): void {
  const name = image.name ?? image.uri.split('/').pop() ?? 'photo.jpg';
  const type = image.mimeType ?? 'image/jpeg';
  form.append(field, { uri: image.uri, name, type } as unknown as Blob);
}

/** Axios config for a multipart/form-data request. */
export const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } } as const;
