/**
 * CLI argument parsing and help display
 */

import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import chalk from "chalk";
import { APP_NAME, CONFIG_DIR_NAME, ENV_AGENT_DIR, ENV_SESSION_DIR } from "../config.ts";
import type { ExtensionFlag } from "../core/extensions/types.ts";
import type { TuiMode } from "../core/settings-manager.ts";

export type Mode = "text" | "json" | "rpc";

export interface Args {
	provider?: string;
	model?: string;
	apiKey?: string;
	systemPrompt?: string;
	appendSystemPrompt?: string[];
	thinking?: ThinkingLevel;
	continue?: boolean;
	resume?: boolean;
	help?: boolean;
	version?: boolean;
	mode?: Mode;
	name?: string;
	noSession?: boolean;
	session?: string;
	sessionId?: string;
	fork?: string;
	sessionDir?: string;
	models?: string[];
	tools?: string[];
	excludeTools?: string[];
	noTools?: boolean;
	noBuiltinTools?: boolean;
	extensions?: string[];
	noExtensions?: boolean;
	print?: boolean;
	export?: string;
	noSkills?: boolean;
	skills?: string[];
	promptTemplates?: string[];
	noPromptTemplates?: boolean;
	themes?: string[];
	useTheme?: string;
	noThemes?: boolean;
	noContextFiles?: boolean;
	listModels?: string | true;
	offline?: boolean;
	tuiMode?: TuiMode;
	verbose?: boolean;
	projectTrustOverride?: boolean;
	messages: string[];
	fileArgs: string[];
	/** Unknown flags (potentially extension flags) - map of flag name to value */
	unknownFlags: Map<string, boolean | string>;
	diagnostics: Array<{ type: "warning" | "error"; message: string }>;
}

const VALID_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export function isValidThinkingLevel(level: string): level is ThinkingLevel {
	return VALID_THINKING_LEVELS.includes(level as ThinkingLevel);
}

export function normalizeSessionName(value: string): string | undefined {
	const name = value.trim();
	return name.length > 0 ? name : undefined;
}

