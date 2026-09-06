import type { TUI } from "@earendil-works/pi-tui";
import { getTuiTranslator, setTuiTranslator } from "@earendil-works/pi-tui";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLocale, setLocale, t } from "../src/core/i18n/index.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { LocaleController } from "../src/modes/interactive/locale-controller.ts";

function createUi() {
	const ui = {
		invalidate: vi.fn(),
		requestRender: vi.fn(),
	} as unknown as TUI;
	return { ui };
}

afterEach(() => {
	setLocale("en");
	setTuiTranslator(undefined);
});

describe("LocaleController", () => {
	beforeEach(() => {
		setLocale("en");
		setTuiTranslator(undefined);
	});

	it("applies --lang without writing settings", () => {
		const { ui } = createUi();
		const manager = SettingsManager.inMemory({ language: "en" });
		const setLanguage = vi.spyOn(manager, "setLanguage");
		const clearLanguage = vi.spyOn(manager, "clearLanguage");
		const onChanged = vi.fn();

		const controller = new LocaleController(ui, {
			getSettingsManager: () => manager,
			onChanged,
			cliLang: "zh-CN",
			env: { LANG: "en_US.UTF-8" },
			systemLocale: "en-US",
		});
		controller.applyInitial();

		expect(getLocale()).toBe("zh-CN");
		expect(t("lang.switched", { locale: "zh-CN" })).toBe("语言已设置为 zh-CN");
		expect(getTuiTranslator()?.("tui.select.noMatches")).toBe("没有匹配的命令");
		expect(setLanguage).not.toHaveBeenCalled();
		expect(clearLanguage).not.toHaveBeenCalled();
		expect(onChanged).toHaveBeenCalled();
		expect(ui.invalidate).toHaveBeenCalled();
		expect(ui.requestRender).toHaveBeenCalled();
	});

	it("lets --lang auto ignore saved language and re-detect", () => {
		const { ui } = createUi();
		const manager = SettingsManager.inMemory({ language: "en" });
		const controller = new LocaleController(ui, {
			getSettingsManager: () => manager,
			onChanged: vi.fn(),
			cliLang: "auto",
			env: { LANG: "zh_CN.UTF-8" },
			systemLocale: "en-US",
		});
		controller.applyInitial();

		expect(getLocale()).toBe("zh-CN");
		expect(manager.getLanguage()).toBe("en");
	});

	it("uses saved language when --lang is absent", () => {
		const { ui } = createUi();
		const manager = SettingsManager.inMemory({ language: "zh-CN" });
		const controller = new LocaleController(ui, {
			getSettingsManager: () => manager,
			onChanged: vi.fn(),
			env: { LANG: "en_US.UTF-8" },
			systemLocale: "en-US",
		});
		controller.applyInitial();

		expect(getLocale()).toBe("zh-CN");
	});

	it("persists explicit /lang selection and overrides an initial --lang", () => {
		const { ui } = createUi();
		const manager = SettingsManager.inMemory({ language: "en" });
		const onChanged = vi.fn();
		const controller = new LocaleController(ui, {
			getSettingsManager: () => manager,
			onChanged,
			cliLang: "en",
			env: { LANG: "en_US.UTF-8" },
			systemLocale: "en-US",
		});
		controller.applyInitial();
		expect(getLocale()).toBe("en");

		controller.setLanguage("zh-CN");

		expect(manager.getLanguage()).toBe("zh-CN");
		expect(getLocale()).toBe("zh-CN");
		expect(controller.getLanguageSelection()).toBe("zh-CN");
		expect(onChanged).toHaveBeenCalled();
	});

	it("clears saved language when selecting auto", () => {
		const { ui } = createUi();
		const manager = SettingsManager.inMemory({ language: "zh-CN" });
		const controller = new LocaleController(ui, {
			getSettingsManager: () => manager,
			onChanged: vi.fn(),
			env: { LANG: "en_US.UTF-8" },
			systemLocale: "en-US",
		});
		controller.applyInitial();
		expect(getLocale()).toBe("zh-CN");

		controller.setLanguage("auto");

		expect(manager.getLanguage()).toBeUndefined();
		expect(getLocale()).toBe("en");
		expect(controller.getLanguageSelection()).toBe("auto");
	});
});
