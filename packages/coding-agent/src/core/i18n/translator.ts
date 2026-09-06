import { en, type MessageKey } from "./locales/en.ts";
import { zhCN } from "./locales/zh-CN.ts";
import type { LocaleId } from "./types.ts";

export type TranslateParams = Record<string, string | number | boolean | null | undefined>;
export type TranslateFn = (key: MessageKey, params?: TranslateParams) => string;

export type Translator = {
	locale: LocaleId;
	t: TranslateFn;
};

const catalogs: Record<LocaleId, Partial<Record<MessageKey, string>>> = {
	en,
	"zh-CN": zhCN,
};

function interpolate(template: string, params?: TranslateParams): string {
	return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, name: string) => {
		if (!params || !(name in params)) {
			return match;
		}
		const value = params[name];
		if (value === undefined || value === null) {
			return match;
		}
		return String(value);
	});
}

function lookup(locale: LocaleId, key: MessageKey): string {
	const localized = catalogs[locale][key];
	if (localized !== undefined) {
		return localized;
	}
	return en[key];
}

export function createTranslator(locale: LocaleId): Translator {
	return {
		locale,
		t(key: MessageKey, params?: TranslateParams): string {
			return interpolate(lookup(locale, key), params);
		},
	};
}

let current: Translator = createTranslator("en");
const listeners = new Set<() => void>();

export function getLocale(): LocaleId {
	return current.locale;
}

export function t(key: MessageKey, params?: TranslateParams): string {
	return current.t(key, params);
}

export function setLocale(locale: LocaleId): void {
	if (current.locale === locale) {
		return;
	}
	current = createTranslator(locale);
	for (const listener of listeners) {
		listener();
	}
}

export function onLocaleChange(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
