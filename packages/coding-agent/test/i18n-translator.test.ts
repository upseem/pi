import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTranslator, getLocale, onLocaleChange, setLocale, t } from "../src/core/i18n/index.ts";

describe("createTranslator", () => {
	it("returns English strings for the en locale", () => {
		const translator = createTranslator("en");
		expect(translator.locale).toBe("en");
		expect(translator.t("lang.switched", { locale: "en" })).toBe("Language set to en");
		expect(translator.t("lang.current", { locale: "en" })).toBe("Current language: en");
		expect(translator.t("lang.unsupported", { locale: "xx" })).toBe("Unsupported language: xx");
		expect(translator.t("cli.help.summary")).toBe("Coding agent CLI");
	});

	it("returns Chinese strings for zh-CN and falls back to English for missing keys", () => {
		const translator = createTranslator("zh-CN");
		expect(translator.locale).toBe("zh-CN");
		expect(translator.t("lang.switched", { locale: "zh-CN" })).toBe("语言已设置为 zh-CN");
		expect(translator.t("lang.current", { locale: "zh-CN" })).toBe("当前语言：zh-CN");
		expect(translator.t("lang.unsupported", { locale: "xx" })).toBe("不支持的语言：xx");
		// Skeleton Chinese catalog may omit some keys; English fallback is required.
		expect(translator.t("cli.help.summary")).toBe("Coding agent CLI");
	});

	it("interpolates named params and keeps missing placeholders", () => {
		const translator = createTranslator("en");
		expect(translator.t("lang.switched", { locale: "zh-CN" })).toBe("Language set to zh-CN");
		expect(translator.t("lang.switched", {})).toBe("Language set to {locale}");
		expect(translator.t("lang.switched")).toBe("Language set to {locale}");
	});

	it("stringifies non-string params without throwing", () => {
		const translator = createTranslator("en");
		expect(translator.t("lang.current", { locale: 42 })).toBe("Current language: 42");
	});
});

describe("ambient translator", () => {
	beforeEach(() => {
		setLocale("en");
	});

	afterEach(() => {
		setLocale("en");
	});

	it("defaults to English and never throws when uninitialized callers call t()", () => {
		expect(getLocale()).toBe("en");
		expect(t("lang.current", { locale: "en" })).toBe("Current language: en");
		expect(t("tui.select.noMatches")).toBe("No matching commands");
	});

	it("switches ambient locale with setLocale", () => {
		setLocale("zh-CN");
		expect(getLocale()).toBe("zh-CN");
		expect(t("lang.switched", { locale: "zh-CN" })).toBe("语言已设置为 zh-CN");
	});

	it("notifies multiple onLocaleChange listeners and supports unsubscribe", () => {
		const seen: string[] = [];
		const first = onLocaleChange(() => {
			seen.push(`a:${getLocale()}`);
		});
		const second = onLocaleChange(() => {
			seen.push(`b:${getLocale()}`);
		});

		setLocale("zh-CN");
		expect(seen).toEqual(["a:zh-CN", "b:zh-CN"]);

		first();
		setLocale("en");
		expect(seen).toEqual(["a:zh-CN", "b:zh-CN", "b:en"]);

		second();
		setLocale("zh-CN");
		expect(seen).toEqual(["a:zh-CN", "b:zh-CN", "b:en"]);
	});

	it("does not notify when setLocale is called with the current locale", () => {
		let calls = 0;
		const unsubscribe = onLocaleChange(() => {
			calls += 1;
		});
		setLocale("en");
		expect(calls).toBe(0);
		unsubscribe();
	});
});
