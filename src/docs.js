// Documents attached to a booking (Aadhaar copy, agreement, payment proof, photos).
// Pictures are shrunk before saving. On a phone each one is saved as its own file in the
// app's private folder, so the main app data stays small; in a browser it is kept inline.
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { uid } from './utils';

export const DOC_TYPES = ['Aadhaar copy', 'Agreement', 'Payment proof', 'Programme photo', 'Other'];
const MAX_WIDTH = 1400; // pixels: readable when zoomed, small to store
const DIR = FileSystem.documentDirectory ? FileSystem.documentDirectory + 'booking-docs/' : null;

// Opens the camera or the photo library. Returns { uri, width, height } ready to save, or null.
export async function pickDocument(fromCamera) {
  if (fromCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('camera-permission');
  }
  const opts = { mediaTypes: ['images'], quality: 1 };
  const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets || !res.assets[0]) return null;
  const a = res.assets[0];
  const resize = a.width && a.width > MAX_WIDTH ? [{ resize: { width: MAX_WIDTH } }] : [];
  const out = await manipulateAsync(a.uri, resize, { compress: 0.6, format: SaveFormat.JPEG, base64: Platform.OS === 'web' });
  const id = uid();
  if (Platform.OS === 'web' || !DIR) {
    return { id, uri: out.base64 ? 'data:image/jpeg;base64,' + out.base64 : out.uri, width: out.width, height: out.height };
  }
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
  const dest = DIR + id + '.jpg';
  await FileSystem.copyAsync({ from: out.uri, to: dest });
  return { id, uri: dest, width: out.width, height: out.height };
}

// Deletes the saved file (phone only). Inline pictures need nothing.
export async function removeDocumentFile(doc) {
  if (doc && doc.uri && DIR && doc.uri.startsWith(DIR)) await FileSystem.deleteAsync(doc.uri, { idempotent: true }).catch(() => {});
}
