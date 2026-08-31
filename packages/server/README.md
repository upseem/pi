# @earendil-works/pi-server

实验性。本包仍在积极开发中，可能在无通知的情况下变更或移除。API 与行为尚未稳定。

这是 pi 的服务端包。

## 会话服务端核心

本包导出 `PiServer` 会话服务端。

```ts
import type { PiServerService } from "@earendil-works/pi-server";
import { createUnixServer } from "@earendil-works/pi-server/unix";

const service: PiServerService = {
  async listSessions() {
    return storage.listSessions();
  },
  async listModels() {
    return modelRegistry.listModels();
  },
  async createSession(options) {
    return storage.createAndOpen(options);
  },
  async openSession(sessionId) {
    return storage.open(sessionId);
  },
};

const server = createUnixServer(service, {
  path: "/tmp/pi/server.sock",
});
await server.start();
```

`PiServer` 通过 `PiServerListener` 接口组合传输监听器。每个监听器必须先完成该传输特有的认证与授权，再把连接交给 `PiServer`。例如，WebSocket 监听器可以在 HTTP upgrade 期间校验凭据，而 Unix 监听器依赖 socket 的文件系统权限。Unix 子模块导出 `createUnixListener()` 构建块和 `createUnixServer()` 预设，既覆盖常见用法，又不会把主服务端耦到 Unix socket。监听器使用 `@earendil-works/pi-protocol` 的长度前缀 CBOR 消息。

本包不提供独立 CLI 或编码代理服务。应用需要自己实现 `PiServerService`。

`PiServerService.listSessions()` 返回协议层的 `SessionMetadata`，不是已获取的运行时状态。服务应按其存储实际支持的持久字段做映射，可以省略 `updatedAt`、`parentSessionId`、`sessionName` 和 `cwd`。`PiServer` 会从实时快照刷新可用元数据，不要求已存储的会话伪造阶段、模型、思考级别、附件或锁状态。

## 传输测试

自定义传输可以使用 `@earendil-works/pi-server/testing` 做确定性的协议一致性测试。它导出 `createTestServer()`、`TestServerService`、`ProtocolTestClient`，以及与传输无关的 `WireChannel` 契约。Unix 传输测试可以使用 `connectUnixTestClient()`。

## `pi-ai` 协议桥

`@earendil-works/pi-ai` 的领域对象与 `@earendil-works/pi-protocol` 的线上 DTO 彼此独立。本包负责二者边界，并导出 `toProtocolModelMetadata()`、`toProtocolAssistantMessage()`、`toProtocolUserMessage()` 和 `toProtocolToolResultMessage()`。

适配器会拒绝非法工具输入、标识符、时间戳以及不匹配的工具结果；`toProtocolToolResultMessage()` 需要原始 `ToolCall`，以便校验关联并自行转换参数。诊断细节会被显式清洗。封闭的 `pi-ai` 联合类型会穷尽映射，编译期字段清单会枚举当前 `pi-ai` 属性，因此新增字段必须经过显式审查。协议在语义相同处沿用 `pi-ai` 词汇，例如 `toolCall` 和 `toolUse`。协议 schema 强制一致的生命周期状态；测试会把适配器输出再经运行时 schema 编码，不兼容的变更会在桥接包中失败。
