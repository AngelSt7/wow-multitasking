import type { UserPreferences } from "../interfaces";

const isChromeStorageAvailable = (): boolean => {
  try {
    return typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined';
  } catch {
    return false;
  }
};

export const useChromeStorage = () => {

  const getItem = async <T>(key: string): Promise<T | null> => {
    try {
      if (!isChromeStorageAvailable()) {
        return null;
      }
      const result = await chrome.storage.local.get([key]);
      return (result[key] as T) || null;
    } catch (error: any) {
      // "Extension context invalidated" ocurre durante HMR
      if (error?.message?.includes('Extension context invalidated')) {
      } else {
        console.error(`❌ Error obteniendo ${key} de chrome.storage:`, error);
      }
      return null;
    }
  };

  const setItem = async <T>(key: string, value: T): Promise<void> => {
    try {
      if (!isChromeStorageAvailable()) {
        return;
      }
      await chrome.storage.local.set({ [key]: value });
    } catch (error: any) {
      if (error?.message?.includes('Extension context invalidated')) {
      } else {
        console.error(`❌ Error guardando ${key} en chrome.storage:`, error);
      }
    }
  };

  const removeItem = async (key: string): Promise<void> => {
    try {
      if (!isChromeStorageAvailable()) {
        return;
      }
      await chrome.storage.local.remove(key);
    } catch (error: any) {
      if (error?.message?.includes('Extension context invalidated')) {
      } else {
        console.error(`❌ Error eliminando ${key} de chrome.storage:`, error);
      }
    }
  };

  const checkPreference = async (prefKey: keyof UserPreferences): Promise<boolean> => {
    const prefs = await getItem<UserPreferences>('userPrefs');
    return !!(prefs && prefs[prefKey]);
  };

  return {
    getItem,
    setItem,
    removeItem,
    checkPreference
  };
};