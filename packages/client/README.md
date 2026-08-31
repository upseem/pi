# @earendil-works/pi-client

面向远程 pi 会话、与传输无关的客户端。`PiClient` 通过一个很小的 `ByteTransport` 接口交换带长度前缀的 CBOR 消息。本包没有 Node 特有的导入。

```ts
import { PiClient, type ByteTransportFactory } from "@earendil-works/pi-client";

const transportFactory: ByteTransportFactory = async (handlers) => {
  // 使用 WebSocket、Unix socket 或其他有序字节传输进行连接。
  return {
    async send(chunk) {
      // 按调用顺序投递分片，并尊重背压。
    },
    close() {},
  };
};

const client = new PiClient({ transportFactory });
await client.connect();
const session = await client.createSession({ cwd: "/workspace" });
const unsubscribe = session.subscribe((snapshot) => render(snapshot));
await session.prompt("Inspect this project");
unsubscribe();
```

入站字节调用 `handlers.onData(chunk)`，有序关闭调用 `handlers.onClose()`，传输失败调用 `handlers.onError(error)`。工厂必须为每次连接尝试创建全新传输，并在 resolve 之前完成该传输特有的认证。例如，WebSocket 工厂可以在 upgrade 请求中提供凭据。

`PiClient` 不会自动重连。断开后需要调用 `reconnect()`。一条连接可以挂接多个会话。请求按 ID 关联。服务端快照和成功响应快照是权威状态，进度事件不会乐观地改写快照。缓存的会话元数据从 `client.snapshot?.sessions` 读取；调用 `listSessions()` 可向服务端请求刷新后的持久元数据。运行时状态在获取会话之后才可用。

`acquireSession()` 返回独立的 `SessionLease`；lease 不能直接构造。生命周期或变更协调使用 `{ mode: "exclusive" }`；多个底层消费者有意共享会话时使用 `{ mode: "shared" }`。只要已有任意 lease，独占获取会以 `PiSessionOwnershipError` 失败；已有独占 lease 时，共享获取也会失败。`attachSession()` 是共享获取的便捷方法。`createSession()` 为新创建的会话返回独占 lease。

调用 `dispose()` 或 `detach()` 只释放该 lease。lease 一旦开始释放就会拒绝后续命令。最后一个 lease 释放后，客户端才会发送协议层的 detach 请求。显式 `detach()` 失败时，lease 会重新变为可用以便重试。面向清理的 `dispose()` 失败时会报告协议错误，但会放弃本地所有权；`PiClient` 会在下一次获取之前调和这次失败的协议清理。已释放的 lease 会变为不可用，但不影响其他共享 lease。服务端移除或断开连接会使该挂接上的所有 lease 失效；对已失效 lease 调用 dispose 是空操作。客户端断开时命令会以 `PiDisconnectedError` 失败；客户端仍连接但 lease 正在释放、已释放或已失效时，命令会以 `PiSessionDetachedError` 失败。lease 实现了 `AsyncDisposable`。

`subscribe()` 观察权威快照。`onEvent()` 观察协议事件。二者都返回取消订阅函数。服务端返回的结构化错误会以 `PiServerError` 暴露。

## 限制与安全

`PiClientOptions.maxFrameLength` 限制入站和出站 CBOR payload。客户端和服务端应配置匹配的上限。传输层应另外限制排队中的出站字节，并保持发送顺序。

把对端视为不可信。使用带适当访问控制的安全传输，并在建立传输时完成认证。

订阅者抛出的异常与协议状态隔离。可在 `PiClientOptions` 中设置 `onListenerError`，把它们报告到应用日志或诊断系统。

## Unix domain socket

Node.js 和 Bun 的调用方可以使用单独导出的 Unix domain socket 传输：

```ts
import { PiClient } from "@earendil-works/pi-client";
import { createUnixTransportFactory } from "@earendil-works/pi-client/unix";

const client = new PiClient({
  transportFactory: createUnixTransportFactory({
    path: "/tmp/pi.sock",
  }),
});

await client.connect();
```

`maxPendingBytes` 限制排队中的出站数据，默认是协议帧上限的四倍。传输保持发送顺序，并在每个 send resolve 之前等待 socket 背压。

`@earendil-works/pi-client` 根入口仍与传输和运行时无关。导入兼容 Node 的传输时，必须显式使用 `@earendil-works/pi-client/unix` 子路径。
