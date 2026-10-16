import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import ar from './ar.json';
import en from './en.json';

const STORAGE_KEY = 'app.lang';
export const DEFAULT_LANG = 'ar'; // Arabic first

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: DEFAULT_LANG,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
  returnNull: false,
});

// Load the saved language. Returns true if the app must reload to flip layout direction.
export async function initLanguage() {
  let lang = DEFAULT_LANG;
  try {
    lang = (await AsyncStorage.getItem(STORAGE_KEY)) || DEFAULT_LANG;
  } catch {}
  await i18n.changeLanguage(lang);
  const wantRTL = lang === 'ar';
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL === wantRTL) {
    await AsyncStorage.removeItem(RELOAD_GUARD).catch(() => {});
    return false;
  }
  I18nManager.forceRTL(wantRTL);
  // Reload at most once per language so a platform that ignores forceRTL can't loop forever.
  const tried = await AsyncStorage.getItem(RELOAD_GUARD).catch(() => null);
  if (tried === lang) return false;
  await AsyncStorage.setItem(RELOAD_GUARD, lang).catch(() => {});
  return true;
}

const RELOAD_GUARD = 'app.rtlReloadTried';

async function reloadApp() {
  try {
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload(); // development fallback
  }
}

export async function setLanguage(lang) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  await i18n.changeLanguage(lang);
  const wantRTL = lang === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.forceRTL(wantRTL);
    await reloadApp(); // RTL/LTR switch needs a restart
  }
}

export const toggleLanguage = () => setLanguage(i18n.language === 'ar' ? 'en' : 'ar');

// Friendly, translated message for any thrown error.
export function errorMessage(e) {
  const code = e?.code || '';
  const key = `errors.${code}`;
  return i18n.exists(key) ? i18n.t(key) : i18n.t('errors.unknown');
}

export function formatDateTime(ms, lang = i18n.language) {
  const locale = lang === 'ar' ? 'ar-JO' : 'en-GB';
  try {
    return new Date(ms).toLocaleString(locale, {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return new Date(ms).toLocaleString();
  }
}

export function formatTime(ms, lang = i18n.language) {
  const locale = lang === 'ar' ? 'ar-JO' : 'en-GB';
  try {
    return new Date(ms).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return new Date(ms).toLocaleTimeString();
  }
}

export default i18n;
