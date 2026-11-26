/** Where the Settings page saves its preferences on this device. */
export const PREFERENCES_KEY = 'ekapitan:preferences';

/** For BarangayContext's initial Large text state: true if the saved text size is above normal. */
export const savedTextSizeIsLarge = () => {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? (JSON.parse(raw).textSize ?? 'normal') !== 'normal' : false;
  } catch {
    return false;
  }
};
