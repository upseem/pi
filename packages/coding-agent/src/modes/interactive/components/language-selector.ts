import { Container, type SelectItem, SelectList, type SelectListLayoutOptions } from "@earendil-works/pi-tui";
import type { LanguageSetting } from "../../../core/i18n/index.ts";
import { t } from "../../../core/i18n/index.ts";
import { getSelectListTheme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";

const LANG_SELECT_LIST_LAYOUT: SelectListLayoutOptions = {
	minPrimaryColumnWidth: 12,
	maxPrimaryColumnWidth: 32,
};

const LANGUAGE_OPTIONS: LanguageSetting[] = ["en", "zh-CN", "auto"];

function optionLabel(setting: LanguageSetting): string {
	switch (setting) {
		case "en":
			return t("lang.option.en");
		case "zh-CN":
			return t("lang.option.zh-CN");
		case "auto":
			return t("lang.option.auto");
	}
}

/**
 * Component that renders a language selector (en / zh-CN / auto).
 */
export class LanguageSelectorComponent extends Container {
	private selectList: SelectList;

	constructor(current: LanguageSetting, onSelect: (setting: LanguageSetting) => void, onCancel: () => void) {
		super();

		const items: SelectItem[] = LANGUAGE_OPTIONS.map((value) => ({
			value,
			label: optionLabel(value),
			description: value === current ? "(current)" : undefined,
		}));

		this.addChild(new DynamicBorder());

		this.selectList = new SelectList(items, 10, getSelectListTheme(), LANG_SELECT_LIST_LAYOUT);

		const currentIndex = LANGUAGE_OPTIONS.indexOf(current);
		if (currentIndex !== -1) {
			this.selectList.setSelectedIndex(currentIndex);
		}

		this.selectList.onSelect = (item) => {
			onSelect(item.value as LanguageSetting);
		};

		this.selectList.onCancel = () => {
			onCancel();
		};

		this.addChild(this.selectList);
		this.addChild(new DynamicBorder());
	}

	getSelectList(): SelectList {
		return this.selectList;
	}
}
