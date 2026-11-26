/** Where the Settings page saves its preferences on this device. */
export const PREFERENCES_KEY = 'ekapitan:preferences';

/** For BarangayContext's initial Large text state: true if the saved text size is Large. */
export const savedTextSizeIsLarge = () => {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    const size = raw ? JSON.parse(raw).textSize : 'normal';
    return size === 'large' || size === 'xlarge'; // 'xlarge' is the old "Largest", now Large
  } catch {
    return false;
  }
};
