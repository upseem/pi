<a id="earendil-workspi-telemetry"></a>
# @earendil-works/pi-telemetry

面向 pi 包、与厂商无关的遥测契约和带类型的 schema 工具。

本包提供：

- 显式、基于回调的 `TelemetryContext` / `TelemetrySpan` 契约；
- 共享的 `NOOP_TELEMETRY_CONTEXT`；
- 参考实现 `InMemoryTelemetryContext`；
- 可序列化的 schema 定义及推断出的 TypeScript 类型；
- 没有导出器、没有全局 current-span 状态、不依赖遥测后端。

应用可以使用内存参考实现，或为 OpenTelemetry、Sentry、日志或其他后端提供适配器。Pi 包显式传递遥测上下文，并各自定义领域 schema。

<a id="table-of-contents"></a>
## 目录

- [安装](#installation)
- [遥测概念](#telemetry-concepts)
- [核心 Context API](#core-context-api)
- [适配器契约](#adapter-contract)
- [No-op Context](#no-op-context)
- [内存参考适配器](#in-memory-reference-adapter)
- [适配器符合性](#adapter-conformance)
- [带类型的 Schema](#typed-schemas)
  - [开始属性与完成属性](#start-and-completion-attributes)
- [Schema 元数据](#schema-metadata)
- [Pi 包集成](#pi-package-integration)
- [安全与可移植性](#security-and-portability)
- [API 参考](#api-reference)
- [开发](#development)
- [许可证](#license)

<a id="installation"></a>
## 安装

```bash
npm install @earendil-works/pi-telemetry
```

<a id="telemetry-concepts"></a>
## 遥测概念

遥测描述程序运行时做了什么。本包用 span、属性、事件、状态和显式上下文来建模这些工作：

| 概念 | 含义 |
|---|---|
| **Span** | 一次操作的计时记录，例如加载账户或发起 AI 请求。工作开始前开始，工作结束时结束。 |
| **父子 span** | 操作可以包含更小的操作。一个请求 span 可能包含一次缓存查找和一次数据库查询。它们一起构成一棵树，显示时间花在哪里。 |
| **属性** | 附着在 span 上的具名事实，例如 `provider: "openai"`、`cache.hit: true` 或 `item_count: 12`。属性描述该操作及其结果。 |
| **事件** | span 期间某个时间点的具名发生，例如 `retry.scheduled` 或 `cache.lookup`。事件没有持续时间，可以带自己的属性。 |
| **状态** | 操作结果：`ok` 或 `error`。错误状态可以包含错误名和消息。 |
| **上下文** | 标识新工作在 span 树中所属位置的句柄。从某个上下文启动 span，会使其成为该上下文的子 span。 |

例如，加载账户可能产生这样的遥测：

```text
example.account.load                         span
├─ attributes: account.id=123, found=true   facts about the span
├─ event: example.cache.lookup              occurrence during the span
│  └─ attribute: cache.hit=false            fact about the event
└─ status: ok                               final outcome
```

Span 是诊断数据，不是业务状态。记录它不得改变账户加载是否运行、成功、失败或被持久化。适配器把这些通用概念翻译成 OpenTelemetry、Sentry、日志或其他后端使用的对应概念。

<a id="core-context-api"></a>
## 核心 Context API

`TelemetryContext` 在回调周围启动一个 span。回调收到一个 `TelemetrySpan`，它同时也是子 span 的显式父上下文。

```typescript
import {
  NOOP_TELEMETRY_CONTEXT,
  type TelemetryContext,
} from '@earendil-works/pi-telemetry';

async function loadAccount(
  accountId: string,
  telemetryContext: TelemetryContext = NOOP_TELEMETRY_CONTEXT,
) {
  return telemetryContext.startSpan(
    {
      name: 'example.account.load',
      attributes: { 'example.account.id': accountId },
    },
    async (span) => {
      const account = await readAccount(accountId);
      span.setAttributes({ 'example.account.found': account !== undefined });
      return account;
    },
  );
}
```

把回调 span 传给更底层的工作，以创建显式嵌套：

```typescript
return telemetryContext.startSpan({ name: 'example.parent' }, async (parentSpan) => {
  return parentSpan.startSpan({ name: 'example.child' }, async (childSpan) => {
    childSpan.addEvent('example.cache.lookup', { 'example.cache.hit': true });
    return performWork();
  });
});
```

没有公开的 `end()` 方法。`startSpan()` 负责结算，并在回调的值或 promise settle 之前保持 span 打开。对于用正常返回值表示的预期失败，请显式设置状态：

```typescript
return telemetryContext.startSpan({ name: 'example.save' }, async (span) => {
  const result = await save();
  if (!result.ok) {
    span.setStatus({
      status: 'error',
      error: { name: 'SaveError', message: result.reason },
    });
  }
  return result;
});
```

<a id="adapter-contract"></a>
## 适配器契约

适配器实现 `TelemetryContext`，并把通用 API 桥接到其后端。它必须：

- 创建子 span，并同步、恰好一次地调用回调；
- 保留回调的返回值和拒绝值；同步抛出后返回以相同值拒绝的 promise；
- 在返回的 promise settle 之前保持原生 span 打开；
- 将正常完成视为 `ok`，将抛出/拒绝视为错误，除非已设置显式状态；
- 使重复的 `setStatus()` 调用后写覆盖；
- 合并 `setAttributes()` 调用，后定义的值替换先前值，忽略 `undefined`；
- 使记录方法同步、被动、不抛出；
- 忽略结算之后的调用；
- 原子地忽略失败的记录调用、抑制后端失败，并且仍然恰好一次执行业务回调。

适配器可以在内部激活后端原生的环境上下文，供自动插桩使用，但 pi 代码始终通过 `TelemetryContext` 参数传播父级。导出器缓冲、刷新、采样、后端 ID 以及后端特有的上下文对象属于适配器。用[适配器符合性套件](#adapter-conformance)检查这些可观察语义。

<a id="no-op-context"></a>
## No-op Context

遥测可选时使用 `NOOP_TELEMETRY_CONTEXT`：

```typescript
import { NOOP_TELEMETRY_CONTEXT } from '@earendil-works/pi-telemetry';

const result = await NOOP_TELEMETRY_CONTEXT.startSpan(
  { name: 'example.operation' },
  () => runOperation(),
);
```

no-op 上下文：

- 同步调用回调；
- 保留返回值和异步拒绝，并把同步抛出转换为以相同值拒绝的 promise；
- 使用一个共享的冻结惰性 span，包括嵌套 span；
- 不检查、不保留名称、属性、事件或状态。

<a id="in-memory-reference-adapter"></a>
## 内存参考适配器

`InMemoryTelemetryContext` 是与后端无关的参考实现。适用于测试、本地诊断，以及有意只要进程内捕获、不要导出器的应用：

```typescript
import { InMemoryTelemetryContext } from '@earendil-works/pi-telemetry';

const telemetry = new InMemoryTelemetryContext();

await telemetry.startSpan(
  { name: 'example.operation', attributes: { input: 'demo' } },
  async (span) => {
    span.addEvent('example.started');
    span.setAttributes({ output_count: 3 });
  },
);

console.log(telemetry.getSpans());
```

`getSpans()` 按 span 开始顺序返回分离的快照。每个 `RecordedTelemetrySpan` 包含确定性的数字 ID、父 ID、合并后的属性、有序事件、最终状态、结算状态，以及确定性的结束序号。它不记录时间戳。

该适配器可以安全地当作普通 `TelemetryContext` 使用，但存储无界且仅限进程内。隔离测试或记录范围时创建新实例，并且除非调用方的数据策略允许，否则不要捕获敏感属性。

<a id="adapter-conformance"></a>
## 适配器符合性

`@earendil-works/pi-telemetry/testing` 导出一套与 runner 无关、按组建模的符合性套件。fixture 提供全新上下文，并将其后端已完成的 span 转换为规范化的 `RecordedTelemetrySpan` 快照：

```typescript
import {
  createTelemetryAdapterConformance,
  type TelemetryAdapterFixture,
} from '@earendil-works/pi-telemetry/testing';
import { describe, it } from 'vitest';

const conformance = createTelemetryAdapterConformance(async () => {
  const adapter = createMyTelemetryAdapter();
  return {
    context: adapter.context,
    getSpans: async () => adapter.normalizedSpans(),
    async [Symbol.asyncDispose]() {
      await adapter.close();
    },
  } satisfies TelemetryAdapterFixture;
});

for (const group of new Set(conformance.map((testCase) => testCase.group))) {
  describe(group, () => {
    for (const testCase of conformance.filter((candidate) => candidate.group === group)) {
      it(testCase.name, () => testCase.run());
    }
  });
}
```

套件检查同步单次准入、结果与拒绝的同一性、自动和显式状态、属性合并、事件顺序、结算后的惰性调用、嵌套与并发的父子关系，以及对不可读遥测 payload 失败的抑制。`getSpans()` 可以在返回前刷新异步导出器。testing 子路径使用 Node 的断言 API；根遥测包保持运行时无关。

<a id="typed-schemas"></a>
## 带类型的 Schema

底层 span API 有意接受开放的名称和属性包，以便适配器保持通用。领域包可以定义封闭、可序列化的 schema，并从中推断精确的 TypeScript 类型。

```typescript
import {
  createTypedSpanStarter,
  defineTelemetrySchema,
} from '@earendil-works/pi-telemetry';

export const EXAMPLE_TELEMETRY_SCHEMA = defineTelemetrySchema({
  version: 1,
  spans: {
    'example.read': {
      description: 'Read one resource',
      parents: { kind: 'any' },
      startAttributes: {
        'example.resource': {
          type: 'string',
          required: true,
          values: ['account', 'project'],
          description: 'Resource kind',
        },
      },
      endAttributes: {
        'example.item_count': {
          type: 'number',
          description: 'Number of returned items',
        },
      },
      events: {
        'example.cache': {
          description: 'Cache lookup result',
          attributes: {
            'example.cache.hit': {
              type: 'boolean',
              required: true,
              description: 'Whether the cache contained the resource',
            },
          },
        },
      },
      status: {
        default: 'ok',
        errorWhen: 'The read throws or returns an error result',
      },
    },
  },
} as const);

const startSpan = createTypedSpanStarter(
  telemetryContext,
  [EXAMPLE_TELEMETRY_SCHEMA],
);
```

starter 为每个 span 暴露一个重载，并在编译期检查名称和属性。联合取值的名称必须在调用前收窄，以保持每个运行时名称与其属性 schema 的对应关系。其回调收到一个绑定到同一组 schema、且已绑定到该回调 span 的子 starter：

```typescript
await startSpan(
  'example.read',
  { 'example.resource': 'account' },
  async (span, startChildSpan) => {
    span.addEvent('example.cache', { 'example.cache.hit': true });
    const accounts = await readAccounts();
    span.setAttributes({ 'example.item_count': accounts.length });

    await startChildSpan(
      'example.read',
      { 'example.resource': 'project' },
      async (childSpan) => {
        const projects = await readProjects();
        childSpan.setAttributes({ 'example.item_count': projects.length });
      },
    );

    return accounts;
  },
);
```

<a id="start-and-completion-attributes"></a>
### 开始属性与完成属性

`startAttributes` 和 `endAttributes` 描述属性通常何时已知，而不是两套独立的运行时存储：

| Schema 字段 | 如何记录值 | 是否必填 |
|---|---|---|
| `startAttributes` | 创建 span 时传入 typed starter 的 `attributes` 参数 | 每条定义显式设置 `required: true` 或 `false` |
| `endAttributes` | 之后通过 schema 作用域 span 的 `setAttributes()` 方法添加 | 始终可选 |

两套都会成为同一后端 span 上的普通属性。没有单独的结束属性 payload 或结束回调。在上例中，`example.resource` 在 `example.read` 开始时已知，而 `example.item_count` 只在 `readAccounts()` 返回后才已知：

```typescript
await startSpan(
  'example.read',
  { 'example.resource': 'account' }, // 必填的开始属性
  async (span) => {
    const accounts = await readAccounts();
    span.setAttributes({
      'example.item_count': accounts.length, // 可选的完成属性
    });
    return accounts;
  },
); // 回调 resolve 即结算该 span
```

“结束”指完成时的充实：结束属性可以在回调活动期间的任意时刻设置，不可用时也可以省略。调用 `setAttributes()` 零次是合法的。这对早期失败、取消，以及并非每条路径都存在的提供商特有数据很重要。

重复的 `setAttributes()` 调用合并进同一属性包。同一键上后定义的值替换先前值，`undefined` 被忽略。schema 作用域方法只接受当前 span 声明的结束属性。

属性不会结束 span。从回调返回、resolve、抛出或拒绝控制结算；`startSpan()` 执行实际的结束操作。结算之后的适配器调用是惰性的。

一个 starter 可以组合多个独立版本化的 schema：

```typescript
import { AGENT_TELEMETRY_SCHEMAS } from '@earendil-works/pi-agent-core';

const startAgentSpan = createTypedSpanStarter(
  telemetryContext,
  AGENT_TELEMETRY_SCHEMAS,
);
```

内联 schema 数组会自动保留其元组类型。单独声明的数组应使用 `as const`。数组中字面重复的 span 名称会在编译期被拒绝；schema 在运行时不会被合并、检查或保留。

由 schema 导出的类型会拒绝缺失的必填属性、未知键、无效的封闭集取值、未声明的事件，以及空 schema 上的属性。结束属性始终是可选充实；类型系统不要求必须调用 `setAttributes()`。

`defineTelemetrySchema()` 是一个带类型的恒等函数。它返回普通的可 JSON 序列化数据，不做运行时校验，也不强制父规则。

<a id="schema-metadata"></a>
## Schema 元数据

支持的属性类型：

- `string`、`number` 和 `boolean`；
- `string[]`、`number[]` 和 `boolean[]`。

属性定义支持：

- `values`：标量值的封闭集；
- `elementValues`：数组元素的封闭集；
- `examples`：文档示例；
- `sensitive`：标记需要特殊处理的数据；
- `cardinality`：记录预期的 `low` 或 `high` 基数。

开始属性和事件属性声明 `required`。结束属性不声明；见[开始属性与完成属性](#start-and-completion-attributes)。

父级元数据是描述性 schema 数据：

- `{ kind: 'any' }`：根或任意调用方 span；
- `{ kind: 'root_or_external' }`：根，或 schema 之外由调用方拥有的 span；
- `{ kind: 'spans', spans: [...] }`：仅列出的 schema span。

适配器不需要理解 schema 对象。插桩辅助函数和测试用它们保持发出的名称和属性一致。

<a id="pi-package-integration"></a>
## Pi 包集成

包所有权有意拆分：

- `@earendil-works/pi-telemetry` 拥有与厂商无关的契约、no-op 和内存参考上下文、schema 工具，以及适配器符合性套件；
- `@earendil-works/pi-ai` 在提供商请求选项中接受并传播 `telemetryContext`，但不拥有遥测 schema；
- `@earendil-works/pi-agent-core` 拥有并导出 pi 的 AI 请求和 harness schema、它们组合后的只读 schema 元组，以及带类型的 span 辅助函数。

```typescript
import {
  AGENT_TELEMETRY_SCHEMAS,
  AI_TELEMETRY_SCHEMA,
  HARNESS_TELEMETRY_SCHEMA,
  startAiSpan,
  startHarnessSpan,
} from '@earendil-works/pi-agent-core';
```

pi schema 使用 pi 自有的 `pi.ai.*`、`pi.harness.*` 和 `pi.session.*` 名称。适配器可以把它们翻译成后端约定，但不得改变发出的 pi 词汇。

<a id="security-and-portability"></a>
## 安全与可移植性

遥测是进程内诊断，不是持久的应用状态。不要把 `TelemetryContext`、`TelemetrySpan` 或后端原生 trace 对象持久化到记录、消息、快照或延迟句柄中。

属性值有意限制为原始标量和数组。领域插桩应避免提示、补全、工具参数或输出、文件内容、提供商 payload、headers、凭据，以及自由形式的错误详情，除非其 schema 和数据策略明确允许。

本包不使用 `AsyncLocalStorage` 或其他运行时特有的环境上下文 API。它适用于 Node.js、Bun、浏览器和 workers；后端适配器自行负责其运行时兼容性。

<a id="api-reference"></a>
## API 参考

<a id="core-types-and-values"></a>
### 核心类型与值

| 导出 | 用途 |
|---|---|
| `TelemetryContext` | 启动由回调管理的子 span |
| `TelemetrySpan` | 记录属性、事件和状态；同时作为子上下文 |
| `SpanOptions` | Span 名称和可选的开始属性 |
| `SpanAttributes` / `AttributeValue` | 开放的适配器级属性包及支持的值 |
| `SpanStatus` | 显式的 `ok` 或 `error` 状态 |
| `NOOP_TELEMETRY_CONTEXT` | 用于关闭遥测的共享被动上下文 |
| `InMemoryTelemetryContext` | 带确定性进程内记录的参考适配器 |
| `RecordedTelemetrySpan` | 规范化的已捕获 span 快照 |
| `RecordedTelemetryEvent` | 规范化的已捕获事件快照 |

<a id="schema-definitions-and-inference"></a>
### Schema 定义与推断

| 导出 | 用途 |
|---|---|
| `defineTelemetrySchema()` | 可序列化 schema 数据的带类型恒等辅助函数 |
| `createTypedSpanStarter()` | 把父上下文绑定到一个或多个 schema 词汇 |
| `TypedSpanStarter` | 带递归子绑定回调的精确 starter 类型 |
| `TelemetrySchemaDefinition` | 顶层 schema 形状 |
| `TelemetrySpanDefinition` | Span 元数据、父级、属性、事件和状态规则 |
| `TelemetryAttributeType` | 支持的标量和数组类型名 |
| `TelemetryAttributeMetadata` | 描述、敏感性和基数元数据 |
| `TelemetryAttributeDefinition` | 属性类型、允许值、示例和元数据 |
| `TelemetryStartAttributeDefinition` | 带是否必填的开始属性定义 |
| `TelemetryEventAttributeDefinition` | 带是否必填的事件属性定义 |
| `TelemetryEventDefinition` | 事件描述和属性定义 |
| `TelemetryParentDefinition` | 开放、外部根或有限 schema 父规则 |
| `TelemetrySchemaSpanName` | 已声明 span 名称的联合 |
| `TelemetrySchemaSpanStartAttributes` | 单个 span 精确推断的开始属性 |
| `TelemetrySchemaSpanEndAttributes` | 单个 span 可选推断的结束属性 |
| `TelemetrySchemaSpanEventName` | 单个 span 声明的事件联合 |
| `TelemetrySchemaSpanEventAttributes` | 单个事件精确推断的属性 |
| `SchemaTelemetrySpan` | 限制为单个 schema span 的 span 视图 |
| `TelemetrySchemaSpanUnion` | schema 中所有 span 的可判别联合 |
| `InferStartAttributes` | 从开始定义推断的必填和可选值 |
| `InferOptionalAttributes` | 从结束定义推断的可选值 |
| `InferEventAttributes` | 从事件定义推断的必填和可选值 |
| `InferRequiredAndOptionalAttributes` | 带是否必填定义的共享推断工具 |
| `ExactTelemetryAttributes` | 拒绝期望属性集之外的键 |

<a id="testing-subpath"></a>
### Testing 子路径

| 导出 | 用途 |
|---|---|
| `createTelemetryAdapterConformance()` | 创建与 runner 无关的适配器符合性用例 |
| `TelemetryAdapterFixture` | 单个用例的全新上下文和规范化快照读取器 |
| `TelemetryAdapterFixtureFactory` | 创建隔离的 fixture |
| `TelemetryAdapterConformanceCase` | 测试 runner 执行的分组用例 |

<a id="development"></a>
## 开发

在本包目录下：

```bash
npm test
npm run build
```

仓库范围的类型检查、格式化、lint 和冒烟检查：

```bash
npm run check
```

<a id="license"></a>
## 许可证

MIT
