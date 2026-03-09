// ── App settings stored in localStorage ─────────────────────────────────────

const SETTINGS_KEY = "mysuperapp-settings";

export interface AppSettings {
  /** Quote refresh interval in seconds (default: 10) */
  quoteIntervalSec: number;
  /** Fundamentals / watchlist refresh interval in minutes (default: 15) */
  fundamentalsIntervalMin: number;
}

const DEFAULTS: AppSettings = {
  quoteIntervalSec: 10,
  fundamentalsIntervalMin: 15,
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      quoteIntervalSec:
        typeof parsed.quoteIntervalSec === "number" && parsed.quoteIntervalSec >= 5
          ? parsed.quoteIntervalSec
          : DEFAULTS.quoteIntervalSec,
      fundamentalsIntervalMin:
        typeof parsed.fundamentalsIntervalMin === "number" && parsed.fundamentalsIntervalMin >= 1
          ? parsed.fundamentalsIntervalMin
          : DEFAULTS.fundamentalsIntervalMin,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  // Dispatch a storage event so other tabs/components pick it up
  window.dispatchEvent(new Event("settings-changed"));
  return merged;
}
