import { afterEach, describe, expect, it } from "vitest";
import { normalizeLocaleTag, resolveLocale } from "../src/core/i18n/resolve.ts";

describe("normalizeLocaleTag", () => {
	it("normalizes underscore and charset suffixes to BCP47", () => {
		expect(normalizeLocaleTag("zh_CN.UTF-8")).toBe("zh-CN");
		expect(normalizeLocaleTag("en_US.UTF-8")).toBe("en");
	});

	it("maps zh and zh-Hans to zh-CN", () => {
		expect(normalizeLocaleTag("zh")).toBe("zh-CN");
		expect(normalizeLocaleTag("zh-Hans")).toBe("zh-CN");
		expect(normalizeLocaleTag("zh_Hans.UTF-8")).toBe("zh-CN");
	});

	it("does not map zh-TW to zh-CN", () => {
		expect(normalizeLocaleTag("zh-TW")).toBeUndefined();
		expect(normalizeLocaleTag("zh_TW.UTF-8")).toBeUndefined();
	});

	it("treats C, POSIX, and empty as undefined", () => {
		expect(normalizeLocaleTag("C")).toBeUndefined();
		expect(normalizeLocaleTag("POSIX")).toBeUndefined();
		expect(normalizeLocaleTag("")).toBeUndefined();
		expect(normalizeLocaleTag(undefined)).toBeUndefined();
		expect(normalizeLocaleTag("   ")).toBeUndefined();
	});

	it("accepts exact supported locale ids", () => {
		expect(normalizeLocaleTag("en")).toBe("en");
		expect(normalizeLocaleTag("zh-CN")).toBe("zh-CN");
		expect(normalizeLocaleTag("ZH-cn")).toBe("zh-CN");
	});
});

describe("resolveLocale", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		for (const key of Object.keys(process.env)) {
			if (!(key in originalEnv)) {
				delete process.env[key];
			}
		}
		Object.assign(process.env, originalEnv);
	});

	it("prefers cliLang over settings, env, and system locale", () => {
		expect(
			resolveLocale({
				cliLang: "zh-CN",
				settingsLanguage: "en",
				env: { LC_ALL: "en_US.UTF-8", LANG: "en_US.UTF-8" },
				systemLocale: "en-US",
			}),
		).toBe("zh-CN");
	});

	it("prefers settingsLanguage over env and system locale", () => {
		expect(
			resolveLocale({
				settingsLanguage: "zh-CN",
				env: { LC_ALL: "en_US.UTF-8", LANG: "en_US.UTF-8" },
				systemLocale: "en-US",
			}),
		).toBe("zh-CN");
	});

	it("uses LC_ALL before LC_MESSAGES and LANG", () => {
		expect(
			resolveLocale({
				env: {
					LC_ALL: "zh_CN.UTF-8",
					LC_MESSAGES: "en_US.UTF-8",
					LANG: "en_US.UTF-8",
				},
			}),
		).toBe("zh-CN");
	});

	it("uses LC_MESSAGES before LANG", () => {
		expect(
			resolveLocale({
				env: {
					LC_MESSAGES: "zh_CN.UTF-8",
					LANG: "en_US.UTF-8",
				},
			}),
		).toBe("zh-CN");
	});

	it("uses LANG before systemLocale", () => {
		expect(
			resolveLocale({
				env: { LANG: "zh_CN.UTF-8" },
				systemLocale: "en-US",
			}),
		).toBe("zh-CN");
	});

	it("uses systemLocale when env tags are missing or C/POSIX", () => {
		expect(
			resolveLocale({
				env: { LC_ALL: "C", LANG: "POSIX" },
				systemLocale: "zh-Hans-CN",
			}),
		).toBe("zh-CN");
	});

	it("falls back to en when nothing resolves", () => {
		expect(resolveLocale({ env: {}, systemLocale: "zh-TW" })).toBe("en");
		expect(resolveLocale({})).toBe("en");
	});

	it("skips auto and unsupported tags and continues to the next source", () => {
		expect(
			resolveLocale({
				cliLang: "auto",
				settingsLanguage: "zh-TW",
				env: { LANG: "zh_CN.UTF-8" },
			}),
		).toBe("zh-CN");
	});

	it("does not read process.env when env is provided", () => {
		process.env.LC_ALL = "zh_CN.UTF-8";
		expect(resolveLocale({ env: { LANG: "en_US.UTF-8" } })).toBe("en");
	});
});
