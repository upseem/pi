import { setTuiTranslator, type TuiMessageKey, type TuiTranslateParams } from "@earendil-works/pi-tui";
import type { MessageKey } from "./locales/en.ts";
import { setLocale, t } from "./translator.ts";
import type { LocaleId } from "./types.ts";

export type LanguageSetting = LocaleId | "auto";

/**
 * Apply an app locale: update ambient translator and inject the matching TUI translator.
 */
export function applyAppLocale(locale: LocaleId): void {
	setLocale(locale);
	setTuiTranslator((key: TuiMessageKey, params?: TuiTranslateParams) => t(key as MessageKey, params));
}
