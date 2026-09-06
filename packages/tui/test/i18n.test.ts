import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getTuiTranslator, setTuiTranslator, t } from "../src/i18n.ts";

describe("tui i18n", () => {
	afterEach(() => {
		setTuiTranslator(undefined);
	});

	it("returns English defaults without an injected translator", () => {
		assert.equal(t("tui.select.noMatches"), "No matching commands");
	});

	it("uses an injected translator when provided", () => {
		setTuiTranslator((key) => {
			if (key === "tui.select.noMatches") {
				return "没有匹配的命令";
			}
			return key;
		});
		assert.equal(t("tui.select.noMatches"), "没有匹配的命令");
		assert.equal(typeof getTuiTranslator(), "function");
	});

	it("restores English defaults after clearing the injected translator", () => {
		setTuiTranslator(() => "custom");
		assert.equal(t("tui.select.noMatches"), "custom");
		setTuiTranslator(undefined);
		assert.equal(t("tui.select.noMatches"), "No matching commands");
		assert.equal(getTuiTranslator(), undefined);
	});

	it("interpolates named params in English defaults", () => {
		assert.equal(t("tui.select.noMatches"), "No matching commands");
	});
});
