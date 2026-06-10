# ticos-realtime-api 集成接入文档

## 1. 概述

`ticos-realtime-api` 是面向 Stardust Realtime WebSocket 的 JavaScript SDK。它封装了会话配置、文本消息、PCM16 音频流、服务端事件、对话缓存和客户端工具调用，适合在 Web Playground、业务前端、调试控制台中接入 Stardust 实时语音对话。

当前 SDK 仍保留一部分 OpenAI Realtime reference client 的实现痕迹。Stardust 集成时请优先使用 `RealtimeClient`，并显式传入 Stardust realtime WebSocket URL。

## 2. 适用范围

推荐接入场景：

- 浏览器前端直接连接 Stardust realtime 服务。
- Web 应用中采集麦克风 PCM16 音频并实时上送。
- 展示用户转写、助手文本、助手音频和原始实时事件。
- 注册客户端本地工具，并在模型触发 function call 时由 SDK 自动回传结果。

当前版本注意事项：

- 浏览器和 Node.js 都会使用 `new RealtimeClient({ url })` 传入的 Stardust realtime URL。
- 只有连接 OpenAI 默认地址且提供 `apiKey` 时，SDK 才会附加 OpenAI 鉴权信息。
- `terminal_secret` 放在浏览器 WebSocket URL 中会暴露给前端用户。生产环境如需保护密钥，应使用后端 relay 或短期临时凭证。

## 3. 安装与导入

如果作为本地源码包接入：

```bash
npm install /path/to/ticos-realtime-api
```

如果在 monorepo 或 demo 中通过 alias/vendor 方式接入，请确保运行时能解析到 SDK 入口：

```ts
import { RealtimeClient, RealtimeUtils } from 'stardust-js';
```

如果业务项目通过 workspace alias 或 vendor 方式接入，可按实际 alias 调整导入路径。

## 4. 连接参数

Stardust realtime URL 通常由服务基础地址和 `terminal_secret` 组成：

```ts
function buildRealtimeUrl(baseUrl: string, terminalSecret: string) {
  const url = new URL('/realtime', baseUrl);
  url.searchParams.set('terminal_secret', terminalSecret);
  return url.toString().replace(/^http/, 'ws');
}
```

示例：

```text
wss://stardust.example.com/realtime?terminal_secret=YOUR_TERMINAL_SECRET
```

建议在连接前校验：

- `baseUrl` 必须是有效的 HTTP(S) 或 WS(S) 地址。
- `terminal_secret` 不能为空。
- 浏览器页面必须处于安全上下文，线上建议使用 HTTPS/WSS。

## 5. 最小接入示例

```ts
import { RealtimeClient } from 'stardust-js';

const client = new RealtimeClient({
  url: 'wss://stardust.example.com/realtime?terminal_secret=YOUR_TERMINAL_SECRET',
  debug: false,
});

client.on('conversation.updated', ({ item, delta }) => {
  if (delta?.transcript) {
    console.log('transcript delta:', delta.transcript);
  }

  if (delta?.text) {
    console.log('assistant text delta:', delta.text);
  }

  if (delta?.audio) {
    console.log('assistant audio samples:', delta.audio.length);
  }
});

client.on('realtime.event', ({ source, event }) => {
  console.log(`[${source}]`, event.type, event);
});

await client.connect();

client.updateSession(
  {
    model: {
      provider: 'tiwater',
      name: 'stardust-2.5-turbo',
      modalities: ['text', 'audio'],
      instructions: '你是一个简洁、可靠的语音助手。',
      temperature: 0.8,
      max_response_output_tokens: 4096,
    },
    speech: {
      voice: 'verse',
      output_audio_format: 'pcm16',
    },
    hearing: {
      input_audio_format: 'pcm16',
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 200,
      },
    },
  },
  'stardust',
);

client.sendUserMessageContent([
  { type: 'input_text', text: '你好，请简单介绍一下你自己。' },
]);
```

## 6. 会话配置

Stardust 配置通过 `client.updateSession(session, 'stardust')` 发送。SDK 会把参数包进 `session.update` 事件的 `session` 字段。

常用结构：

```ts
type StardustSession = {
  agent_id?: string;
  model: {
    provider?: string;
    name?: string;
    modalities?: Array<'text' | 'audio'>;
    instructions?: string;
    tools?: ToolDefinition[];
    tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
    temperature?: number;
    max_response_output_tokens?: number | 'inf';
    api_key?: string;
  };
  speech?: {
    voice?: string;
    output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    speed_ratio?: number;
    volume_ratio?: number;
    pitch_ratio?: number;
  };
  hearing?: {
    input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    input_audio_transcription?: { model: 'whisper-1' } | null;
    turn_detection?: {
      type: 'server_vad';
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    } | null;
  };
  vision?: {
    enable_face_detection?: boolean;
    enable_object_detection?: boolean;
    enable_face_identification?: boolean;
    object_detection_target_classes?: string[];
  };
  knowledge?: {
    scripts?: Script[];
  };
};
```

