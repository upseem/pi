import type { MessageKey } from "./en.ts";

/**
 * Simplified Chinese catalog. Partial is intentional: missing keys fall back to English.
 * Intentionally omits `cli.help.summary` so fallback behavior stays exercised.
 */
export const zhCN = {
	"cli.help.header.usage": "用法:",
	"cli.help.header.commands": "命令:",
	"cli.help.header.options": "选项:",
	"cli.help.header.examples": "示例:",
	"cli.help.header.env": "环境变量:",
	"cli.help.header.tools": "内置工具名:",
	"cli.help.header.extensionFlags": "扩展 CLI 标志:",
	"cli.help.extensionFlag.registeredBy": "由 {path} 注册",
	"cli.help.body": `{appNameBold} - 带 read、bash、edit、write 工具的 AI 编码助手

{hUsage}
  {appName} [options] [--] [@files...] [messages...]

{hCommands}
  {appName} install <source> [-l]     安装扩展源并写入设置
  {appName} remove <source> [-l]      从设置中移除扩展源
  {appName} uninstall <source> [-l]   remove 的别名
  {appName} update [source|self|pi]   更新 pi、扩展或模型目录
  {appName} list                      列出设置中已安装的扩展
  {appName} config [-l]               打开 TUI 启用/禁用包资源（Tab 切换范围）
  {appName} auth <command>            打印凭据或检查提供商是否就绪
  {appName} <command> --help          显示 install/remove/uninstall/update/list/config/auth 的帮助

{hOptions}
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
  --lang auto|en|zh-CN           设置本次运行的界面语言（auto 按系统语言检测）
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

扩展可以注册额外标志（例如 plan-mode 扩展的 --plan）。{extensionFlags}

{hExamples}
  # 为外部客户端打印提供商 API key
  {appName} auth print-api-key --provider openai

  # 为外部客户端打印 OAuth bearer token（过期则刷新）
  {appName} auth print-bearer-token --provider openai-codex

  # 交互模式
  {appName}

  # 带初始提示的交互模式
  {appName} "List all .ts files in src/"

  # 在初始消息中附带文件
  {appName} @prompt.md @image.png "What color is the sky?"

  # 非交互模式（处理后退出）
  {appName} -p "List all .ts files in src/"

  # 以短横线开头的提示
  {appName} -p -- "- Summarize these points"

  # 多条消息（交互）
  {appName} "Read package.json" "What dependencies do we have?"

  # 继续上一次会话
  {appName} --continue "What did we discuss?"

  # 启动一个命名会话
  {appName} --name "Refactor auth module"

  # 使用其他模型
  {appName} --provider openai --model gpt-4o-mini "Help me refactor this code"

  # 用提供商前缀指定模型（不需要 --provider）
  {appName} --model openai/gpt-4o "Help me refactor this code"

  # 用思考级别简写指定模型
  {appName} --model sonnet:high "Solve this complex problem"

  # 把模型循环限制到指定模型
  {appName} --models claude-sonnet,claude-haiku,gpt-4o

  # 用 glob 限制到某个提供商
  {appName} --models "github-copilot/*"

  # 按固定思考级别循环模型
  {appName} --models sonnet:high,haiku:low

  # 以指定思考级别启动
  {appName} --thinking high "Solve this complex problem"

  # 只读模式（无法修改文件）
  {appName} --tools read,grep,find,ls -p "Review the code in src/"

  # 禁用某一个工具，其余保持可用
  {appName} --exclude-tools ask_question

  # 将会话文件导出为 HTML
  {appName} --export ~/{configDirName}/agent/sessions/--path--/session.jsonl
  {appName} --export session.jsonl output.html

{hEnv}
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
  {envAgentDir} - 配置目录（默认：~/{configDirName}/agent）
  {envSessionDir} - 会话存储目录（会被 --session-dir 覆盖）
  PI_PACKAGE_DIR                   - 覆盖包目录（用于 Nix/Guix store 路径）
  PI_SERVER_DIR                    - 实验性服务器配置和 socket 目录（默认：~/.pi/server）
  PI_SERVER_ID                     - 实验性服务器逻辑 ID（可由 --server-id 覆盖）
  PI_OFFLINE                       - 设为 1/true/yes 时禁用启动时的网络操作
  PI_TELEMETRY                     - 设为 1/true/yes 或 0/false/no 时覆盖安装遥测
  PI_SHARE_VIEWER_URL              - /share 命令的基址（默认：https://pi.dev/session/）

{hTools}
  read       - 读取文件内容
  bash       - 执行 bash 命令
  powershell - 在 Windows 上执行 PowerShell 命令
  edit       - 用查找/替换编辑文件
  write      - 写入文件（创建/覆盖）
  grep       - 搜索文件内容（只读，默认关闭）
  find       - 按 glob 查找文件（只读，默认关闭）
  ls         - 列出目录内容（只读，默认关闭）
`,
	"slash.settings.description": "打开设置菜单",
	"slash.lang.description": "切换界面语言",
	"slash.model.description": "选择模型（打开选择器界面）",
	"slash.tree.description": "浏览会话树（切换分支）",
	"slash.thinking.description": "设置思考级别",
	"slash.scoped-models.description": "启用或禁用供 Ctrl+P 循环切换的模型",
	"slash.export.description": "导出会话（默认 HTML，也可指定 .html/.jsonl 路径）",
	"slash.import.description": "从 JSONL 文件导入并恢复会话",
	"slash.share.description": "以私密 GitHub gist 分享会话",
	"slash.copy.description": "将上一条代理消息复制到剪贴板",
	"slash.name.description": "设置会话显示名称",
	"slash.session.description": "显示会话信息和统计",
	"slash.changelog.description": "显示变更日志条目",
	"slash.hotkeys.description": "显示全部键盘快捷键",
	"slash.fork.description": "从之前的用户消息创建新分支会话",
	"slash.clone.description": "在当前位置复制当前会话",
	"slash.trust.description": "保存项目信任决定，供以后会话使用",
	"slash.login.description": "配置提供商认证",
	"slash.logout.description": "移除提供商认证",
	"slash.new.description": "开始新会话",
	"slash.compact.description": "手动压缩会话上下文",
	"slash.resume.description": "恢复其他会话",
	"slash.reload.description": "重新加载快捷键、扩展、skills、提示、主题和上下文文件",
	"slash.quit.description": "退出 {appName}",
	"lang.switched": "语言已设置为 {locale}",
	"lang.current": "当前语言：{locale}",
	"lang.unsupported": "不支持的语言：{locale}",
	"lang.option.en": "English",
	"lang.option.zh-CN": "简体中文",
	"lang.option.auto": "自动（系统）",
	"lang.option.current": "(当前)",
	"ext.llama.description": "管理 llama.cpp 路由模型",
	"settings.thinking.off": "不推理",
	"settings.thinking.minimal": "极简推理（约 1k tokens）",
	"settings.thinking.low": "轻度推理（约 2k tokens）",
	"settings.thinking.medium": "中等推理（约 8k tokens）",
	"settings.thinking.high": "深度推理（约 16k tokens）",
	"settings.thinking.xhigh": "超高推理（约 32k tokens）",
	"settings.thinking.max": "最大推理",
	"tui.select.noMatches": "没有匹配的命令",
} as const satisfies Partial<Record<MessageKey, string>>;
