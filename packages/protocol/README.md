# @earendil-works/pi-protocol

面向实验性 pi 协议的、与运行时无关的 schema、类型、CBOR 编码，以及字节流分帧。

协议版本 `1` 使用二进制消息，线上布局如下：

1. 四个字节的无符号大端 payload 长度。
2. 一个定长 CBOR 项，内容即为消息。

客户端发出的第一条消息始终是 `hello`，其中包含 `PROTOCOL_VERSION`。后续消息使用带关联的请求/响应信封，以及服务端事件信封。会话快照和服务端快照是权威状态。进度事件只是短暂的 UI 提示，不得归并进权威状态。传输层必须在交换协议字节之前完成认证。

会话列表包含 `SessionMetadata`，即可在不获取会话运行时的情况下使用的、归一化后的持久元数据。只有 `id` 和 `createdAt` 是必需的；当底层存储支持时，才会包含 `updatedAt`、`parentSessionId`、`sessionName` 和 `cwd`。阶段、模型、思考级别、附件、锁定等运行时状态只出现在已获取的 `SessionSnapshot` 中。

## 带校验的消息 API

`encodeClientMessage()` 和 `encodeServerMessage()` 会校验消息，并返回完整分帧后的 `Uint8Array`。增量解码器接受任意分片或合并，因此可用于流、套接字以及自定义字节传输。

```ts
import {
  PROTOCOL_VERSION,
  createServerMessageDecoder,
  encodeClientMessage,
  type ClientHello,
} from "@earendil-works/pi-protocol";

const hello: ClientHello = {
  type: "hello",
  version: PROTOCOL_VERSION,
};

transport.send(encodeClientMessage(hello));

const decoder = createServerMessageDecoder({ maxFrameLength: 1024 * 1024 });
for (const message of decoder.push(incomingChunk)) {
  handleServerMessage(message);
}
decoder.end(); // 字节流关闭时调用，用于检测截断。
```

也可以直接使用 `ClientMessageDecoder` 和 `ServerMessageDecoder`。Schema 违规、畸形 CBOR 以及非法分帧会抛出 `ProtocolValidationError`。校验错误不会保留被拒绝的 payload。

`parseClientMessage()` 和 `parseServerMessage()` 只校验已经解码好的值，不会解析 JSON 字符串。

## 传输支持

每种传输都携带同一套完整字节：`[uint32-be CBOR 长度][CBOR payload]`。传输层可以把这些字节任意拆分或合并。

本包不自带传输实现。调用方需要提供能保持字节顺序、并能报告流关闭的字节流传输。自定义传输必须处理任意的帧分片与合并。

所有传输都应视为不可信。在把连接交给协议之前，配置匹配的帧长度上限，并按传输方式实施相应的访问控制。Unix socket 可以用文件系统权限；网络传输可以在建立连接时认证。

## 编码与分帧

`encodeCbor()` 和 `decodeCbor()` 实现协议所采用的严格 RFC 8949 子集。`encodeFrame()` 和 `FrameDecoder` 独立于 schema 和 CBOR 处理分帧。

该 CBOR 子集支持：

- `null` 和布尔值
- 有限数字：整数限制在 JavaScript 安全整数范围内，非整数编码为 float64
- UTF-8 字符串
- `Uint8Array` 字节串
- 定长数组
- 定长 map，表示为键唯一的字符串键对象

未定义的对象属性会被省略。值为 JSON 的协议字段会拒绝 CBOR 字节串和非普通对象。顶层 undefined、数组中的 undefined 元素、稀疏数组、非有限或不安全数字、tag、不定长项、畸形 UTF-8、尾随数据、过深嵌套以及过大的值都会被拒绝。

默认限制为每个 CBOR payload/帧 16 MiB、1,000,000 个数组元素或 map 条目、以及 64 层嵌套。这些限制可通过选项配置。帧解码器会在缓冲 payload 字节之前先校验声明的长度。

所有 schema 都会拒绝未知对象属性。该协议仍是实验性的，不提供兼容性保证。