export function parseArgs(args: string[]): Args {
	const result: Args = {
		messages: [],
		fileArgs: [],
		unknownFlags: new Map(),
		diagnostics: [],
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--") {
			for (const positionalArg of args.slice(i + 1)) {
				if (positionalArg.startsWith("@")) {
					result.fileArgs.push(positionalArg.slice(1));
				} else {
					result.messages.push(positionalArg);
				}
			}
			break;
		} else if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else if (arg === "--version" || arg === "-v") {
			result.version = true;
		} else if (arg === "--mode" && i + 1 < args.length) {
			const mode = args[++i];
			if (mode === "text" || mode === "json" || mode === "rpc") {
				result.mode = mode;
			}
		} else if (arg === "--continue" || arg === "-c") {
			result.continue = true;
		} else if (arg === "--resume" || arg === "-r") {
			result.resume = true;
		} else if (arg === "--provider" && i + 1 < args.length) {
			result.provider = args[++i];
		} else if (arg === "--model" && i + 1 < args.length) {
			result.model = args[++i];
		} else if (arg === "--api-key" && i + 1 < args.length) {
			result.apiKey = args[++i];
		} else if (arg === "--system-prompt" && i + 1 < args.length) {
			result.systemPrompt = args[++i];
		} else if (arg === "--append-system-prompt" && i + 1 < args.length) {
			result.appendSystemPrompt = result.appendSystemPrompt ?? [];
			result.appendSystemPrompt.push(args[++i]);
		} else if (arg === "--name" || arg === "-n") {
			if (i + 1 < args.length) {
				result.name = args[++i];
			} else {
				result.diagnostics.push({ type: "error", message: "--name requires a value" });
			}
		} else if (arg === "--no-session") {
			result.noSession = true;
		} else if (arg === "--session" && i + 1 < args.length) {
			result.session = args[++i];
		} else if (arg === "--session-id" && i + 1 < args.length) {
			result.sessionId = args[++i];
		} else if (arg === "--fork" && i + 1 < args.length) {
			result.fork = args[++i];
		} else if (arg === "--session-dir" && i + 1 < args.length) {
			result.sessionDir = args[++i];
		} else if (arg === "--models" && i + 1 < args.length) {
			result.models = args[++i].split(",").map((s) => s.trim());
		} else if (arg === "--no-tools" || arg === "-nt") {
			result.noTools = true;
		} else if (arg === "--no-builtin-tools" || arg === "-nbt") {
			result.noBuiltinTools = true;
		} else if ((arg === "--tools" || arg === "-t") && i + 1 < args.length) {
			result.tools = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((name) => name.length > 0);
		} else if ((arg === "--exclude-tools" || arg === "-xt") && i + 1 < args.length) {
			result.excludeTools = args[++i]
				.split(",")
				.map((s) => s.trim())
				.filter((name) => name.length > 0);
		} else if (arg === "--thinking" && i + 1 < args.length) {
			const level = args[++i];
			if (isValidThinkingLevel(level)) {
				result.thinking = level;
			} else {
				result.diagnostics.push({
					type: "warning",
					message: `Invalid thinking level "${level}". Valid values: ${VALID_THINKING_LEVELS.join(", ")}`,
				});
			}
		} else if (arg === "--print" || arg === "-p") {
			result.print = true;
			const next = args[i + 1];
			if (next !== undefined && !next.startsWith("@") && (!next.startsWith("-") || next.startsWith("---"))) {
				result.messages.push(next);
				i++;
			}
		} else if (arg === "--export" && i + 1 < args.length) {
			result.export = args[++i];
		} else if ((arg === "--extension" || arg === "-e") && i + 1 < args.length) {
			result.extensions = result.extensions ?? [];
			result.extensions.push(args[++i]);
		} else if (arg === "--no-extensions" || arg === "-ne") {
			result.noExtensions = true;
		} else if (arg === "--skill" && i + 1 < args.length) {
			result.skills = result.skills ?? [];
			result.skills.push(args[++i]);
		} else if (arg === "--prompt-template" && i + 1 < args.length) {
			result.promptTemplates = result.promptTemplates ?? [];
			result.promptTemplates.push(args[++i]);
		} else if (arg === "--theme" && i + 1 < args.length) {
			result.themes = result.themes ?? [];
			result.themes.push(args[++i]);
		} else if (arg === "--use-theme") {
			const themeName = args[i + 1];
			if (themeName === undefined || themeName.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: "--use-theme requires a theme name" });
			} else {
				result.useTheme = themeName;
				i++;
			}
		} else if (arg === "--no-skills" || arg === "-ns") {
			result.noSkills = true;
		} else if (arg === "--no-prompt-templates" || arg === "-np") {
			result.noPromptTemplates = true;
		} else if (arg === "--no-themes") {
			result.noThemes = true;
		} else if (arg === "--no-context-files" || arg === "-nc") {
			result.noContextFiles = true;
		} else if (arg === "--list-models") {
			// Check if next arg is a search pattern (not a flag or file arg)
			if (i + 1 < args.length && !args[i + 1].startsWith("-") && !args[i + 1].startsWith("@")) {
				result.listModels = args[++i];
			} else {
				result.listModels = true;
			}
		} else if (arg === "--tui-mode") {
			const mode = args[i + 1];
			if (mode === "regular" || mode === "fullscreen") {
				result.tuiMode = mode;
				i++;
			} else if (mode === undefined || mode.startsWith("-")) {
				result.diagnostics.push({ type: "error", message: "--tui-mode requires regular or fullscreen" });
			} else {
				i++;
				result.diagnostics.push({
					type: "error",
					message: `Invalid TUI mode "${mode}". Valid values: regular, fullscreen`,
				});
			}
		} else if (arg === "--verbose") {
			result.verbose = true;
		} else if (arg === "--approve" || arg === "-a") {
			result.projectTrustOverride = true;
		} else if (arg === "--no-approve" || arg === "-na") {
			result.projectTrustOverride = false;
		} else if (arg === "--offline") {
			result.offline = true;
		} else if (arg.startsWith("@")) {
			result.fileArgs.push(arg.slice(1)); // Remove @ prefix
		} else if (arg.startsWith("--")) {
			const eqIndex = arg.indexOf("=");
			if (eqIndex !== -1) {
				result.unknownFlags.set(arg.slice(2, eqIndex), arg.slice(eqIndex + 1));
			} else {
				const flagName = arg.slice(2);
				const next = args[i + 1];
				if (next !== undefined && !next.startsWith("-") && !next.startsWith("@")) {
					result.unknownFlags.set(flagName, next);
					i++;
				} else {
					result.unknownFlags.set(flagName, true);
				}
			}
		} else if (arg.startsWith("-") && !arg.startsWith("--")) {
			result.diagnostics.push({ type: "error", message: `Unknown option: ${arg}` });
		} else if (!arg.startsWith("-")) {
			result.messages.push(arg);
		}
	}

	return result;
}

