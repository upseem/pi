/**
 * English baseline catalog. MessageKey is derived from these keys.
 * Add new UI strings here first; other locales may be partial and fall back.
 */
export const en = {
	"cli.help.summary": "Coding agent CLI",
	"cli.help.header.usage": "Usage:",
	"cli.help.header.commands": "Commands:",
	"cli.help.header.options": "Options:",
	"cli.help.header.examples": "Examples:",
	"cli.help.header.env": "Environment Variables:",
	"cli.help.header.tools": "Built-in Tool Names:",
	"cli.help.header.extensionFlags": "Extension CLI Flags:",
	"cli.help.extensionFlag.registeredBy": "Registered by {path}",
	"cli.help.body": `{appNameBold} - AI coding assistant with read, bash, edit, write tools

{hUsage}
  {appName} [options] [--] [@files...] [messages...]

{hCommands}
  {appName} install <source> [-l]     Install extension source and add to settings
  {appName} remove <source> [-l]      Remove extension source from settings
  {appName} uninstall <source> [-l]   Alias for remove
  {appName} update [source|self|pi]   Update pi, extensions, or model catalogs
  {appName} list                      List installed extensions from settings
  {appName} config [-l]               Open TUI to enable/disable package resources (Tab switches scope)
  {appName} auth <command>            Print credentials or check provider readiness
  {appName} <command> --help          Show help for install/remove/uninstall/update/list/config/auth

{hOptions}
  --provider <name>              Provider name (default: google)
  --model <pattern>              Model pattern or ID (supports "provider/id" and optional ":<thinking>")
  --api-key <key>                API key (defaults to env vars)
  --system-prompt <text>         System prompt (default: coding assistant prompt)
  --append-system-prompt <text>  Append text or file contents to the system prompt (can be used multiple times)
  --mode <mode>                  Output mode: text (default), json, or rpc
  --print, -p                    Non-interactive mode: process prompt and exit
  --continue, -c                 Continue previous session
  --resume, -r                   Select a session to resume
  --session <path|id>            Use specific session file or partial UUID
  --session-id <id>              Use exact project session ID, creating it if missing
  --fork <path|id>               Fork specific session file or partial UUID into a new session
  --session-dir <dir>            Directory for session storage and lookup
  --no-session                   Don't save session (ephemeral)
  --name, -n <name>              Set session display name
  --models <patterns>            Comma-separated model patterns for Ctrl+P cycling
                                 Supports globs (anthropic/*, *sonnet*) and fuzzy matching
  --no-tools, -nt                Disable all tools by default (built-in and extension)
  --no-builtin-tools, -nbt       Disable built-in tools by default but keep extension/custom tools enabled
  --tools, -t <tools>            Comma-separated allowlist of tool names to enable
                                 Applies to built-in, extension, and custom tools
  --exclude-tools, -xt <tools>   Comma-separated denylist of tool names to disable
                                 Applies to built-in, extension, and custom tools
  --thinking <level>             Set thinking level: off, minimal, low, medium, high, xhigh, max
  --extension, -e <path>         Load an extension file (can be used multiple times)
  --no-extensions, -ne           Disable extension discovery (explicit -e paths still work)
  --skill <path>                 Load a skill file or directory (can be used multiple times)
  --no-skills, -ns               Disable skills discovery and loading
  --prompt-template <path>       Load a prompt template file or directory (can be used multiple times)
  --no-prompt-templates, -np     Disable prompt template discovery and loading
  --theme <path>                 Load a theme file or directory (can be used multiple times)
  --use-theme <name[/name]>      Set the initial interactive theme for this run
  --lang auto|en|zh-CN           Set UI language for this run (auto detects from system locale)
  --no-themes                    Disable theme discovery and loading
  --no-context-files, -nc        Disable AGENTS.md and CLAUDE.md discovery and loading
  --export <file>                Export session file to HTML and exit
  --list-models [search]         List available models (with optional fuzzy search)
  --verbose                      Force verbose startup (overrides quietStartup setting)
  --tui-mode <mode>              TUI mode: regular (default) or fullscreen
  --approve, -a                  Trust project-local files for this run
  --no-approve, -na              Ignore project-local files for this run
  --offline                      Disable startup network operations (same as PI_OFFLINE=1)
  --                             End option parsing; treat remaining arguments as messages/files
  --help, -h                     Show this help
  --version, -v                  Show version number

Extensions can register additional flags (e.g., --plan from plan-mode extension).{extensionFlags}

{hExamples}
  # Print a provider API key for an external client
  {appName} auth print-api-key --provider openai

  # Print an OAuth bearer token for an external client (refreshes if expired)
  {appName} auth print-bearer-token --provider openai-codex

  # Interactive mode
  {appName}

  # Interactive mode with initial prompt
  {appName} "List all .ts files in src/"

  # Include files in initial message
  {appName} @prompt.md @image.png "What color is the sky?"

  # Non-interactive mode (process and exit)
  {appName} -p "List all .ts files in src/"

  # Prompt beginning with a dash
  {appName} -p -- "- Summarize these points"

  # Multiple messages (interactive)
  {appName} "Read package.json" "What dependencies do we have?"

  # Continue previous session
  {appName} --continue "What did we discuss?"

  # Start a named session
  {appName} --name "Refactor auth module"

  # Use different model
  {appName} --provider openai --model gpt-4o-mini "Help me refactor this code"

  # Use model with provider prefix (no --provider needed)
  {appName} --model openai/gpt-4o "Help me refactor this code"

  # Use model with thinking level shorthand
  {appName} --model sonnet:high "Solve this complex problem"

  # Limit model cycling to specific models
  {appName} --models claude-sonnet,claude-haiku,gpt-4o

  # Limit to a specific provider with glob pattern
  {appName} --models "github-copilot/*"

  # Cycle models with fixed thinking levels
  {appName} --models sonnet:high,haiku:low

  # Start with a specific thinking level
  {appName} --thinking high "Solve this complex problem"

  # Read-only mode (no file modifications possible)
  {appName} --tools read,grep,find,ls -p "Review the code in src/"

  # Disable one tool while keeping the rest available
  {appName} --exclude-tools ask_question

  # Export a session file to HTML
  {appName} --export ~/{configDirName}/agent/sessions/--path--/session.jsonl
  {appName} --export session.jsonl output.html

{hEnv}
  ANTHROPIC_AUTH_TOKEN             - Anthropic bearer auth token
  ANTHROPIC_API_KEY                - Anthropic Claude API key
  ANTHROPIC_OAUTH_TOKEN            - Anthropic OAuth token (alternative to API key)
  ANT_LING_API_KEY                 - Ant Ling API key
  OPENAI_API_KEY                   - OpenAI GPT API key
  AZURE_OPENAI_API_KEY             - Azure OpenAI API key
  AZURE_OPENAI_BASE_URL            - Azure OpenAI/Cognitive Services base URL (e.g. https://{resource}.openai.azure.com)
  AZURE_OPENAI_RESOURCE_NAME       - Azure OpenAI resource name (alternative to base URL)
  AZURE_OPENAI_API_VERSION         - Azure OpenAI API version (default: v1)
  AZURE_OPENAI_DEPLOYMENT_NAME_MAP - Azure OpenAI model=deployment map (comma-separated)
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
  ZAI_API_KEY                      - ZAI Coding Plan API key (Global)
  ZAI_CODING_CN_API_KEY            - ZAI Coding Plan API key (China)
  MISTRAL_API_KEY                  - Mistral API key
  MINIMAX_API_KEY                  - MiniMax API key
  MOONSHOT_API_KEY                 - Moonshot AI API key
  OPENCODE_API_KEY                 - OpenCode Zen/OpenCode Go API key
  KIMI_API_KEY                     - Kimi For Coding API key
  CLOUDFLARE_API_KEY               - Cloudflare API token (Workers AI and AI Gateway)
  CLOUDFLARE_ACCOUNT_ID            - Cloudflare account id (required for both)
  CLOUDFLARE_GATEWAY_ID            - Cloudflare AI Gateway slug (required for AI Gateway)
  QWEN_TOKEN_PLAN_API_KEY          - Qwen Token Plan API key (international region)
  QWEN_TOKEN_PLAN_CN_API_KEY       - Qwen Token Plan API key (China region)
  XIAOMI_API_KEY                   - Xiaomi MiMo API key (api.xiaomimimo.com billing)
  XIAOMI_TOKEN_PLAN_CN_API_KEY     - Xiaomi MiMo Token Plan API key (China region)
  XIAOMI_TOKEN_PLAN_AMS_API_KEY    - Xiaomi MiMo Token Plan API key (Amsterdam region)
  XIAOMI_TOKEN_PLAN_SGP_API_KEY    - Xiaomi MiMo Token Plan API key (Singapore region)
  AWS_PROFILE                      - AWS profile for Amazon Bedrock
  AWS_ACCESS_KEY_ID                - AWS access key for Amazon Bedrock
  AWS_SECRET_ACCESS_KEY            - AWS secret key for Amazon Bedrock
  AWS_BEARER_TOKEN_BEDROCK         - Bedrock API key (bearer token)
  AWS_REGION                       - AWS region for Amazon Bedrock (e.g., us-east-1)
  {envAgentDir} - Config directory (default: ~/{configDirName}/agent)
  {envSessionDir} - Session storage directory (overridden by --session-dir)
  PI_PACKAGE_DIR                   - Override package directory (for Nix/Guix store paths)
  PI_SERVER_DIR                    - Experimental server config and socket directory (default: ~/.pi/server)
  PI_SERVER_ID                     - Experimental server logical ID (overridable by --server-id)
  PI_OFFLINE                       - Disable startup network operations when set to 1/true/yes
  PI_TELEMETRY                     - Override install telemetry when set to 1/true/yes or 0/false/no
  PI_SHARE_VIEWER_URL              - Base URL for /share command (default: https://pi.dev/session/)

{hTools}
  read       - Read file contents
  bash       - Execute bash commands
  powershell - Execute PowerShell commands on Windows
  edit       - Edit files with find/replace
  write      - Write files (creates/overwrites)
  grep       - Search file contents (read-only, off by default)
  find       - Find files by glob pattern (read-only, off by default)
  ls         - List directory contents (read-only, off by default)
`,
	"slash.settings.description": "Open settings menu",
	"slash.lang.description": "Switch UI language",
	"slash.model.description": "Select model (opens selector UI)",
	"slash.tree.description": "Navigate session tree (switch branches)",
	"slash.thinking.description": "Set thinking level",
	"slash.scoped-models.description": "Enable/disable models for Ctrl+P cycling",
	"slash.export.description": "Export session (HTML default, or specify path: .html/.jsonl)",
	"slash.import.description": "Import and resume a session from a JSONL file",
	"slash.share.description": "Share session as a secret GitHub gist",
	"slash.copy.description": "Copy last agent message to clipboard",
	"slash.name.description": "Set session display name",
	"slash.session.description": "Show session info and stats",
	"slash.changelog.description": "Show changelog entries",
	"slash.hotkeys.description": "Show all keyboard shortcuts",
	"slash.fork.description": "Create a new fork from a previous user message",
	"slash.clone.description": "Duplicate the current session at the current position",
	"slash.trust.description": "Save project trust decision for future sessions",
	"slash.login.description": "Configure provider authentication",
	"slash.logout.description": "Remove provider authentication",
	"slash.new.description": "Start a new session",
	"slash.compact.description": "Manually compact the session context",
	"slash.resume.description": "Resume a different session",
	"slash.reload.description": "Reload keybindings, extensions, skills, prompts, themes, and context files",
	"slash.quit.description": "Quit {appName}",
	"lang.switched": "Language set to {locale}",
	"lang.current": "Current language: {locale}",
	"lang.unsupported": "Unsupported language: {locale}",
	"lang.menu.title": "Language",
	"lang.menu.description": "Choose UI language. Auto follows the system locale.",
	"lang.option.en": "English",
	"lang.option.zh-CN": "简体中文",
	"lang.option.auto": "Auto (system)",
	"lang.option.current": "(current)",
	"ext.llama.description": "Manage llama.cpp routed models",
	"settings.thinking.off": "No reasoning",
	"settings.thinking.minimal": "Very brief reasoning (~1k tokens)",
	"settings.thinking.low": "Light reasoning (~2k tokens)",
	"settings.thinking.medium": "Moderate reasoning (~8k tokens)",
	"settings.thinking.high": "Deep reasoning (~16k tokens)",
	"settings.thinking.xhigh": "Extra-high reasoning (~32k tokens)",
	"settings.thinking.max": "Maximum reasoning",
	"tui.select.noMatches": "No matching commands",
} as const;

export type MessageKey = keyof typeof en;
