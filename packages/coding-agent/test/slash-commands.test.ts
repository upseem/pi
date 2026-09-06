import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { APP_NAME } from "../src/config.ts";
import { setLocale, t } from "../src/core/i18n/index.ts";
import { en, type MessageKey } from "../src/core/i18n/locales/en.ts";
import { zhCN } from "../src/core/i18n/locales/zh-CN.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("built-in slash commands", () => {
	beforeEach(() => {
		setLocale("en");
	});

	afterEach(() => {
		setLocale("en");
	});

	it("includes /lang", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "lang")).toBe(true);
	});

	it("resolves descriptions from the i18n catalog for each locale", () => {
		for (const command of BUILTIN_SLASH_COMMANDS) {
			const key = `slash.${command.name}.description` as MessageKey;
			expect(en[key], command.name).toBeTypeOf("string");

			setLocale("en");
			expect(command.description).toBe(command.name === "quit" ? t(key, { appName: APP_NAME }) : t(key));

			setLocale("zh-CN");
			expect(command.description).toBe(command.name === "quit" ? t(key, { appName: APP_NAME }) : t(key));
			expect(command.description, command.name).toMatch(/\p{Script=Han}/u);
		}
	});
});

describe("i18n catalog completeness", () => {
	it("keeps zh-CN keys as a subset of the English catalog", () => {
		const enKeys = new Set(Object.keys(en));
		for (const key of Object.keys(zhCN)) {
			expect(enKeys.has(key), key).toBe(true);
		}
	});
});
