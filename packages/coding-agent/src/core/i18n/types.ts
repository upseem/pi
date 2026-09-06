export type LocaleId = "en" | "zh-CN";

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const satisfies readonly LocaleId[];
