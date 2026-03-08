import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_LAN = 'http://192.168.1.5:8000';
const ANDROID_EMULATOR = 'http://10.0.2.2:8000';
const STORAGE_KEY = 'BASE_URL_OVERRIDE';
const STORAGE_WEB_KEY = 'WEB_BASE_URL_OVERRIDE';

let BASE_URL_MEMO = Platform.OS === 'android' ? ANDROID_EMULATOR : DEFAULT_LAN;

export async function setBaseUrl(url) {
  BASE_URL_MEMO = url;
  await AsyncStorage.setItem(STORAGE_KEY, url);
}

export async function getBaseUrl() {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v || BASE_URL_MEMO;
  } catch {
    return BASE_URL_MEMO;
  }
}

export function getItemByQrEndpoint(base, qr) {
  return `${base}/api/v1/items/qr/${encodeURIComponent(qr)}`;
}

let WEB_BASE_URL_MEMO = Platform.OS === 'android' ? 'http://10.0.2.2:5173' : 'http://192.168.1.5:5173';

export async function setWebBaseUrl(url) {
  WEB_BASE_URL_MEMO = url;
  await AsyncStorage.setItem(STORAGE_WEB_KEY, url);
}

export async function getWebBaseUrl() {
  try {
    const v = await AsyncStorage.getItem(STORAGE_WEB_KEY);
    return v || WEB_BASE_URL_MEMO;
  } catch {
    return WEB_BASE_URL_MEMO;
  }
}
