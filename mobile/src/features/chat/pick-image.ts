import * as ImagePicker from 'expo-image-picker';

import type { ImageFile } from '@/services/api/upload';

/**
 * Photo pickers for chat attachments. `Compatible` asset representation makes
 * iOS transcode HEIC/HEIF library photos to JPEG on the way out (the backend
 * and Gemini expect a standard format) — same reason as the generator scan.
 */

function toFile(asset: ImagePicker.ImagePickerAsset): ImageFile {
  return { uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType };
}

/** Opens the system photo library (no permission prompt on modern OSes). */
export async function pickChatPhotoFromLibrary(): Promise<ImageFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return toFile(result.assets[0]);
}

/** Opens the camera. Returns null if the user cancels or denies the permission. */
export async function captureChatPhoto(): Promise<ImageFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (result.canceled || result.assets.length === 0) return null;
  return toFile(result.assets[0]);
}
