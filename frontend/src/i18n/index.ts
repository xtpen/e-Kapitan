/// <reference types="vite/client" />
import { useCallback } from 'react';
import { usePreferences } from '../context/PreferencesContext';

/*
 * Resident portal translations (Account → Display & accessibility → Language).
 *
 * Write the English text in the component and wrap it: t('Good morning, {name}', { name }).
 * The Filipino version is looked up by that exact English text in src/i18n/fil/*.ts, files of
 * the form `export default { 'English text': 'Filipino text' }`. Every file in that folder is
 * picked up automatically. Anything without a Filipino entry shows in English, so a missing
 * translation never breaks a page.
 *
 * Content that comes from data (document names, announcements, staff notes) is not translated.
 */

type Dict = Record<string, string>;

const modules = import.meta.glob<{ default: Dict }>('./fil/*.ts', { eager: true });
const FIL: Dict = Object.values(modules).reduce<Dict>((all, m) => Object.assign(all, m.default), {});

export type Vars = Record<string, string | number>;

const fill = (text: string, vars?: Vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text);

/** Translate outside React (e.g. in plain helper functions that receive the language). */
export const translate = (lang: 'en' | 'fil', text: string, vars?: Vars) => fill(lang === 'fil' ? FIL[text] ?? text : text, vars);

/** t(english, vars?) for the current language. */
export const useT = () => {
  const { prefs } = usePreferences();
  const lang = prefs.language;
  return useCallback((text: string, vars?: Vars) => translate(lang, text, vars), [lang]);
};

/** The current language code. */
export const useLanguage = () => usePreferences().prefs.language;
