<a id="session-search"></a>
# 会话搜索

Pi search 是已提交会话条目上的小型查询接口。共享契约只返回稳定的命中身份；实现可用后端特定的展示数据扩展命中。

<a id="core-api"></a>
## 核心 API

```ts
export interface SessionSearchHit {
  /** 拥有该条目的会话的逻辑标识符。 */
  readonly sessionId: string;

  /** 该会话内条目的逻辑标识符。 */
  readonly entryId: string;
}

export interface SessionSearchOptions {
  /** 把结果限制为指定的规范条目类型。 */
  readonly entryTypes?: readonly Entry["type"][];

  /** 返回命中的最大数量。后端可以更少，不能更多。 */
  readonly limit?: number;

  /** 用于取消的 abort signal，例如边输入边搜。 */
  readonly signal?: AbortSignal;
}

export interface SessionSearch<T extends SessionSearchHit = SessionSearchHit> {
  search(text: string, options?: SessionSearchOptions): AsyncIterable<T>;
}
```

基础命中有意保持最小：`(sessionId, entryId)` 是跨 JSONL、memory、SQLite FTS 和远程索引的可移植身份。片段、时间戳、分数、元数据、偏移和排序语义属于具体实现。

<a id="why-async-iterable"></a>
## 为何使用 async iterable

`AsyncIterable` 让消费者可以尽早渲染结果、在足够时停止迭代，并用 `AbortSignal` 取消进行中的工作。防抖仍是 UI/调用方的职责；API 只提供取消原语。

```ts
let currentAbortController: AbortController | undefined;

async function updateResults(query: string) {
  currentAbortController?.abort();
  const controller = new AbortController();
  currentAbortController = controller;

  try {
    for await (const hit of search.search(query, { limit: 10, signal: controller.signal })) {
      render(hit);
    }
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "AbortError") throw error;
  }
}
```

<a id="default-implementations"></a>
## 默认实现

<a id="scanning-search"></a>
### 扫描搜索

可复用的扫描器把类似会话的 readable（`getMetadata`、`findEntries` 和 `getLabel`）适配成投影条目：

```ts
export interface SessionSearchCandidate {
  readonly entryId: string;
  readonly seq: number;
  readonly type: Entry["type"];
  readonly timestamp: number;
  readonly text: string;
  readonly fields?: Record<string, unknown>;
}

export interface ScanningSessionSearchHit extends SessionSearchHit {
  readonly timestamp: number;
  readonly snippet: string;
}
```

`SessionSearchCandidate` 是匹配前的扫描器输入：包含可搜索文本、类型、序号和可选的投影字段。扫描器把匹配的候选转成公开命中。

已打开的会话或 storage 可以直接扫描：

```ts
const search = createScanningSessionSearch(sessions);

for await (const hit of search.search("authentication", { limit: 10 })) {
  const session = sessionsById.get(hit.sessionId)!;
  const entry = await session.getEntry(hit.entryId);
  console.log(entry);
}
```

JSONL 不需要单独的公开搜索适配器。基于 JSONL 的代码可以在本地完成发现/加载，再把已加载的 storage 交给同一扫描器：

```ts
async function* jsonlReadables(jsonl: JsonlSessionRepoOptions, query: JsonlSessionListOptions = {}) {
  for (const metadata of await listJsonlSessionMetadata(jsonl, query)) {
    yield loadJsonlSessionStorage(jsonl, metadata);
  }
}

const search = createScanningSessionSearch((query) => jsonlReadables(jsonl, query));
```

扫描源不得对 harness 持有的会话调用 `SessionRepo.open()`，如果该操作可能占用 writer lease。JSONL 应使用只读加载辅助函数；已打开的会话/storage 可以直接扫描。

<a id="sqlite-fts"></a>
### SQLite FTS

SQLite 搜索暴露扩展命中：

```ts
export interface SqliteSessionSearchHit extends SessionSearchHit {
  readonly metadata: SqliteSessionMetadata;
  readonly timestamp: number;
  readonly score: number;
}
```

```ts
const search = createSqliteSessionSearch({ env, sqlite, databasePath });

for await (const hit of search.search("auth", {
  entryTypes: ["message", "compaction"],
  limit: 20,
})) {
  console.log(hit.sessionId, hit.entryId, hit.score);
}
```

FTS 表和触发器在第一次非空搜索时惰性创建。首次创建 FTS 时，SQLite 会从规范 `entries` 做一次性重建；之后 SQLite 触发器会随规范条目的插入、删除和 payload 更新保持 FTS 同步。这样 SQLite 搜索在提交后是新的，但这也意味着在该数据库启用搜索后，FTS 触发器失败可能回滚规范 SQLite 写入。

<a id="indexed-backends"></a>
## 索引后端

搜索索引是后端自有的派生状态。共享包只导出查询 API；应用或后端包在需要显式维护索引时，可以定义自己的 writer/feed 契约。

