# Pi evals

Pi evals 是面向 Pi 工作流、由模型支撑的行为检查。它们把真实的 `AgentSession` 适配到 `vitest-evals`，在隔离的临时项目目录和代理目录中运行，并附上原生 Pi 会话产物。
用它们衡量端到端行为，并比较提示、工具、skills、模型或其他 harness 配置。

## 运行 evals

从仓库根目录用默认提供商和模型运行：

```bash
npm run eval -- --provider openai --model gpt-5.6-sol
```

等价的环境变量是：

```bash
PI_PROVIDER=openai PI_MODEL=gpt-5.6-sol npm run eval
```

CLI 值优先，并会成为那些没有显式选择模型的 harness 的默认值。提供商和模型必须一起提供。当每个被执行的 harness 都自己配置模型时，运行器也允许没有默认值。
认证来自 Pi 正常的 `ModelRuntime`，包括 Pi 订阅凭据和提供商 API key 环境变量。

额外参数会转发给 Vitest：

```bash
npm run eval -- src/extensions.eval.ts
npm run eval -- -t "creates, reloads, and uses"
```

每次调用都会打印一个被忽略的 `.eval/` 产物目录。`runs.jsonl` 索引已完成的 harness 运行，以及它们在 `sessions/` 下的原生 Pi 会话 JSONL 附件。这些文件可能包含提示、回复、源码和工具输出。

## 编写 evals

通用的套件、评判器、断言和归一化轨迹说明见 [`vitest-evals`](https://github.com/getsentry/vitest-evals)。Pi 特有的 evals 使用 `src/pi-harness.ts` 中的 `createPiCodingAgentHarness(...)`，每个 `describeEval(...)` 套件绑定一个 harness：

```ts
import { expect } from "vitest";
import { describeEval } from "vitest-evals";
import { createPiCodingAgentHarness } from "./pi-harness.ts";

const harness = createPiCodingAgentHarness({ noTools: "all" });

describeEval("Pi smoke", { harness }, (it) => {
	it("answers a factual question", async ({ run }) => {
		const result = await run("What is the capital of France? Reply with only the city name.");
		expect(result.output).toBe("Paris");
	});
});
```

### 配置 Pi harness

`createPiCodingAgentHarness(...)` 接受：

- `name`：报告和比较使用的稳定 harness 标识。
- `model`：可选的 `{ provider, id }` 选择，会覆盖运行器的默认模型。
- `noTools`：Pi 的工具禁用配置。
- `transformSystemPrompt`：在 eval 开始前变换完整的默认提示。
- `output`：把最终回复和 `AgentSession` 变换成 JSON 安全的领域结果。

显式选择模型后，模型比较 harness 就不再依赖运行器默认值：

```ts
const harness = createPiCodingAgentHarness({
	name: "claude-opus-4-6",
	model: { provider: "anthropic", id: "claude-opus-4-6" },
});
```

一次 run 可以接受单个提示，或一串提示与 reload 步骤。当前一个提示创建或改动了 Pi 资源时，reload 步骤很有用：

```ts
const result = await run([
	{ type: "prompt", content: "Create a Pi extension." },
	{ type: "reload" },
	{ type: "prompt", content: "Use the extension." },
]);
```

### 变换 harness 输出

用 `output` 暴露场景特有的、JSON 安全的行为，而不把这些行为加进通用 Pi 适配器：

```ts
const harness = createPiCodingAgentHarness({
	output: ({ response, session }) => ({
		response,
		activeTools: session.getActiveToolNames(),
		extensionErrors: session.resourceLoader.getExtensions().errors,
	}),
});
```

在 `result.output` 上断言应用行为。在 `result.session` 上断言模型和工具轨迹，使用 `vitest-evals` 的助手，例如 `toolCalls(...)`。

### 编写对比 eval 集

用 `evalHarnessTable(...)` 配合 Vitest 原生的 `describe.for(...)`，对多个 harness 跑同一组输入。
harness 可以在提示、工具、skills、模型或任何其他 Pi 配置上不同：

```ts
import { describe } from "vitest";
import { createJudge, describeEval } from "vitest-evals";
import { evalHarnessTable } from "./vitest-evals/harness-table.ts";

const TargetTaskJudge = createJudge<string, string>("TargetTaskJudge", ({ output }) => ({
	score: output === "expected result" ? 1 : 0,
}));

const harnessTable = evalHarnessTable(
	"target skill effectiveness",
	{
		baseline: withoutTargetSkillHarness,
		candidate: withTargetSkillHarness,
		repetitions: 6,
	},
);

describe.for(harnessTable)("$name repetition $repetition", ({ harness }) => {
	describeEval("target skill effectiveness", { harness, judges: [TargetTaskJudge], judgeThreshold: null }, (it) => {
		it("completes the target task", async ({ run }) => {
			await run("Complete the target task.");
		});
	});
});
```

对比套件应用确定性或模型支撑的评判器记录正确性，并把 `judgeThreshold` 设为 `null`。
这样低分只是观察结果，不会让这次 Vitest 调用失败。硬断言只用于套件不变量和基础设施契约。`expect.soft(...)` 仍会让测试失败，它不是计分机制。

Pi harness 会在删除临时工作区之前快照原生会话 JSONL。一个仅用于 eval 的 `afterEach` hook 会在 reporter 运行之前，把该快照登记到显式的 Vitest 测试任务上。

harness 名称在一个 eval 集内必须稳定且唯一。分组键会把重复次数与非空字符串 `input.id` 组合（如果有），否则与严格规范 JSON 输入的 SHA-256 哈希组合。单次处理用 `candidate`，多次处理用 `candidates`。每个候选只与声明的基线比较。对每组匹配的输入和重复，reporter 用该次运行记录的平均评判分数计算通过率提升，分数至少为 `1` 视为通过。提升是候选通过率减去基线通过率，单位是百分点。缺失的评判分数报告为不完整观察。token、延迟和估计成本仍作为独立的「候选减基线」成对差值；缺失的遥测保持不可用。如果需要随机化执行顺序，使用 Vitest 内置的序列打乱。

对比 eval 的方法论、重复策略、可信评判器和遥测解读，见 [`skill-eval-harness`](https://github.com/adewale/skill-eval-harness/) 指南。
