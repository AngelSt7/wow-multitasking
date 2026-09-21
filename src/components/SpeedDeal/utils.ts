import { DEFAULT_PREFS, STORAGE_KEY } from "./constants";
import type { MultitaskingPrefs } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function parsePrefs(raw: Partial<MultitaskingPrefs>): MultitaskingPrefs {
  return {
    position: raw.position === "vertical" ? "vertical" : "corner",
    mode:     raw.mode === "alwaysOpen"   ? "alwaysOpen" : "onPress",
    autoSearchPronto: raw.autoSearchPronto === true,
  };
}

export function loadPrefs(): MultitaskingPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return parsePrefs(JSON.parse(raw) as Partial<MultitaskingPrefs>);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: MultitaskingPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  chrome.storage.local.set({ [STORAGE_KEY]: prefs });
}