export function printHelp(extensionFlags?: ExtensionFlag[]): void {
	const extensionFlagsText =
		extensionFlags && extensionFlags.length > 0
			? `\n${chalk.bold("Extension CLI Flags:")}\n${extensionFlags
					.map((flag) => {
						const value = flag.type === "string" ? " <value>" : "";
						const description = flag.description ?? `由 ${flag.extensionPath} 注册`;
						return `  --${flag.name}${value}`.padEnd(30) + description;
					})
					.join("\n")}\n`
			: "";
	console.log(`${chalk.bold(APP_NAME)} - 带 read、bash、edit、write 工具的 AI 编码助手

${chalk.bold("用法:")}
  ${APP_NAME} [options] [--] [@files...] [messages...]

${chalk.bold("命令:")}
  ${APP_NAME} install <source> [-l]     安装扩展源并写入设置
  ${APP_NAME} remove <source> [-l]      从设置中移除扩展源
  ${APP_NAME} uninstall <source> [-l]   remove 的别名
  ${APP_NAME} update [source|self|pi]   更新 pi、扩展或模型目录
  ${APP_NAME} list                      列出设置中已安装的扩展
  ${APP_NAME} config [-l]               打开 TUI 启用/禁用包资源（Tab 切换范围）
  ${APP_NAME} auth <command>            打印凭据或检查提供商是否就绪
  ${APP_NAME} <command> --help          显示 install/remove/uninstall/update/list/config/auth 的帮助

${chalk.bold("选项:")}
  --provider <name>              提供商名称（默认：google）
  --model <pattern>              模型模式或 ID（支持 "provider/id"，以及可选的 ":<thinking>"）
  --api-key <key>                API key（默认从环境变量读取）
  --system-prompt <text>         系统提示（默认：编码助手提示）
  --append-system-prompt <text>  把文本或文件内容追加到系统提示（可多次使用）
  --mode <mode>                  输出模式：text（默认）、json 或 rpc
  --print, -p                    非交互模式：处理提示后退出
  --continue, -c                 继续上一次会话
  --resume, -r                   选择要恢复的会话
  --session <path|id>            使用指定会话文件或部分 UUID
  --session-id <id>              使用精确的项目会话 ID，不存在则创建
  --fork <path|id>               把指定会话文件或部分 UUID fork 成新会话
  --session-dir <dir>            会话存储和查找目录
  --no-session                   不保存会话（临时）
  --name, -n <name>              设置会话显示名称
  --models <patterns>            用逗号分隔的模型模式，供 Ctrl+P 循环切换
                                 支持 glob（anthropic/*、*sonnet*）和模糊匹配
  --no-tools, -nt                默认禁用所有工具（内置和扩展）
  --no-builtin-tools, -nbt       默认禁用内置工具，但保留扩展/自定义工具
  --tools, -t <tools>            用逗号分隔的工具名允许列表
                                 适用于内置、扩展和自定义工具
  --exclude-tools, -xt <tools>   用逗号分隔的工具名拒绝列表
                                 适用于内置、扩展和自定义工具
  --thinking <level>             设置思考级别：off、minimal、low、medium、high、xhigh、max
  --extension, -e <path>         加载扩展文件（可多次使用）
  --no-extensions, -ne           禁用扩展发现（显式 -e 路径仍有效）
  --skill <path>                 加载 skill 文件或目录（可多次使用）
  --no-skills, -ns               禁用 skill 发现和加载
  --prompt-template <path>       加载提示模板文件或目录（可多次使用）
  --no-prompt-templates, -np     禁用提示模板发现和加载
  --theme <path>                 加载主题文件或目录（可多次使用）
  --use-theme <name[/name]>      设置本次运行的初始交互主题
  --no-themes                    禁用主题发现和加载
  --no-context-files, -nc        禁用 AGENTS.md 和 CLAUDE.md 的发现和加载
  --export <file>                将会话文件导出为 HTML 后退出
  --list-models [search]         列出可用模型（可带模糊搜索）
  --verbose                      强制详细启动（覆盖 quietStartup 设置）
  --tui-mode <mode>              TUI 模式：regular（默认）或 fullscreen
  --approve, -a                  本次运行信任项目本地文件
  --no-approve, -na              本次运行忽略项目本地文件
  --offline                      禁用启动时的网络操作（等同于 PI_OFFLINE=1）
  --                             结束选项解析；其余参数当作消息/文件
  --help, -h                     显示此帮助
  --version, -v                  显示版本号

扩展可以注册额外标志（例如 plan-mode 扩展的 --plan）。${extensionFlagsText}

${chalk.bold("示例:")}
  # 为外部客户端打印提供商 API key
  ${APP_NAME} auth print-api-key --provider openai

  # 为外部客户端打印 OAuth bearer token（过期则刷新）
  ${APP_NAME} auth print-bearer-token --provider openai-codex

  # 交互模式
  ${APP_NAME}

  # 带初始提示的交互模式
  ${APP_NAME} "List all .ts files in src/"

  # 在初始消息中附带文件
  ${APP_NAME} @prompt.md @image.png "What color is the sky?"

  # 非交互模式（处理后退出）
  ${APP_NAME} -p "List all .ts files in src/"

  # 以短横线开头的提示
  ${APP_NAME} -p -- "- Summarize these points"

  # 多条消息（交互）
  ${APP_NAME} "Read package.json" "What dependencies do we have?"

  # 继续上一次会话
  ${APP_NAME} --continue "What did we discuss?"

  # 启动一个命名会话
  ${APP_NAME} --name "Refactor auth module"

  # 使用其他模型
  ${APP_NAME} --provider openai --model gpt-4o-mini "Help me refactor this code"

  # 用提供商前缀指定模型（不需要 --provider）
  ${APP_NAME} --model openai/gpt-4o "Help me refactor this code"

  # 用思考级别简写指定模型
  ${APP_NAME} --model sonnet:high "Solve this complex problem"

  # 把模型循环限制到指定模型
  ${APP_NAME} --models claude-sonnet,claude-haiku,gpt-4o

  # 用 glob 限制到某个提供商
  ${APP_NAME} --models "github-copilot/*"

  # 按固定思考级别循环模型
  ${APP_NAME} --models sonnet:high,haiku:low

  # 以指定思考级别启动
  ${APP_NAME} --thinking high "Solve this complex problem"

  # 只读模式（无法修改文件）
  ${APP_NAME} --tools read,grep,find,ls -p "Review the code in src/"

  # 禁用某一个工具，其余保持可用
  ${APP_NAME} --exclude-tools ask_question

  # 将会话文件导出为 HTML
  ${APP_NAME} --export ~/${CONFIG_DIR_NAME}/agent/sessions/--path--/session.jsonl
  ${APP_NAME} --export session.jsonl output.html

${chalk.bold("环境变量:")}
  ANTHROPIC_AUTH_TOKEN             - Anthropic bearer 认证 token
  ANTHROPIC_API_KEY                - Anthropic Claude API key
  ANTHROPIC_OAUTH_TOKEN            - Anthropic OAuth token（API key 的替代）
  ANT_LING_API_KEY                 - Ant Ling API key
  OPENAI_API_KEY                   - OpenAI GPT API key
  AZURE_OPENAI_API_KEY             - Azure OpenAI API key
  AZURE_OPENAI_BASE_URL            - Azure OpenAI/Cognitive Services 基址（例如 https://{resource}.openai.azure.com）
  AZURE_OPENAI_RESOURCE_NAME       - Azure OpenAI 资源名（基址的替代）
  AZURE_OPENAI_API_VERSION         - Azure OpenAI API 版本（默认：v1）
  AZURE_OPENAI_DEPLOYMENT_NAME_MAP - Azure OpenAI 的 model=deployment 映射（逗号分隔）
  DEEPSEEK_API_KEY                 - DeepSeek API key
  NVIDIA_API_KEY                   - NVIDIA NIM API key
  GEMINI_API_KEY                   - Google Gemini API key
  GROQ_API_KEY                     - Groq API key
  CEREBRAS_API_KEY                 - Cerebras API key
  XAI_API_KEY                      - xAI Grok API key
  FIREWORKS_API_KEY                - Fireworks API key
  TOGETHER_API_KEY                 - Together AI API key
  BASETEN_API_KEY                  - Baseten API key
  OPENROUTER_API_KEY               - OpenRouter API key
  AI_GATEWAY_API_KEY               - Vercel AI Gateway API key
  ZAI_API_KEY                      - ZAI Coding Plan API key（国际）
  ZAI_CODING_CN_API_KEY            - ZAI Coding Plan API key（中国）
  MISTRAL_API_KEY                  - Mistral API key
  MINIMAX_API_KEY                  - MiniMax API key
  MOONSHOT_API_KEY                 - Moonshot AI API key
  OPENCODE_API_KEY                 - OpenCode Zen/OpenCode Go API key
  KIMI_API_KEY                     - Kimi For Coding API key
  CLOUDFLARE_API_KEY               - Cloudflare API token（Workers AI 和 AI Gateway）
  CLOUDFLARE_ACCOUNT_ID            - Cloudflare 账户 id（两者都需要）
  CLOUDFLARE_GATEWAY_ID            - Cloudflare AI Gateway slug（AI Gateway 需要）
  QWEN_TOKEN_PLAN_API_KEY          - Qwen Token Plan API key（国际区）
  QWEN_TOKEN_PLAN_CN_API_KEY       - Qwen Token Plan API key（中国区）
  XIAOMI_API_KEY                   - Xiaomi MiMo API key（api.xiaomimimo.com 计费）
  XIAOMI_TOKEN_PLAN_CN_API_KEY     - Xiaomi MiMo Token Plan API key（中国区）
  XIAOMI_TOKEN_PLAN_AMS_API_KEY    - Xiaomi MiMo Token Plan API key（阿姆斯特丹区）
  XIAOMI_TOKEN_PLAN_SGP_API_KEY    - Xiaomi MiMo Token Plan API key（新加坡区）
  AWS_PROFILE                      - Amazon Bedrock 的 AWS profile
  AWS_ACCESS_KEY_ID                - Amazon Bedrock 的 AWS access key
  AWS_SECRET_ACCESS_KEY            - Amazon Bedrock 的 AWS secret key
  AWS_BEARER_TOKEN_BEDROCK         - Bedrock API key（bearer token）
  AWS_REGION                       - Amazon Bedrock 的 AWS 区域（例如 us-east-1）
  ${ENV_AGENT_DIR.padEnd(32)} - 配置目录（默认：~/${CONFIG_DIR_NAME}/agent）
  ${ENV_SESSION_DIR.padEnd(32)} - 会话存储目录（会被 --session-dir 覆盖）
  PI_PACKAGE_DIR                   - 覆盖包目录（用于 Nix/Guix store 路径）
  PI_SERVER_DIR                    - 实验性服务器配置和 socket 目录（默认：~/.pi/server）
  PI_SERVER_ID                     - 实验性服务器逻辑 ID（可由 --server-id 覆盖）
  PI_OFFLINE                       - 设为 1/true/yes 时禁用启动时的网络操作
  PI_TELEMETRY                     - 设为 1/true/yes 或 0/false/no 时覆盖安装遥测
  PI_SHARE_VIEWER_URL              - /share 命令的基址（默认：https://pi.dev/session/）

${chalk.bold("内置工具名:")}
  read       - 读取文件内容
  bash       - 执行 bash 命令
  edit       - 用查找/替换编辑文件
  write      - 写入文件（创建/覆盖）
  grep       - 搜索文件内容（只读，默认关闭）
  find       - 按 glob 查找文件（只读，默认关闭）
  ls         - 列出目录内容（只读，默认关闭）
`);
}
