# RealtimeClient

`RealtimeClient` 是业务接入时优先使用的高级客户端。它组合了：

- `RealtimeAPI`：底层 WebSocket 收发。
- `RealtimeConversation`：对话 item 和 response 缓存。
- Stardust/OpenAI session 配置。
- 文本输入、音频输入、助手音频输出、中断、工具调用。

## 创建客户端

```ts
import { RealtimeClient } from 'stardust-js';

const client = new RealtimeClient({
  url: 'wss://stardust.example.com/realtime?terminal_secret=YOUR_TERMINAL_SECRET',
  debug: false,
});
```

构造参数：

| 字段 | 说明 |
| --- | --- |
| `url` | WebSocket URL。Stardust 接入必须显式传入 `/realtime` URL。 |
| `apiKey` | OpenAI 默认 realtime URL 兼容模式使用。Stardust URL 不使用该字段。 |
| `dangerouslyAllowAPIKeyInBrowser` | 仅用于浏览器直连 OpenAI API key 的兼容模式。 |
| `debug` | 开启底层 WebSocket 收发日志。 |

## 生命周期

推荐顺序：

1. 创建 `RealtimeClient`。
2. 注册 `conversation.updated`、`conversation.interrupted`、`realtime.event` 等监听。
3. 调用 `connect()`。
4. 调用 `updateSession(session, 'stardust')` 发送业务配置。
5. 发送文本或开始音频流。
6. 页面退出时调用 `disconnect()`。

```ts
const client = new RealtimeClient({ url: realtimeUrl });

client.on('conversation.updated', handleConversationUpdated);
client.on('conversation.interrupted', stopAssistantPlayback);

await client.connect();
client.updateSession(session, 'stardust');
```

`connect()` 会建立 WebSocket，并自动发送一次当前默认 session。业务方通常仍应在连接成功后显式发送自己的 session。

## Stardust Session

Stardust 配置通过 `updateSession(session, 'stardust')` 发送。

```ts
client.updateSession(
  {
    agent_id: 'optional-agent-id',
    model: {
      provider: 'tiwater',
      name: 'stardust-2.5-turbo',
      modalities: ['text', 'audio'],
      instructions: '你是一个简洁、可靠的语音助手。',
      tools: [],
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096,
    },
    speech: {
      voice: 'verse',
      output_audio_format: 'pcm16',
    },
    hearing: {
      input_audio_format: 'pcm16',
      input_audio_transcription: null,
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 200,
      },
    },
    vision: {
      enable_face_detection: true,
      enable_object_detection: false,
    },
  },
  'stardust',
);
```

更新语义：

- `undefined` 或未传字段表示保留当前本地配置。
- `null` 表示显式清空对应配置块或字段。
- `model`、`speech`、`hearing`、`vision` 会浅合并到当前配置。
- `agent_id` 和 `knowledge` 会按传入值直接设置。
- `model.tools` 会被格式化为 `type: 'function'` 的工具定义。

## 文本输入

```ts
client.sendUserMessageContent([
  { type: 'input_text', text: '帮我总结今天的会议重点。' },
]);
```

该方法会发送 `conversation.item.create`，然后调用 `response.create`。

## 音频输入

`appendInputAudio()` 接收 `Int16Array` 或 `ArrayBuffer`，编码为 base64 后发送 `input_audio_buffer.append`。

```ts
recorder.onAudio((pcm16: Int16Array) => {
  client.appendInputAudio(pcm16);
});
```

推荐音频格式：

- PCM16 little-endian。
- 24000 Hz。
- mono。
- 每片 100ms 到 200ms。

Push-to-talk 模式下，松开按钮时调用：

```ts
client.createResponse();
```

如果 `turn_detection` 为 `null` 且本地存在输入音频缓存，`createResponse()` 会先发送 `input_audio_buffer.commit`，再发送 `response.create`。

## 助手音频和文本输出

监听 `conversation.updated`：

```ts
client.on('conversation.updated', ({ item, delta }) => {
  if (delta?.text) {
    appendAssistantText(item.id, delta.text);
  }

  if (delta?.transcript) {
    appendTranscript(item.id, delta.transcript);
  }

  if (delta?.audio) {
    player.add16BitPCM(delta.audio, item.id);
  }
});
```

`delta.audio` 是 `Int16Array`，应按 24kHz PCM16 mono 播放。

## 中断和截断

只取消当前生成：

```ts
client.cancelResponse();
```

如果已经播放了部分助手音频，并希望截断服务端上下文：

```ts
client.cancelResponse(assistantItemId, playedSampleCount);
```

SDK 会发送 `response.cancel` 和 `conversation.item.truncate`。

## 工具调用

客户端本地工具使用 `addTool(definition, handler)` 注册。

```ts
client.addTool(
  {
    type: 'function',
    name: 'get_local_time',
    description: '获取当前浏览器本地时间',
    parameters: {
      type: 'object',
      properties: {},
    },
    required: [],
    operation_mode: 'client_mode',
    execution_type: 'synchronous',
    result_handling: 'process_in_llm',
    code: '',
    language: 'python',
    platform: 'linux',
  },
  async () => ({ now: new Date().toISOString() }),
);
```

行为：

- 同名工具不能重复注册。
- 注册和移除工具都会同步 `session.update`。
- 只有通过 `addTool()` 注册了 handler 的工具才会自动执行。
- 服务端工具、机器人动作或 MCP 工具如果没有本地 handler，只会作为 function call 展示，不会被 SDK 自动回写结果。

## 高级事件

| 事件 | 说明 |
| --- | --- |
| `conversation.updated` | item 或 delta 更新。用于渲染文本、转写和音频。 |
| `conversation.item.appended` | 新 item 加入对话。 |
| `conversation.item.completed` | item 完成。 |
| `conversation.interrupted` | 服务端检测到用户开始说话。适合停止助手播放。 |
| `realtime.event` | 原始 client/server 事件流。适合调试面板。 |

## 便捷方法

| 方法 | 说明 |
| --- | --- |
| `isConnected()` | WebSocket 是否已连接。 |
| `waitForSessionCreated()` | 等待服务端 `session.created`。 |
| `waitForNextItem()` | 等待下一条 `conversation.item.appended`。 |
| `waitForNextCompletedItem()` | 等待下一条 `conversation.item.completed`。 |
| `reset()` | 断开连接、清空监听和配置，重新初始化客户端。 |
