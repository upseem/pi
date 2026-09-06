import type { LocaleId } from "./types.ts";

export type ResolveLocaleInputs = {
	cliLang?: string;
	settingsLanguage?: string;
	env?: Record<string, string | undefined>;
	systemLocale?: string;
};

/**
 * Normalize a locale/language tag into a supported LocaleId, or undefined if unsupported.
 * Examples: `zh_CN.UTF-8` → `zh-CN`; `zh`/`zh-Hans` → `zh-CN`; `zh-TW` → undefined.
 */
export function normalizeLocaleTag(tag: string | undefined): LocaleId | undefined {
	if (tag === undefined) {
		return undefined;
	}

	const trimmed = tag.trim();
	if (!trimmed) {
		return undefined;
	}

	const withoutCharset = trimmed.split(".")[0] ?? trimmed;
	const primary = withoutCharset.replace(/_/g, "-");
	const lower = primary.toLowerCase();

	if (lower === "c" || lower === "posix" || lower === "auto") {
		return undefined;
	}

	if (lower === "en" || lower.startsWith("en-")) {
		return "en";
	}

	if (lower === "zh-cn" || lower === "zh-hans" || lower.startsWith("zh-hans-") || lower === "zh") {
		return "zh-CN";
	}

	// Traditional Chinese and other zh variants are not mapped to zh-CN in v1.
	return undefined;
}

function readEnv(env: Record<string, string | undefined> | undefined, key: string): string | undefined {
	if (!env) {
		return undefined;
	}
	return env[key];
}

/**
 * Resolve the active locale.
 * Priority: cliLang > settingsLanguage > LC_ALL > LC_MESSAGES > LANG > systemLocale > en
 */
export function resolveLocale(inputs: ResolveLocaleInputs): LocaleId {
	const env = inputs.env;

	const candidates = [
		inputs.cliLang,
		inputs.settingsLanguage,
		readEnv(env, "LC_ALL"),
		readEnv(env, "LC_MESSAGES"),
		readEnv(env, "LANG"),
		inputs.systemLocale,
	];

	for (const candidate of candidates) {
		const normalized = normalizeLocaleTag(candidate);
		if (normalized) {
			return normalized;
		}
	}

	return "en";
}

/**
 * App-level locale resolve. `--lang auto` ignores saved settings and re-detects
 * from env / system locale.
 */
export function resolveAppLocale(inputs: ResolveLocaleInputs): LocaleId {
	const cliLang = inputs.cliLang?.trim();
	if (cliLang && cliLang.toLowerCase() === "auto") {
		return resolveLocale({
			env: inputs.env,
			systemLocale: inputs.systemLocale,
		});
	}
	return resolveLocale(inputs);
}
