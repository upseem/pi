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

export type { MessageKey } from "./locales/en.ts";
export { normalizeLocaleTag, type ResolveLocaleInputs, resolveLocale } from "./resolve.ts";
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
