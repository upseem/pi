/**
 * Best-effort system locale from Intl. Used as the last fallback before English.
 */
export function readSystemLocale(): string | undefined {
	try {
		return Intl.DateTimeFormat().resolvedOptions().locale;
	} catch {
		return undefined;
	}
}
