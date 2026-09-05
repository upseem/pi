import type { NonSharedBuffer } from "node:buffer";
import type * as ChildProcess from "node:child_process";
import type * as Fs from "node:fs";
import { type SpawnSyncReturns, spawnSync } from "child_process";
import { existsSync } from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureTool, getToolPath, type ToolStatus } from "../src/utils/tools-manager.ts";

vi.mock("fs", async (importOriginal) => {
	const actual = await importOriginal<typeof Fs>();
	return {
		...actual,
		existsSync: vi.fn(() => false),
	};
});

vi.mock("child_process", async (importOriginal) => {
	const actual = await importOriginal<typeof ChildProcess>();
	return {
		...actual,
		spawnSync: vi.fn(() => ({ error: new Error("not found") })),
	};
});

afterEach(() => {
	vi.mocked(existsSync).mockReturnValue(false);
	vi.clearAllMocks();
});

describe("getToolPath", () => {
	it("prefers a system command over a managed binary", () => {
		const existsSyncMock = vi.mocked(existsSync);
		const empty = Buffer.alloc(0);
		const success: SpawnSyncReturns<NonSharedBuffer> = {
			pid: 1,
			output: [null, empty, empty],
			stdout: empty,
			stderr: empty,
			status: 0,
			signal: null,
		};
		vi.mocked(spawnSync).mockReturnValueOnce(success);
		existsSyncMock.mockClear();
		existsSyncMock.mockReturnValue(true);

		expect(getToolPath("rg")).toBe("rg");
		expect(existsSyncMock).not.toHaveBeenCalled();
	});
});

describe("ensureTool", () => {
	it("reports status through a callback without writing to the console", async () => {
		const statuses: ToolStatus[] = [];
		const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

		const result = await ensureTool("fd", (status) => statuses.push(status));

		expect(result).toBeUndefined();
		expect(statuses).toEqual([
			{
				type: "warning",
				message: "fd not found. Install it locally (for example: brew install fd).",
			},
		]);
		expect(consoleLog).not.toHaveBeenCalled();
		consoleLog.mockRestore();
	});

	it("does not download ripgrep from GitHub when it is missing", async () => {
		const statuses: ToolStatus[] = [];
		const fetchMock = vi.spyOn(globalThis, "fetch");

		const result = await ensureTool("rg", (status) => statuses.push(status));

		expect(result).toBeUndefined();
		expect(statuses).toEqual([
			{
				type: "warning",
				message: "ripgrep not found. Install it locally (for example: brew install ripgrep).",
			},
		]);
		expect(fetchMock).not.toHaveBeenCalled();
		fetchMock.mockRestore();
	});
});
