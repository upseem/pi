import { APP_NAME } from "../config.ts";
import { t } from "./i18n/index.ts";
import type { SourceInfo } from "./source-info.ts";

export type SlashCommandSource = "extension" | "prompt" | "skill";

export interface SlashCommandInfo {
	name: string;
	description?: string;
	source: SlashCommandSource;
	sourceInfo: SourceInfo;
}

export interface BuiltinSlashCommand {
	name: string;
	description: string;
	argumentHint?: string;
}

/**
 * Built-in slash commands. Descriptions resolve via the ambient locale at access time
 * so `/lang` switches update autocomplete after refreshLocaleChrome.
 */
export const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand> = [
	{
		name: "settings",
		get description() {
			return t("slash.settings.description");
		},
	},
	{
		name: "lang",
		get description() {
			return t("slash.lang.description");
		},
	},
	{
		name: "model",
		get description() {
			return t("slash.model.description");
		},
		argumentHint: "<provider/model>",
	},
	{
		name: "tree",
		get description() {
			return t("slash.tree.description");
		},
	},
	{
		name: "thinking",
		get description() {
			return t("slash.thinking.description");
		},
		argumentHint: "<level>",
	},
	{
		name: "scoped-models",
		get description() {
			return t("slash.scoped-models.description");
		},
	},
	{
		name: "export",
		get description() {
			return t("slash.export.description");
		},
	},
	{
		name: "import",
		get description() {
			return t("slash.import.description");
		},
	},
	{
		name: "share",
		get description() {
			return t("slash.share.description");
		},
	},
	{
		name: "copy",
		get description() {
			return t("slash.copy.description");
		},
	},
	{
		name: "name",
		get description() {
			return t("slash.name.description");
		},
	},
	{
		name: "session",
		get description() {
			return t("slash.session.description");
		},
	},
	{
		name: "changelog",
		get description() {
			return t("slash.changelog.description");
		},
	},
	{
		name: "hotkeys",
		get description() {
			return t("slash.hotkeys.description");
		},
	},
	{
		name: "fork",
		get description() {
			return t("slash.fork.description");
		},
	},
	{
		name: "clone",
		get description() {
			return t("slash.clone.description");
		},
	},
	{
		name: "trust",
		get description() {
			return t("slash.trust.description");
		},
	},
	{
		name: "login",
		get description() {
			return t("slash.login.description");
		},
		argumentHint: "<provider>",
	},
	{
		name: "logout",
		get description() {
			return t("slash.logout.description");
		},
	},
	{
		name: "new",
		get description() {
			return t("slash.new.description");
		},
	},
	{
		name: "compact",
		get description() {
			return t("slash.compact.description");
		},
	},
	{
		name: "resume",
		get description() {
			return t("slash.resume.description");
		},
	},
	{
		name: "reload",
		get description() {
			return t("slash.reload.description");
		},
	},
	{
		name: "quit",
		get description() {
			return t("slash.quit.description", { appName: APP_NAME });
		},
	},
];
