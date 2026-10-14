import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

import type { ImageFile } from '@/services/api/generators';

/**
 * Longest edge (px) we upload. A full-res phone capture is 12–48 MP / several
 * MB; a nameplate at ~1600px stays sharp enough for OCR while keeping the file
 * small (~200–400 KB), so uploads are fast on cellular and never trip the API's
 * upload-size limit.
 */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.6;

function getPixelSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject)
  );
}

/**
 * Downscales + re-encodes a captured/picked photo to a compact JPEG before
 * upload. Normalizing to JPEG also bakes in EXIF orientation and sidesteps HEIC,
 * so the backend and Gemini always receive a plain, upright JPEG. Only shrinks
 * (never upscales); on any failure it returns the original image untouched.
 */
export async function prepareScanImage(image: ImageFile): Promise<ImageFile> {
  try {
    const { width, height } = await getPixelSize(image.uri);
    const context = ImageManipulator.manipulate(image.uri);

    const longEdge = Math.max(width, height);
    if (longEdge > MAX_EDGE) {
      const scale = MAX_EDGE / longEdge;
      context.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
    }

    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return { uri: result.uri, name: 'label.jpg', mimeType: 'image/jpeg' };
  } catch {
    return image;
  }
}
