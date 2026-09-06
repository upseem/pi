import type { TUI } from "@earendil-works/pi-tui";
import {
	applyAppLocale,
	getLocale,
	type LanguageSetting,
	type LocaleId,
	readSystemLocale,
	resolveAppLocale,
} from "../../core/i18n/index.ts";
import type { SettingsManager } from "../../core/settings-manager.ts";

function isLocaleId(value: string): value is LocaleId {
	return value === "en" || value === "zh-CN";
}

/**
 * Runtime language controller for interactive mode.
 * `--lang` is a process override until `/lang` makes an explicit persistent choice.
 */
export class LocaleController {
	private readonly ui: TUI;
	private readonly getSettingsManager: () => SettingsManager;
	private readonly onChanged: () => void;
	private readonly env: Record<string, string | undefined>;
	private readonly systemLocale: string | undefined;
	private cliLang: string | undefined;
	private selection: LanguageSetting = "auto";

	constructor(
		ui: TUI,
		options: {
			getSettingsManager: () => SettingsManager;
			onChanged: () => void;
			cliLang?: string;
			env?: Record<string, string | undefined>;
			systemLocale?: string;
		},
	) {
		this.ui = ui;
		this.getSettingsManager = options.getSettingsManager;
		this.onChanged = options.onChanged;
		this.cliLang = options.cliLang;
		this.env = options.env ?? process.env;
		this.systemLocale = options.systemLocale ?? readSystemLocale();
	}

	getLanguageSelection(): LanguageSetting {
		return this.selection;
	}

	getActiveLocale(): LocaleId {
		return getLocale();
	}

	applyInitial(): void {
		const settingsLanguage = this.getSettingsManager().getLanguage();
		const locale = resolveAppLocale({
			cliLang: this.cliLang,
			settingsLanguage,
			env: this.env,
			systemLocale: this.systemLocale,
		});

		if (this.cliLang !== undefined) {
			this.selection = this.cliLang.trim().toLowerCase() === "auto" ? "auto" : locale;
		} else if (settingsLanguage && isLocaleId(settingsLanguage)) {
			this.selection = settingsLanguage;
		} else {
			this.selection = "auto";
		}

		this.applyLocale(locale);
	}

	/**
	 * Explicit `/lang` selection: overrides any initial `--lang` and persists.
	 */
	setLanguage(setting: LanguageSetting): void {
		this.cliLang = undefined;
		this.selection = setting;
		if (setting === "auto") {
			this.getSettingsManager().clearLanguage();
		} else {
			this.getSettingsManager().setLanguage(setting);
		}
		const locale = resolveAppLocale({
			settingsLanguage: setting === "auto" ? undefined : setting,
			env: this.env,
			systemLocale: this.systemLocale,
		});
		this.applyLocale(locale);
	}

	private applyLocale(locale: LocaleId): void {
		applyAppLocale(locale);
		this.ui.invalidate();
		this.ui.requestRender();
		this.onChanged();
	}
}
