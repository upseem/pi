import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("built-in slash commands", () => {
	it("uses Chinese descriptions in the command selector", () => {
		for (const command of BUILTIN_SLASH_COMMANDS) {
			expect(command.description, command.name).toMatch(/\p{Script=Han}/u);
		}
	});
});
