/**
 * Injectable i18n for pi-tui.
 *
 * Hosts (e.g. coding-agent) may inject a translator when the app locale changes.
 * Standalone usage keeps English defaults. Do not localize protocol/debug strings here.
 */

export type TuiMessageKey = "tui.select.noMatches";

export type TuiTranslateParams = Record<string, string | number | boolean | null | undefined>;

export type TuiTranslateFn = (key: TuiMessageKey, params?: TuiTranslateParams) => string;

export const TUI_DEFAULT_MESSAGES = {
	"tui.select.noMatches": "No matching commands",
} as const satisfies Record<TuiMessageKey, string>;

function interpolate(template: string, params?: TuiTranslateParams): string {
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

let injectedTranslator: TuiTranslateFn | undefined;

export function setTuiTranslator(translate: TuiTranslateFn | undefined): void {
	injectedTranslator = translate;
}

export function getTuiTranslator(): TuiTranslateFn | undefined {
	return injectedTranslator;
}

export function t(key: TuiMessageKey, params?: TuiTranslateParams): string {
	if (injectedTranslator) {
		return injectedTranslator(key, params);
	}
	return interpolate(TUI_DEFAULT_MESSAGES[key], params);
}
