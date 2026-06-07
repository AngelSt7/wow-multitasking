type MultitaskingPrefs = {
  position: "corner" | "vertical";
  mode: "onPress" | "alwaysOpen";
};

export const STORAGE_KEY = "multitasking";

export const DEFAULT_PREFS: MultitaskingPrefs = {
  position: "corner",
  mode: "onPress",
};

/**
 * Validates and normalizes preferences from storage.
 */
export function parsePrefs(raw: Partial<MultitaskingPrefs>): MultitaskingPrefs {
  return {
    position: raw.position === "vertical" ? "vertical" : "corner",
    mode: raw.mode === "alwaysOpen" ? "alwaysOpen" : "onPress",
  };
}

/**
 * Loads preferences from localStorage (sync read, used for initial state).
 */
export function loadPrefs(): MultitaskingPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return parsePrefs(JSON.parse(raw) as Partial<MultitaskingPrefs>);
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Saves preferences to both localStorage cache and chrome.storage.local (for cross-context sync).
 */
export function savePrefs(prefs: MultitaskingPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  chrome.storage.local.set({ [STORAGE_KEY]: prefs });
}