默认 Stardust session：

```json
{
  "model": {
    "provider": "tiwater",
    "name": "stardust-2.5-turbo",
    "modalities": ["text", "audio"],
    "instructions": "",
    "tools": [],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_response_output_tokens": 4096
  },
  "speech": {
    "voice": "verse",
    "output_audio_format": "pcm16"
  },
  "hearing": {
    "input_audio_format": "pcm16",
    "input_audio_transcription": null,
    "turn_detection": null
  }
}
```

配置建议：

- 连续语音对话使用 `hearing.turn_detection.type = 'server_vad'`。
- Push-to-talk 模式使用 `turn_detection: null`，松开按钮时调用 `client.createResponse()`。
- 需要纯文本对话时可设置 `model.modalities = ['text']`。
- 不要把长期有效的敏感 `api_key` 直接放到浏览器可见 session 中。

## 7. 文本消息

发送文本并触发模型回复：

```ts
client.sendUserMessageContent([
  { type: 'input_text', text: '帮我总结今天的会议重点。' },
]);
```

`sendUserMessageContent()` 会发送 `conversation.item.create`，随后调用 `response.create`。

## 8. 音频输入

SDK 接收 `Int16Array` 或 `ArrayBuffer`，并编码为 base64 后发送 `input_audio_buffer.append`。

音频格式建议：

- 采样率：24000 Hz。
- 声道：mono。
- 编码：PCM16 little-endian。
- 分片：建议 100ms 到 200ms 一片，避免过大延迟或过高事件频率。

连续 VAD 模式：

```ts
recorder.onAudio((pcm16: Int16Array) => {
  client.appendInputAudio(pcm16);
});
```

Push-to-talk 模式：

```ts
async function onPressStart() {
  client.cancelResponse();
  await recorder.start((pcm16: Int16Array) => {
    client.appendInputAudio(pcm16);
  });
}

async function onPressEnd() {
  await recorder.pause();
  client.createResponse();
}
```

注意：当前 `RealtimeUtils.arrayBufferToBase64()` 对带 `byteOffset` 的 `Int16Array` view 处理不够安全。传入音频前建议确保 chunk 是独立、紧凑的 `Int16Array`。

## 9. 音频输出

助手音频会通过 `conversation.updated` 的 `delta.audio` 暴露，类型为 `Int16Array`。播放端应按 24kHz PCM16 mono 处理。

```ts
client.on('conversation.updated', async ({ item, delta }) => {
  if (delta?.audio) {
    await player.add16BitPCM(delta.audio, item.id);
  }
});
```

如果用户在助手说话时打断，可以使用最近一次助手消息 ID 和已播放 sample 数截断服务端上下文：

```ts
client.cancelResponse(activeAssistantItemId, playedSampleCount);
```

如果只需要取消当前生成，不截断具体消息：

```ts
client.cancelResponse();
```

## 10. 事件模型

SDK 会派发两类事件。

高级对话事件：

| 事件 | 说明 |
| --- | --- |
| `conversation.updated` | 对话 item 或 delta 更新。用于渲染文本、转写、音频。 |
| `conversation.item.appended` | 新 item 加入对话。 |
| `conversation.item.completed` | item 完成。 |
| `conversation.interrupted` | 服务端检测到用户开始说话，适合停止助手音频播放。 |
| `realtime.event` | client/server 原始事件流，适合调试面板。 |

底层事件：

`client.realtime` 会把服务端事件派发为 `server.{event_type}`，把客户端事件派发为 `client.{event_type}`。例如：

```ts
client.realtime.on('server.session.created', (event) => {
  console.log('session created', event);
});

client.realtime.on('server.response.audio.delta', (event) => {
  console.log('audio delta event', event);
});
```

前端展示原始事件时建议过滤大字段：

- `audio`
- `delta`
- 图片/二进制 payload
- 敏感配置字段

## 11. 工具调用

### 11.1 客户端工具

使用 `addTool(definition, handler)` 注册客户端本地工具。服务端触发 function call 且工具名匹配时，SDK 会执行 handler，并自动发送 `function_call_output`，随后调用 `response.create`。

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
  async () => {
    return { now: new Date().toISOString() };
  },
);
```

注意：

- 同名工具不能重复注册。
- `addTool()` 会把客户端工具定义同步到 Stardust `session.update`。
- `removeTool()` 会重新同步 session，移除服务端可见的客户端工具定义。
- server-side action/tool 如果没有通过 `addTool()` 注册 handler，SDK 只会展示该 function call，不会自动回写 `function_call_output`。

### 11.2 服务端工具或机器人动作

如果工具由 Stardust 服务端或机器人端处理，只需要放入 session：

```ts
client.updateSession(
  {
    model: {
      tools: [
        {
          type: 'function',
          name: 'robot_wave_hand',
          description: '让机器人挥手',
          parameters: {
            type: 'object',
            properties: {},
          },
          required: [],
          operation_mode: 'server_mode',
          execution_type: 'asynchronous',
          result_handling: 'ignore_result',
          code: '',
          language: 'python',
          platform: 'linux',
        },
      ],
    },
  },
  'stardust',
);
```

## 12. 连接生命周期

推荐顺序：

1. 准备 realtime URL。
2. 创建 `RealtimeClient`。
3. 注册事件监听。
4. 调用 `client.connect()`。
5. 调用 `client.updateSession(session, 'stardust')`。
6. 启动录音或发送文本消息。
7. 页面退出或用户断开时调用 `client.disconnect()`。

示例：

```ts
const client = new RealtimeClient({ url: realtimeUrl });

