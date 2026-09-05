# @earendil-works/pi-session-backend-sqlite-node

面向 `@earendil-works/pi-agent-core` 的 Node `node:sqlite` Session 后端。

```ts
import { BACKGROUND_CONTEXT } from "@earendil-works/pi-agent-core";
import {
  createNodeSqliteFactory,
  SqliteSessionRepo,
} from "@earendil-works/pi-session-backend-sqlite-node";

const repository = new SqliteSessionRepo({
  directory: "/var/lib/pi/sessions",
  databaseFactory: createNodeSqliteFactory(),
});

const session = await repository.create({}, BACKGROUND_CONTEXT);
const main = await session.createBranch("main", null, BACKGROUND_CONTEXT);
await main.appendMessage(
  { role: "user", content: "hello", timestamp: Date.now() },
  BACKGROUND_CONTEXT,
);
await session.close(BACKGROUND_CONTEXT);
await repository.close(BACKGROUND_CONTEXT);
```

默认布局在 `directory` 下为每个 Session 创建一个文件。只含 ASCII 字母、数字、`_` 和 `-` 的 ID 使用 `{sessionId}.sqlite`；其他 ID 则把 UTF-16 code unit 编成 base64url，并加 `~` 前缀。持久 ID 保持不变，返回或列出的 metadata 包含规范物理路径。传入 `databasePath` 可把多个 Session 放进同一个受支持的共享容器；需要时会创建其父目录。

database factory 会区分有意创建、不创建的读写打开，以及不创建的只读打开。Session `open()` 与删除会拒绝配置仓库之外的 metadata，且绝不会创建缺失的数据库。列表操作只读且尽力而为。fork 有意允许外部来源的 metadata 路径：它只读访问指定的现有容器，绝不会替换为同 ID 的活跃本地 Session。

每个 Session 只有一个可写 owner 的保证来自 host 生命周期，而不是此后端。不支持在另一进程直接打开同一 Session 进行写入。仓库会拒绝同一 ID 上相互重叠的本地 create/open/fork/delete 所有权，但没有实现跨进程 lease、lock、fence、heartbeat 或 takeover。host 必须先关闭 worker，才能删除。

对同一仓库内已打开来源执行 fork 时，其快照会排入该来源的 commit 队列。其他任何来源（包括由活跃 Session worker 保持打开的来源）都会使用独立只读连接和一个 deferred WAL transaction；该快照保持打开时，worker 后续的 commit 仍可完成。共享容器删除只移除所选 Session 的行。仓库关闭会等待每个已打开 Session 的清理尝试，再报告错误。本包不导出搜索服务或 FTS 索引；搜索由独立的 S3 projection 提供。
