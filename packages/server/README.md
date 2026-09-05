# @earendil-works/pi-server

面向新版持久 Session 和 Agent Harness 接口的实验性本地服务端。

当前版本支持服务端与 Session 范围的 facet 服务路由，以及多 presentation attachment。`RoutedServerServiceHost.attachClient()` 会创建一个连接范围的服务端服务端点，仅提供有限的 attachment 管理能力。`RoutedSessionHandle.attachClient()` 返回 presentation 范围的 Session capability。其 `invokeService()` 把不透明的 service/member 信封转发到所选 Session 端点；服务端只校验 attachment 路由，不加载 facet 契约。

- 服务端服务调用和订阅通过连接的 `RoutedServerServiceAttachment` 不透明地路由；
- 应用自有的 `SessionDirectory` 把私有目录投影成可安全展示的复制状态；
- 应用自有的 `SessionManagement` 创建、移除、挂接和分离 Session，业务结果不暴露路由 ID；
- 路由器安装或清除实时路由后，通过带外消息发布 attachment 变化；
- Session 服务调用经 `invokeService` 路由，服务端不解码业务 payload；
- 服务订阅更新仅限于发起请求的 attachment；
- transcript 等应用观察数据作为普通服务状态路由，不需要服务端持有业务 schema。

一个 Session 可以有多个 presentation attachment。从同一连接重复 `attach` 是幂等的；每次成功挂接都有服务端生成的 `attachmentId`，且只作为路由控制数据下发。Session 请求携带 `{ serverId, sessionId, attachmentId }`，服务端会拒绝过期或不匹配的路由。连接丢失会拒绝其本地响应，但只在已接纳的服务调用结算后释放 attachment。何时在没有 presentation 需求且 worker 本地 Harness 空闲时停用 worker，由 host 决定。服务端关闭会关闭所有已路由的 Session handle，并释放对应 worker 和 Session writer 所有权。

```ts
import { randomUUID } from "node:crypto";
import { MemorySessionRepo, type Session } from "@earendil-works/pi-agent-core";
import {
  type RoutedServerServiceHost,
  type RoutedSessionHandle,
  type ServerHost,
  SessionAmbiguousError,
  SessionNotFoundError,
} from "@earendil-works/pi-server";
import { createUnixServer, getUnixSocketPath } from "@earendil-works/pi-server/unix";

async function startServer(
  serverServices: RoutedServerServiceHost,
  openRoutedSession: (session: Session) => Promise<RoutedSessionHandle>,
) {
  const sessions = new MemorySessionRepo();
  const host: ServerHost = {
    serverServices,
    async resolveSession(sessionId, context) {
      const matches = (await sessions.list(undefined, context))
        .filter((metadata) => metadata.id === sessionId);
      if (matches.length === 0) {
        throw new SessionNotFoundError(`Unknown session: ${sessionId}`);
      }
      if (matches.length > 1) throw new SessionAmbiguousError();
      return matches[0];
    },
    async openSession(metadata, context) {
      const session = await sessions.open(metadata, context);
      try {
        return await openRoutedSession(session);
      } catch (error) {
        try {
          await session.close(context);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            "Harness creation and Session cleanup failed",
          );
        }
        throw error;
      }
    },
  };

  const serverId = randomUUID();
  const server = createUnixServer(host, {
    serverId,
    path: getUnixSocketPath(serverId, "/run/user/1000/pi"),
  });
  await server.start();
  return server;
}
```

应用必须提供服务端 service host、有界 Session resolver 和已路由的 Session factory。Session discovery 与管理均为应用自有服务；协议服务端仅在路由 attachment 时向 resolver 查询 metadata。host 负责获取 worker 本地的 Session 与 Harness，失败时也在该 worker 内清理。已打开的 JavaScript Session 和 Harness 都不会跨越进程边界。

`serverId` 是 launcher 提供的逻辑身份，不是 socket 地址。Unix preset 要求显式物理 `path`；`getUnixSocketPath()` 可根据调用方选择的目录推导路径。应选择简短的私有运行时目录，不要根据长度不受控的 home 目录路径推导路由。长期运行的 launcher 替换服务端进程时，可以复用同一 ID 和路径。

`Server` 通过 `ServerListener` 组合传输；对端认证仍由应用策略负责，实验性 Unix transport 尚未实现。Unix 子模块提供 `createUnixListener()` 与 `createUnixServer()`。底层路由信封校验、CBOR 与分帧来自 `@earendil-works/pi-protocol`；Chord 负责服务控制解析、错误码、快照和更新，以及每个订阅的复制状态 encoder。

服务端和 worker 生命周期在公共 Pi 协议之外管理。可替换的应用服务端把连接 attachment 转换成私有需求更新；worker 将带 generation 标记的需求与权威 Harness 活动组合。实验性 coordinator 只提供稳定路由，并报告通用的服务端 generation 连接变化。
