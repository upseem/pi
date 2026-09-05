# @earendil-works/pi-protocol

面向实验性 Pi 协议、与运行时无关的路由信封、CBOR 编码和字节流分帧。

协议版本 `8` 定义：

- 标识逻辑 `serverId` 的版本握手；
- 显式的服务端与 Session 请求目标；
- 携带不透明严格 JSON payload 的关联请求与响应；
- 请求取消、不透明订阅更新和带外 attachment 变化；
- 非空不透明错误码和有界传输消息。

服务端目标包含 `{ serverId }`；Session 目标包含 `{ serverId, sessionId, attachmentId }`。这个组合路由把调用限定到一个逻辑服务端、持久 Session 和实时 presentation attachment。管理层的 `attach()` 和 `detach()` 不返回路由标识符；服务端通过带外 `attachment` 消息发布选中的实时路由。断开连接会在已接纳的调用结算后，只释放该 presentation 的 attachment。

Chord 负责这些信封中 payload 的语义：`{ serviceId, instance?, member, args }` 调用、`$chord.service` 控制词汇、服务目录、订阅快照和更新、服务错误码，以及用于复制状态的独立 Delta 路径 codec。`pi-protocol` 会验证每个不透明 payload 都是严格 JSON，但不会校验或导出 Chord 语法。客户端和服务端在服务适配器边界通过 `@earendil-works/chord` 解析这些值。

Session 目录状态、管理结果、transcript、模型、插件和其他所有应用值都仍是不透明服务数据。真实的 `Session` 与 `AgentHarness` 留在进程内。服务端和 Session 调用会被不透明地路由给其所属 provider，再由 Chord 和应用负责校验与调用。

服务端与 worker 生命周期有意放在此公共协议之外。实验性本地 coordinator 只是一个不透明消息路由器；每个可替换的服务端进程自行持有私有生命周期协议。

每个线上帧由四字节无符号大端 payload 长度和一个定长 CBOR 项组成。`encodeClientMessage()` 与 `encodeServerMessage()` 会校验并编码完整帧。`ClientMessageDecoder` 与 `ServerMessageDecoder` 接受任意的流分片与合并。

```ts
import {
  PROTOCOL_VERSION,
  encodeClientMessage,
  ServerMessageDecoder,
  type ClientHello,
} from "@earendil-works/pi-protocol";

const hello: ClientHello = { type: "hello", version: PROTOCOL_VERSION };
transport.send(encodeClientMessage(hello));

const decoder = new ServerMessageDecoder({ maxFrameLength: 1024 * 1024 });
for (const message of decoder.push(incomingChunk)) handleServerMessage(message);
decoder.end();
```

所有信封 schema 都拒绝未知对象属性；codec 会递归拒绝非 JSON 的不透明 payload，包括非有限数字、字节数组、`undefined`、prototype 和循环引用。信封违规、畸形 CBOR 与非法分帧会抛出 `ProtocolValidationError`。特定 payload 的适配器必须在解码后自行执行语义校验。传输层必须保持字节顺序。实验性传输尚未实现对端认证和已认证服务上下文。

默认限制为每个 CBOR payload/帧 16 MiB、1,000,000 个数组元素或 map 条目，以及 64 层嵌套。该协议仍是实验性的，不提供兼容性保证。
