import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("./check-i18n.mjs", import.meta.url));

async function writeTree(root, files) {
	for (const [relativePath, contents] of Object.entries(files)) {
		const fullPath = join(root, relativePath);
		await mkdir(join(fullPath, ".."), { recursive: true });
		await writeFile(fullPath, contents);
	}
}

function runCheck(root) {
	return spawnSync(process.execPath, [script, "--root", root], {
		cwd: root,
		encoding: "utf8",
	});
}

const validEn = `export const en = {
	"ok.key": "OK",
	"used.key": "Used",
} as const;
export type MessageKey = keyof typeof en;
`;

const validZh = `import type { MessageKey } from "./en.ts";
export const zhCN = {
	"ok.key": "好",
} as const satisfies Partial<Record<MessageKey, string>>;
`;

test("passes for a consistent catalog and allowed imports", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-check-i18n-ok-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeTree(root, {
		"packages/coding-agent/src/core/i18n/locales/en.ts": validEn,
		"packages/coding-agent/src/core/i18n/locales/zh-CN.ts": validZh,
		"packages/coding-agent/src/cli/help.ts": 'import { t } from "../core/i18n/index.ts";\nexport const x = t("ok.key") + t("used.key");\n',
		"packages/coding-agent/src/core/tools/renderers/bash.ts":
			'import { t } from "../../i18n/index.ts";\nexport const label = t("ok.key");\n',
	});
	const result = runCheck(root);
	assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("rejects unknown t() keys and zh-CN keys outside en", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-check-i18n-keys-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeTree(root, {
		"packages/coding-agent/src/core/i18n/locales/en.ts": validEn,
		"packages/coding-agent/src/core/i18n/locales/zh-CN.ts": `import type { MessageKey } from "./en.ts";
export const zhCN = {
	"ok.key": "好",
	"extra.zh": "多余",
} as const satisfies Partial<Record<MessageKey, string>>;
`,
		"packages/coding-agent/src/cli/help.ts":
			'import { t } from "../core/i18n/index.ts";\nexport const x = t("ok.key") + t("used.key") + t("missing.key");\n',
	});
	const result = runCheck(root);
	assert.equal(result.status, 1);
	assert.match(result.stderr, /unknown t\(\) key: missing\.key/);
	assert.match(result.stderr, /zh-CN key not in en: extra\.zh/);
});

test("rejects orphan en keys", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-check-i18n-orphan-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeTree(root, {
		"packages/coding-agent/src/core/i18n/locales/en.ts": `export const en = {
	"ok.key": "OK",
	"orphan.key": "Unused",
} as const;
export type MessageKey = keyof typeof en;
`,
		"packages/coding-agent/src/core/i18n/locales/zh-CN.ts": validZh,
		"packages/coding-agent/src/cli/help.ts": 'import { t } from "../core/i18n/index.ts";\nexport const x = t("ok.key");\n',
	});
	const result = runCheck(root);
	assert.equal(result.status, 1);
	assert.match(result.stderr, /orphan en key: orphan\.key/);
});

test("rejects core/i18n imports in forbidden paths", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-check-i18n-forbid-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeTree(root, {
		"packages/coding-agent/src/core/i18n/locales/en.ts": validEn,
		"packages/coding-agent/src/core/i18n/locales/zh-CN.ts": validZh,
		"packages/coding-agent/src/cli/help.ts":
			'import { t } from "../core/i18n/index.ts";\nexport const x = t("ok.key") + t("used.key");\n',
		"packages/coding-agent/src/core/system-prompt.ts": 'import { t } from "./i18n/index.ts";\n',
		"packages/coding-agent/src/core/tools/bash.ts": 'import { t } from "../i18n/index.ts";\n',
		"packages/coding-agent/src/modes/rpc/rpc-mode.ts": 'import { t } from "../../core/i18n/index.ts";\n',
		"packages/coding-agent/src/modes/json-event.ts": 'import { t } from "../core/i18n/index.ts";\n',
		"packages/coding-agent/src/core/session-manager.ts": 'import { t } from "./i18n/index.ts";\n',
		"packages/coding-agent/src/core/telemetry.ts": 'import { t } from "./i18n/index.ts";\n',
	});
	const result = runCheck(root);
	assert.equal(result.status, 1);
	for (const path of [
		"core/system-prompt.ts",
		"core/tools/bash.ts",
		"modes/rpc/rpc-mode.ts",
		"modes/json-event.ts",
		"core/session-manager.ts",
		"core/telemetry.ts",
	]) {
		assert.match(result.stderr, new RegExp(`forbidden i18n import: .*${path.replaceAll(".", "\\.")}`));
	}
});
