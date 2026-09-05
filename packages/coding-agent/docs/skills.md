> pi 可以创建 skill。让它按你的场景构建一个即可。

<a id="skills"></a>
# Skills

Skills 是自包含的能力包，由代理按需加载。一个 skill 为特定任务提供专用工作流、安装说明、辅助脚本和参考文档。

Pi 实现 [Agent Skills 标准](https://agentskills.io/specification)，对大多数违规会发出警告，但保持宽松。Pi 允许 skill 名称与其父目录不同，尽管标准不允许；该规则对跨多个代理框架共享的 skill 目录并不合适。

<a id="table-of-contents"></a>
## 目录

- [位置](#locations)
- [Skills 如何工作](#how-skills-work)
- [Skill 命令](#skill-commands)
- [Skill 结构](#skill-structure)
- [Frontmatter](#frontmatter)
- [校验](#validation)
- [示例](#example)
- [Skill 仓库](#skill-repositories)

<a id="locations"></a>
## 位置

> **安全：** Skills 可以指示模型执行任何操作，并可能包含模型会调用的可执行代码。使用前请审查 skill 内容。

Pi 从以下位置加载 skills：

- 全局：
  - `~/.pi/agent/skills/`
  - `~/.agents/skills/`
- 项目（仅在项目受信任后）：
  - `.pi/skills/`
  - `cwd` 及祖先目录中的 `.agents/skills/`（向上到 git 仓库根；不在仓库中时到文件系统根）
- 包：`skills/` 目录，或 `package.json` 中的 `pi.skills` 条目
- 设置：`skills` 数组，可为文件或目录
- CLI：`--skill <path>`（可重复；即使有 `--no-skills` 也会追加加载）

发现规则：
- 在 `~/.pi/agent/skills/` 和 `.pi/skills/` 中，根目录下带有效 skill frontmatter 且 `description` 非空的 `.md` 文件会作为独立 skill 被发现
- 在所有 skill 位置中，包含 `SKILL.md` 的目录会递归发现
- 在 `~/.agents/skills/` 和项目 `.agents/skills/` 中，根目录 `.md` 文件会被忽略；分组文件夹中声明了 skill frontmatter 的嵌套 `.md` 文件会被发现
- 除 `SKILL.md` 以外、看起来不像 skill 的根级 Markdown 文件会被静默忽略

用 `--no-skills` 禁用发现（显式 `--skill` 路径仍会加载）。

<a id="using-skills-from-other-harnesses"></a>
### 使用其他框架的 Skills

要使用 Claude Code 或 OpenAI Codex 的 skills，把它们的目录加到设置中：

```json
{
  "skills": [
    "~/.claude/skills",
    "~/.codex/skills"
  ]
}
```

项目级 Claude Code skills 请加到 `.pi/settings.json`：

```json
{
  "skills": ["../.claude/skills"]
}
```

<a id="how-skills-work"></a>
## Skills 如何工作

1. 启动时，pi 扫描 skill 位置并提取名称和描述
2. 系统提示按[规范](https://agentskills.io/integrate-skills)以 XML 列出可用 skills
3. 任务匹配时，代理用 `read` 加载完整 SKILL.md；若 `read` 不可用，则使用 `bash`（模型并不总会这样做；可用提示或 `/skill:name` 强制加载）
4. 代理按说明执行，用相对路径引用脚本和资源

这是渐进式披露：上下文中始终只有描述，完整说明按需加载。

<a id="skill-commands"></a>
## Skill 命令

Skills 注册为 `/skill:name` 命令：

```bash
/skill:brave-search           # 加载并执行该 skill
/skill:pdf-tools extract      # 带参数加载 skill
```

命令后的参数会作为 `User: <args>` 追加到 skill 内容。

在交互模式的 `/settings` 或 `settings.json` 中开关 skill 命令：

```json
{
  "enableSkillCommands": true
}
```

<a id="skill-structure"></a>
## Skill 结构

一个 skill 是包含 `SKILL.md` 的目录。其余内容格式自由。

```
my-skill/
├── SKILL.md              # 必需：frontmatter + 说明
├── scripts/              # 辅助脚本
│   └── process.sh
├── references/           # 按需加载的详细文档
│   └── api-reference.md
└── assets/
    └── template.json
```

<a id="skillmd-format"></a>
### SKILL.md 格式

````markdown
---
name: my-skill
description: What this skill does and when to use it. Be specific.
---

# My Skill

## Setup

Run once before first use:
```bash
cd /path/to/skill && npm install
```

## Usage

```bash
./scripts/process.sh <input>
```
````

使用相对于 skill 目录的路径：

```markdown
See [the reference guide](references/REFERENCE.md) for details.
```

<a id="frontmatter"></a>
## Frontmatter

按 [Agent Skills 规范](https://agentskills.io/specification#frontmatter-required)：

| 字段 | 必需 | 说明 |
|-------|----------|-------------|
| `name` | 是 | 最多 64 个字符。小写 a-z、0-9、连字符。与标准不同，Pi 不要求它与父目录同名，因为该标准要求对共享 skill 目录并不合适。 |
| `description` | 是 | 最多 1024 个字符。说明 skill 做什么、何时使用。 |
| `license` | 否 | 许可证名称，或指向捆绑文件的引用。 |
| `compatibility` | 否 | 最多 500 个字符。环境要求。 |
| `metadata` | 否 | 任意键值映射。 |
| `allowed-tools` | 否 | 空格分隔的预批准工具列表（实验性）。 |
| `disable-model-invocation` | 否 | 为 `true` 时，skill 不出现在系统提示中。用户必须使用 `/skill:name`。 |

<a id="name-rules"></a>
### 名称规则

- 1–64 个字符
- 仅小写字母、数字、连字符
- 不能以连字符开头或结尾
- 不能有连续连字符
Pi 不要求名称与父目录相同。Agent Skills 标准要求相同，但该要求对多工具共享的 skill 目录并不合适。

有效：`pdf-processing`、`data-analysis`、`code-review`
无效：`PDF-Processing`、`-pdf`、`pdf--processing`

<a id="description-best-practices"></a>
### 描述最佳实践

描述决定代理何时加载该 skill。请写具体。

好：
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents.
```

差：
```yaml
description: Helps with PDFs.
```

<a id="validation"></a>
## 校验

Pi 按 Agent Skills 标准校验 skills。多数问题只产生警告，skill 仍会加载：

- 名称超过 64 个字符或包含非法字符
- 名称以连字符开头/结尾，或有连续连字符
- 描述超过 1024 个字符

未知 frontmatter 字段会被忽略。

已声明但缺少描述的 skills 不会加载。格式错误的 `SKILL.md`，以及没有描述的 `SKILL.md`，会产生警告且不会加载。其他没有有效 skill frontmatter 的 Markdown 文件会被忽略。

名称冲突（不同位置同名）会警告并保留先发现的那个 skill。

<a id="example"></a>
## 示例

```
brave-search/
├── SKILL.md
├── search.js
└── content.js
```

**SKILL.md：**
````markdown
---
name: brave-search
description: Web search and content extraction via Brave Search API. Use for searching documentation, facts, or any web content.
---

# Brave Search

## Setup

```bash
cd /path/to/brave-search && npm install
```

## Search

```bash
./search.js "query"              # 基础搜索
./search.js "query" --content    # 包含页面内容
```

## Extract Page Content

```bash
./content.js https://example.com
```
````

<a id="skill-repositories"></a>
## Skill 仓库

- [Anthropic Skills](https://github.com/anthropics/skills) - 文档处理（docx、pdf、pptx、xlsx）、Web 开发
- [Pi Skills](https://github.com/badlogic/pi-skills) - Web 搜索、浏览器自动化、Google APIs、转写
