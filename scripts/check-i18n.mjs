#!/usr/bin/env node

/**
 * Coding-agent i18n gate:
 * - every t("...") / t('...') key must exist in the en catalog
 * - every en catalog key must be referenced by at least one t("...") call
 * - zh-CN keys must be a subset of en keys
 * - forbid core/i18n imports in system-prompt / tool schema / rpc / session / telemetry paths
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ignoredDirectories = new Set([".git", "coverage", "dist", "node_modules"]);

function parseArgs(argv) {
	let root = process.cwd();
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--root") {
			const value = argv[i + 1];
			if (!value) {
				console.error("check-i18n: --root requires a path");
				process.exit(2);
			}
			root = resolve(value);
			i++;
			continue;
		}
		if (arg.startsWith("--root=")) {
			root = resolve(arg.slice("--root=".length));
			continue;
		}
		console.error(`check-i18n: unknown argument: ${arg}`);
		process.exit(2);
	}
	return { root };
}

function toPosix(path) {
	return path.replaceAll("\\", "/");
}

function collectFiles(directory, extensions, out = []) {
	if (!existsSync(directory)) return out;
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const fullPath = join(directory, entry.name);
		if (entry.isDirectory()) {
			if (!ignoredDirectories.has(entry.name)) {
				collectFiles(fullPath, extensions, out);
			}
			continue;
		}
		if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
			out.push(fullPath);
		}
	}
	return out;
}

function extractCatalogKeys(source) {
	const keys = new Set();
	for (const match of source.matchAll(/^\s*"([^"\\]+)"\s*:/gm)) {
		keys.add(match[1]);
	}
	return keys;
}

function extractTKeys(source) {
	const keys = new Set();
	for (const match of source.matchAll(/\bt\(\s*(["'])([^"'\\]+)\1/g)) {
		keys.add(match[2]);
	}
	return keys;
}

function isI18nImportSpecifier(specifier) {
	const normalized = toPosix(specifier);
	return (
		/(^|\/)i18n(\/|$)/.test(normalized) ||
		normalized.endsWith("/i18n.ts") ||
		normalized.endsWith("/i18n.js")
	);
}

function hasI18nImport(source) {
	const patterns = [
		/\bfrom\s+["']([^"']+)["']/g,
		/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
		/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
	];
	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) {
			if (isI18nImportSpecifier(match[1])) return true;
		}
	}
	return false;
}

/**
 * Paths where UI i18n must not leak into model/protocol/session surfaces.
 * Tool renderers/ may import i18n for TUI labels.
 */
function isForbiddenI18nPath(relativePath) {
	const path = toPosix(relativePath);
	const prefix = "packages/coding-agent/src/";
	if (!path.startsWith(prefix)) return false;
	const rest = path.slice(prefix.length);

	if (rest === "core/system-prompt.ts") return true;
	if (rest.startsWith("modes/rpc/")) return true;
	if (rest === "modes/json-event.ts") return true;
	if (rest === "core/session-manager.ts") return true;
	if (rest === "core/telemetry.ts") return true;

	if (rest.startsWith("core/tools/")) {
		if (rest.startsWith("core/tools/renderers/")) return false;
		return true;
	}
	return false;
}

function main() {
	const { root } = parseArgs(process.argv.slice(2));
	const codingAgentSrc = join(root, "packages/coding-agent/src");
	const codingAgentTest = join(root, "packages/coding-agent/test");
	const enPath = join(codingAgentSrc, "core/i18n/locales/en.ts");
	const zhPath = join(codingAgentSrc, "core/i18n/locales/zh-CN.ts");

	const failures = [];

	if (!existsSync(enPath)) {
		failures.push(`missing en catalog: ${toPosix(relative(root, enPath))}`);
	}
	if (!existsSync(zhPath)) {
		failures.push(`missing zh-CN catalog: ${toPosix(relative(root, zhPath))}`);
	}

	if (failures.length > 0) {
		console.error("i18n check failed:");
		for (const failure of failures) console.error(`  ${failure}`);
		process.exit(1);
	}

	const enKeys = extractCatalogKeys(readFileSync(enPath, "utf8"));
	const zhKeys = extractCatalogKeys(readFileSync(zhPath, "utf8"));

	const usedKeys = new Set();
	const scanRoots = [codingAgentSrc, codingAgentTest];
	for (const scanRoot of scanRoots) {
		for (const file of collectFiles(scanRoot, [".ts"])) {
			const relativePath = toPosix(relative(root, file));
			if (relativePath.includes("/core/i18n/locales/")) continue;
			const source = readFileSync(file, "utf8");
			for (const key of extractTKeys(source)) {
				usedKeys.add(key);
			}
		}
	}

	for (const key of usedKeys) {
		if (!enKeys.has(key)) {
			failures.push(`unknown t() key: ${key}`);
		}
	}

	for (const key of enKeys) {
		if (!usedKeys.has(key)) {
			failures.push(`orphan en key: ${key}`);
		}
	}

	for (const key of zhKeys) {
		if (!enKeys.has(key)) {
			failures.push(`zh-CN key not in en: ${key}`);
		}
	}

	for (const file of collectFiles(codingAgentSrc, [".ts"])) {
		const relativePath = toPosix(relative(root, file));
		if (!isForbiddenI18nPath(relativePath)) continue;
		const source = readFileSync(file, "utf8");
		if (hasI18nImport(source)) {
			failures.push(`forbidden i18n import: ${relativePath}`);
		}
	}

	if (failures.length > 0) {
		console.error("i18n check failed:");
		for (const failure of failures.sort()) console.error(`  ${failure}`);
		process.exit(1);
	}

	console.log(
		`i18n check passed (${enKeys.size} en keys, ${zhKeys.size} zh-CN keys, ${usedKeys.size} t() keys).`,
	);
}

main();
