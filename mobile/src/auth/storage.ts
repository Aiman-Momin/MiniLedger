import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export async function readItem(key: string) {
  return isWeb ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

export async function writeItem(key: string, value: string) {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function removeItem(key: string) {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
