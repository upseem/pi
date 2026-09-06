import type { MessageKey } from "./en.ts";

/**
 * Simplified Chinese catalog. Partial is intentional: missing keys fall back to English.
 * Intentionally omits `cli.help.summary` so fallback behavior stays exercised.
 */
export const zhCN = {
	"lang.switched": "语言已设置为 {locale}",
	"lang.current": "当前语言：{locale}",
	"lang.unsupported": "不支持的语言：{locale}",
	"lang.menu.title": "语言",
	"lang.menu.description": "选择界面语言。自动则跟随系统语言。",
	"lang.option.en": "English",
	"lang.option.zh-CN": "简体中文",
	"lang.option.auto": "自动（系统）",
	"tui.select.noMatches": "没有匹配的命令",
} as const satisfies Partial<Record<MessageKey, string>>;