client.on('conversation.updated', handleConversationUpdated);
client.on('conversation.interrupted', stopAssistantPlayback);
client.on('realtime.event', appendDebugEvent);

await client.connect();
client.updateSession(session, 'stardust');

// Start media after session is ready.
await recorder.start((pcm16) => client.appendInputAudio(pcm16));

// Later.
await recorder.pause();
client.disconnect();
```

`connect()` 内部会自动发送一次当前默认 session。业务 session 建议在连接成功后再显式发送一次，保证服务端收到最新配置。

## 13. 错误处理与重连

建议监听底层 close 事件：

```ts
client.realtime.on('close', ({ error }) => {
  console.log(error ? 'socket closed by error' : 'socket closed');
});
```

重连建议：

- 用户主动断开时不要自动重连。
- 网络异常断开时先停止录音和播放，再指数退避重连。
- 重连后必须重新发送 `session.update`。
- 本地 UI 的对话历史可保留，但 SDK 内部 `conversation` 会在 `disconnect()` 时清空。

## 14. 安全建议

- 不要在浏览器长期保存 `terminal_secret`。
- 不要把长期有效的模型 API key 放进前端 session。
- 调试面板不要原样展示完整 session、工具代码、知识库脚本和鉴权参数。
- 生产环境建议通过业务后端签发短期连接 URL 或 relay WebSocket。

## 15. 与 video 接口的关系

`ticos-realtime-api` 只负责 `/realtime` 语音和对话链路。视觉链路应单独连接 Stardust `/video` WebSocket。

常见派生方式：

```ts
const videoUrl = realtimeUrl.replace('/realtime', '/video');
```

如果同时启用音频和视频：

- realtime 负责 `session.update`、音频、文本、工具和对话事件。
- video 负责摄像头 JPEG 帧上送。
- video 识别结果如果通过 realtime server event 返回，可在 `realtime.event` 或具体 `server.response.video.*` 事件中消费。

## 16. 调试清单

连接失败：

- 检查 URL 是否为 `wss://.../realtime?terminal_secret=...`。
- 检查 `terminal_secret` 是否为空、过期或不匹配。
- 检查浏览器控制台是否存在 Mixed Content、证书或跨域问题。
- 检查服务端是否支持浏览器 WebSocket 连接。

没有回复：

- 确认连接后已调用 `updateSession(session, 'stardust')`。
- 文本输入确认已调用 `sendUserMessageContent()`。
- 音频输入确认已调用 `appendInputAudio()`。
- Push-to-talk 模式确认松开时调用了 `createResponse()`。
- VAD 模式确认 `hearing.turn_detection.type` 是 `server_vad`。

没有音频：

- 确认 `model.modalities` 包含 `audio`。
- 确认 `speech.output_audio_format` 是播放器支持的格式。
- 确认播放器按 24kHz PCM16 mono 解码。

工具未执行：

- 确认工具名和 `addTool()` 注册名一致。
- 确认 handler 是函数且没有抛错。
- 确认该工具是客户端工具；服务端工具不会由 SDK 自动执行。

## 17. 本地验证

核心单元测试不依赖外部网络或真实 API key：

```bash
npm run test:unit
```

该测试覆盖：

- Stardust 自定义 URL 不会被替换为 OpenAI 默认地址。
- 浏览器 Stardust 连接不会发送 OpenAI API key subprotocol。
- OpenAI 默认地址仍保留 OpenAI 鉴权构造逻辑。
- `addTool()` 和 `removeTool()` 会同步 Stardust session。
- `null` 可以用于清空 `agent_id`、`knowledge`、`speech` 等 session 字段。
- 带 `byteOffset` 的 `Int16Array` 音频视图只编码自身范围。

## 18. 推荐目录封装

业务项目中建议把 SDK 使用封装到单独模块：

```text
src/
  realtime/
    build-url.ts
    build-session.ts
    realtime-client.ts
    audio-recorder.ts
    audio-player.ts
    event-normalizer.ts
```

封装边界：

- `build-url.ts` 只处理 base URL、`terminal_secret` 和 WebSocket URL。
- `build-session.ts` 只生成 `session.update.session` 对象。
- `realtime-client.ts` 负责 `RealtimeClient` 生命周期和事件转发。
- UI 组件只消费归一化后的状态，不直接处理原始 WebSocket 事件。