<a id="jsonl-sessions-with-elasticsearch"></a>
### 使用 Elasticsearch 的 JSONL 会话

这是应用自有的胶水层。核心提供查询契约和 JSONL 会话发现；Elastic writer 契约属于该适配器本地。

```ts
import { Client } from "@elastic/elasticsearch";
import {
  scanningEntries,
  type JsonlSessionMetadata,
  type JsonlSessionRepoOptions,
  type SessionSearch,
  type SessionSearchHit,
  type SessionSearchOptions,
} from "@earendil-works/pi-agent-core";

// 基于 JSONL 的代码可以用现有的 JSONL list/load 辅助函数在本地提供这个。
async function* jsonlReadables(jsonl: JsonlSessionRepoOptions, options: { cwd?: string } = {}) {
  for (const metadata of await listJsonlSessionMetadata(jsonl, options)) {
    yield loadJsonlSessionStorage(jsonl, metadata);
  }
}

interface SearchIndexWriter<TItem> {
  apply(items: TItem[]): Promise<void>;
  flush?(): Promise<void>;
}

interface IndexedSessionSearch<T extends SessionSearchHit, TItem>
  extends SessionSearch<T>, SearchIndexWriter<TItem> {}

type ElasticSessionFeedItem =
  | { type: "upsert"; id: string; body: ElasticSessionDoc }
  | { type: "delete"; id: string };

interface ElasticSessionDoc {
  sessionId: string;
  entryId: string;
  seq: number;
  timestamp: number;
  cwd: string;
  text: string;
  metadata: JsonlSessionMetadata;
  fields?: Record<string, unknown>;
}

interface ElasticSessionSearchHit extends SessionSearchHit {
  readonly timestamp: number;
  readonly snippet: string;
  readonly score?: number;
}

class ElasticSessionSearch
  implements IndexedSessionSearch<ElasticSessionSearchHit, ElasticSessionFeedItem>
{
  constructor(
    private readonly client: Client,
    private readonly index: string,
  ) {}

  async apply(items: ElasticSessionFeedItem[]): Promise<void> {
    const operations = items.flatMap((item) => {
      if (item.type === "delete") {
        return [{ delete: { _index: this.index, _id: item.id } }];
      }
      return [{ index: { _index: this.index, _id: item.id } }, item.body];
    });

    if (operations.length > 0) await this.client.bulk({ operations });
  }

  async flush(): Promise<void> {
    await this.client.indices.refresh({ index: this.index });
  }

  async *search(
    text: string,
    options: SessionSearchOptions = {},
  ): AsyncIterable<ElasticSessionSearchHit> {
    const result = await this.client.search<ElasticSessionDoc>({
      index: this.index,
      size: options.limit ?? 20,
      query: {
        bool: {
          must: [{ match: { text } }],
        },
      },
    });

    for (const hit of result.hits.hits) {
      if (!hit._source) continue;
      if (options.signal?.aborted) throw options.signal.reason;
      yield {
        sessionId: hit._source.sessionId,
        entryId: hit._source.entryId,
        timestamp: hit._source.timestamp,
        snippet: hit._source.text,
        score: hit._score ?? undefined,
      };
    }
  }
}
```

追赶/重建任务可以把 JSONL 投影喂给 Elasticsearch，且不占用 writer lease：

```ts
async function indexJsonlSessionsIntoElastic(
  jsonl: JsonlSessionRepoOptions,
  elastic: ElasticSessionSearch,
  options: { cwd?: string } = {},
): Promise<void> {
  for await (const session of jsonlReadables(jsonl, { cwd: options.cwd })) {
    const metadata = await session.getMetadata();
    for await (const candidate of scanningEntries(session)) {
      await elastic.apply([{
        type: "upsert",
        id: `${metadata.id}:${candidate.entryId}`,
        body: {
          sessionId: metadata.id,
          entryId: candidate.entryId,
          seq: candidate.seq,
          timestamp: candidate.timestamp,
          cwd: metadata.cwd,
          text: candidate.text,
          metadata,
          fields: candidate.fields,
        },
      }]);
    }
  }

  await elastic.flush();
}
```

<a id="correctness-and-failure-boundaries"></a>
## 正确性与失败边界

对共享 API 而言，搜索索引是派生状态：应用可以重试、重建，或把搜索标为过期。后端特定选择可能有不同权衡；SQLite FTS 使用同库触发器，因此搜索初始化触发器之后，FTS 失败可能回滚规范 SQLite 写入。

扫描源若产出重复的 `sessionId` 应快速失败，因为基础命中身份是 `(sessionId, entryId)`。索引后端通常在存储/索引层强制唯一。

搜索 opt-in 仍需要同步/索引层。后续应添加默认 no-op 的搜索索引 sink（例如 `NOOP_SEARCH_INDEX_SINK`），以便规范写入点可以无条件发出索引事件，类似于遥测在关闭时使用 no-op 实现。
