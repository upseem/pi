import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { platform } from "os";
import { join } from "path";
import { getBinDir } from "../config.ts";

const TOOLS_DIR = getBinDir();

interface ToolConfig {
	name: string;
	binaryName: string;
	systemBinaryNames?: string[];
	installHint: string;
}

const TOOLS: Record<string, ToolConfig> = {
	fd: {
		name: "fd",
		binaryName: "fd",
		systemBinaryNames: ["fd", "fdfind"],
		installHint: "brew install fd",
	},
	rg: {
		name: "ripgrep",
		binaryName: "rg",
		installHint: "brew install ripgrep",
	},
};

function commandExists(cmd: string): boolean {
	try {
		const result = spawnSync(cmd, ["--version"], { stdio: "pipe" });
		return result.error === undefined || result.error === null;
	} catch {
		return false;
	}
}

export function getToolPath(tool: "fd" | "rg"): string | null {
	const config = TOOLS[tool];
	if (!config) return null;

	const localPath = join(TOOLS_DIR, config.binaryName);
	if (existsSync(localPath)) {
		return localPath;
	}

	const systemBinaryNames = config.systemBinaryNames ?? [config.binaryName];
	for (const systemBinaryName of systemBinaryNames) {
		if (commandExists(systemBinaryName)) {
			return systemBinaryName;
		}
	}

	return null;
}

const TERMUX_PACKAGES: Record<string, string> = {
	fd: "fd",
	rg: "ripgrep",
};

export interface ToolStatus {
	type: "info" | "warning";
	message: string;
}

/**
 * Ensure a tool is available from PATH or the local bin dir.
 * Does not download binaries. Reports progress through `onStatus`.
 * Returns the tool path, or undefined if unavailable.
 */
export async function ensureTool(
	tool: "fd" | "rg",
	onStatus?: (status: ToolStatus) => void,
): Promise<string | undefined> {
	const existingPath = getToolPath(tool);
	if (existingPath) {
		return existingPath;
	}

	const config = TOOLS[tool];
	if (!config) return undefined;

	if (platform() === "android") {
		const pkgName = TERMUX_PACKAGES[tool] ?? tool;
		onStatus?.({ type: "warning", message: `${config.name} not found. Install with: pkg install ${pkgName}` });
		return undefined;
	}

	onStatus?.({
		type: "warning",
		message: `${config.name} not found. Install it locally (for example: ${config.installHint}).`,
	});
	return undefined;
}
