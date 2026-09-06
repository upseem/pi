import type { MessageKey } from "./en.ts";

/**
 * Simplified Chinese catalog. Partial is intentional: missing keys fall back to English.
 * Intentionally omits `cli.help.summary` so fallback behavior stays exercised.
 */
export const zhCN = {
	"lang.switched": "语言已设置为 {locale}",
	"lang.current": "当前语言：{locale}",
	"lang.unsupported": "不支持的语言：{locale}",
	"tui.select.noMatches": "没有匹配的命令",
} as const satisfies Partial<Record<MessageKey, string>>;
