# @earendil-works/pi-session-backend-sqlite-node

面向 `@earendil-works/pi-agent-core` 会话的 Node sqlite 会话后端。提供
`node:sqlite` 适配器（`SqliteDatabase` 实现）、SQLite 会话仓库、
迁移、物化视图，以及可选的 FTS 搜索。

```ts
await using repository = new SqliteSessionRepository(options);
const search = createSqliteSessionSearch(options);
const session = await repository.create({ cwd });
await session.appendMessage(message);

const hits = [];
for await (const hit of search.search("needle")) hits.push(hit);
```

仓库惰性持有一条共享数据库连接。搜索是建立在同一份规范数据库上的独立
服务：仓库不暴露 `search()`。
FTS 表和触发器会在第一次非空搜索时惰性创建；首次创建 FTS 时，搜索会从规范条目做一次重建。
之后由 SQLite 触发器在规范条目插入、删除和 payload 更新时保持 FTS 同步。
