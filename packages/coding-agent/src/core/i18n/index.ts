/**
 * Type-safe i18n for coding-agent CLI/TUI user-facing strings.
 *
 * Scope boundary (do not localize):
 * - system prompts
 * - model tool schemas / tool results
 * - RPC / JSON protocol fields
 * - session data
 * - telemetry
 * - command names, tool names, model/provider IDs
 *
 * Only user-visible CLI/TUI copy belongs in catalogs.
 */

export { applyAppLocale, type LanguageSetting } from "./apply.ts";
export type { MessageKey } from "./locales/en.ts";
export { normalizeLocaleTag, type ResolveLocaleInputs, resolveAppLocale, resolveLocale } from "./resolve.ts";
export { readSystemLocale } from "./system-locale.ts";
export {
	createTranslator,
	getLocale,
	onLocaleChange,
	setLocale,
	type TranslateFn,
	type TranslateParams,
	type Translator,
	t,
} from "./translator.ts";
export type { LocaleId } from "./types.ts";
export { SUPPORTED_LOCALES } from "./types.ts";
