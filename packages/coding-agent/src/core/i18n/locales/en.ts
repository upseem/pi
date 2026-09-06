/**
 * English baseline catalog. MessageKey is derived from these keys.
 * Add new UI strings here first; other locales may be partial and fall back.
 */
export const en = {
	"cli.help.summary": "Coding agent CLI",
	"lang.switched": "Language set to {locale}",
	"lang.current": "Current language: {locale}",
	"lang.unsupported": "Unsupported language: {locale}",
	"lang.menu.title": "Language",
	"lang.menu.description": "Choose UI language. Auto follows the system locale.",
	"lang.option.en": "English",
	"lang.option.zh-CN": "简体中文",
	"lang.option.auto": "Auto (system)",
	"tui.select.noMatches": "No matching commands",
} as const;

export type MessageKey = keyof typeof en;
