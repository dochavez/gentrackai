import * as ImagePicker from 'expo-image-picker';

import type { ImageFile } from '@/services/api/upload';

/**
 * Opens the system photo picker (no permission prompt on modern OSes).
 *
 * `preferredAssetRepresentationMode: Compatible` makes iOS transcode HEIC/HEIF
 * library photos (the default iPhone format) to JPEG on the way out. Without it
 * the picker returns the original HEIC, which the backend rejects.
 */
export async function pickFromGallery(): Promise<ImageFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType };
}
