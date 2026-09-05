# @earendil-works/pi-client

面向实验性 Pi 服务协议、与传输无关的客户端。

```ts
import { Client, type ByteTransportFactory } from "@earendil-works/pi-client";

const transportFactory: ByteTransportFactory = async (handlers) => {
  // 使用 WebSocket、Unix socket 或其他有序字节传输进行连接。
  return {
    async send(chunk) {
      // 按调用顺序投递字节，并尊重背压。
    },
    close() {},
  };
};

const client = await Client.connect({
  serverId: "01234567-89ab-4def-8123-456789abcdef",
  transportFactory,
});
const result = await client.request(
  { serverId: client.hello.serverId },
  { serviceId: "example.service", member: "read", args: [] },
);
```

客户端会验证物理端点报告的逻辑 `serverId` 是否符合预期。服务端范围的请求携带该 ID；每个 Session 请求则携带完整的实时目标 `{ serverId, sessionId, attachmentId }`。这个组合持久地址可防止请求被误投到其他服务端或会话；服务端生成的 attachment ID 会拒绝切换或重新挂接后延迟到达的帧。

类型化的服务端和 Session API 由应用自有的 Chord 服务绑定提供。`createClientServiceTransport()` 把惰性解析的服务端或 Session 路由适配成 Chord transport；`request()` 和 `subscribeService()` 仍是底层原语。客户端使用 Chord 的服务控制解析器和每订阅状态解码器；`pi-protocol` 只校验路由信封和严格 JSON 边界。服务订阅会返回完整的提供方快照；绑定先安装快照，再调用 `start()` 释放 hydration 期间缓冲的更新。`Client` 会按顺序应用带外 attachment 变化，但有意不构造类型化服务代理，也不解释应用契约。

应用层观察 API（例如编码代理的 `Transcript`）都是普通 Chord 服务。客户端不解释它们的快照或更新。

断开连接或 dispose 时，待处理请求会在本地被拒绝，但已接受的工作可能在 attachment 释放前于远端完成。客户端会清除实时 attachment 路由。它不会自动重连或重放请求。断开后需调用 `reconnect()`，通过应用的管理服务重新挂接，并且只显式重试已知安全的操作。

实验性本地 coordinator 只提供稳定端点并中继流量。可替换的服务端进程在公共客户端协议之外管理 Session 和 worker 生命周期。

传输 handler 的调用方式如下：

- 入站字节调用 `handlers.onData(chunk)`；
- 有序终止关闭调用 `handlers.onClose()`；
- 传输失败调用 `handlers.onError(error)`。

传输 factory 每次尝试都要创建一条全新且已认证的连接。请求按 ID 关联，服务端失败以 `ServerError` 暴露。

## Unix domain socket

Node.js 和 Bun 的调用方可以使用独立的 Unix transport：

```ts
import { Client } from "@earendil-works/pi-client";
import { createUnixTransportFactory } from "@earendil-works/pi-client/unix";

const client = new Client({
  serverId: "01234567-89ab-4def-8123-456789abcdef",
  transportFactory: createUnixTransportFactory({ path: "/tmp/pi.sock" }),
});
await client.connect();
```

Unix discovery 会扫描显式指定的物理路由目录，根据文件名推导预期的 server ID，并通过现有握手验证：

```ts
import { discoverUnixServers } from "@earendil-works/pi-client/unix";

const routes = await discoverUnixServers({ directory: "/run/user/1000/pi" });
// [{ serverId: "...", path: "/run/user/1000/pi/<serverId>.sock" }]
```

格式错误的条目、非 socket、过期或无响应的端点，以及 server ID 不匹配项都会被忽略。Discovery 是只读的，并发探测最多 16 个 socket。意外的文件系统或 socket 错误会使 discovery 失败。传入 `timeoutMs` 可覆盖默认探测超时。

`ClientOptions.maxFrameLength` 限制协议 payload。`maxPendingBytes` 限制排队中的 Unix transport 输出。两端应配置匹配的上限。
