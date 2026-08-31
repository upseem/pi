> pi 可以创建提示模板。让它按你的工作流做一份即可。

<a id="prompt-templates"></a>
# 提示模板

提示模板是会展开成完整提示的 Markdown 片段。在编辑器里输入 `/name` 即可调用模板，其中 `name` 是去掉 `.md` 的文件名。

<a id="locations"></a>
## 位置

Pi 从这些位置加载提示模板：

- 全局：`~/.pi/agent/prompts/*.md`
- 项目：`.pi/prompts/*.md`（仅在项目受信任之后）
- 包：`prompts/` 目录，或 `package.json` 里的 `pi.prompts` 条目
- 设置：`prompts` 数组，可以是文件或目录
- CLI：`--prompt-template <path>`（可重复）

用 `--no-prompt-templates` 关闭发现。

<a id="format"></a>
## 格式

```markdown
---
description: Review staged git changes
---
Review the staged changes (`git diff --cached`). Focus on:
- Bugs and logic errors
- Security issues
- Error handling gaps
```

- 文件名成为命令名。`review.md` 变成 `/review`。
- `description` 可选。缺失时使用第一个非空行。
- `argument-hint` 可选。设置后，自动补全下拉里会在描述前显示该提示。

<a id="argument-hints"></a>
### 参数提示

在 frontmatter 里用 `argument-hint` 在自动补全中显示期望参数。必填参数用 `<angle brackets>`，可选参数用 `[square brackets]`：

```markdown
---
description: Review PRs from URLs with structured issue and code analysis
argument-hint: "<PR-URL>"
---
```

在自动补全下拉里会渲染为：

```
→ pr   <PR-URL>       — Review PRs from URLs with structured issue and code analysis
  is   <issue>        — Analyze GitHub issues (bugs or feature requests)
  wr   [instructions] — Finish the current task end-to-end
  cl   — Audit changelog entries before release
```

<a id="usage"></a>
## 用法

在编辑器里输入 `/` 加上模板名。自动补全会显示可用模板及其描述。

```
/review                           # 展开 review.md
/component Button                 # 带参数展开
/component Button "click handler" # 多个参数
```

<a id="arguments"></a>
## 参数

模板支持位置参数、默认值和简单切片：

- `$1`、`$2`、... 位置参数
- `$@` 或 `$ARGUMENTS` 表示拼接后的全部参数
- `${1:-default}` 在参数 1 存在且非空时使用它，否则用 `default`
- `${@:-default}` 或 `${ARGUMENTS:-default}` 在全部参数存在且非空时使用它们，否则用 `default`
- `${@:N}` 从第 N 个位置起的参数（从 1 开始）
- `${@:N:L}` 从 N 开始取 `L` 个参数

示例：

```markdown
---
description: Create a component
---
Create a React component named $1 with features: $@
```

默认值对可选参数很有用：

```markdown
Summarize the current state in ${1:-7} bullet points.
```

用法：`/component Button "onClick handler" "disabled support"`

<a id="loading-rules"></a>
## 加载规则

- 在 `prompts/` 中发现模板是非递归的。
- 如果模板在子目录里，需要通过 `prompts` 设置或包清单显式加入。
