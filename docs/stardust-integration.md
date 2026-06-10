# Stardust 集成说明

本文聚焦 `ticos-realtime-api` 与 Stardust 服务端 `/realtime` 的集成边界。完整端到端接入步骤见 [integration-guide.md](./integration-guide.md)。

## 连接地址

Stardust realtime 使用 WebSocket：

```text
wss://stardust.example.com/realtime?terminal_secret=YOUR_TERMINAL_SECRET
```

构造示例：

```ts
function buildRealtimeUrl(baseUrl: string, terminalSecret: string) {
  const url = new URL('/realtime', baseUrl);
  url.searchParams.set('terminal_secret', terminalSecret);
  return url.toString().replace(/^http/, 'ws');
}
```

服务端也支持通过 `Authorization: Bearer <token>` 传递凭证。浏览器直连时更常见的是 `terminal_secret` query 参数。

## 基本握手

```ts
const client = new RealtimeClient({ url: realtimeUrl });

client.on('realtime.event', ({ source, event }) => {
  console.log(source, event.type);
});

await client.connect();
client.updateSession(session, 'stardust');
```

服务端接收 `session.update` 后会更新 robot/session 状态，并通过 output queue 下发 `session.updated`。

## session.update 结构

SDK 发送：

```json
{
  "event_id": "evt_x",
  "type": "session.update",
  "session": {
    "agent_id": "optional-agent-id",
    "model": {},
    "speech": {},
    "hearing": {},
    "vision": {},
    "knowledge": {}
  }
}
```

常用字段：

| 字段 | 说明 |
| --- | --- |
| `agent_id` | 可让服务端从 Agent ConfigServer 加载配置。客户端传入字段会与 agent 配置合并。 |
| `model.provider` | 模型供应商，如 `tiwater`、`openai`、`aliyun`、`bytedance`、`deepseek` 等。 |
| `model.name` | 模型名称，如 `stardust-2.5-turbo`。 |
| `model.modalities` | 交互模式，常见为 `['text']` 或 `['text', 'audio']`。服务端协议也支持 `video`。 |
| `model.instructions` | 系统提示词，可包含 Stardust 变量模板。 |
| `model.tools` | function/MCP 等工具配置。 |
| `speech.voice` | TTS 音色。 |
| `speech.output_audio_format` | 输出音频格式，浏览器播放通常使用 `pcm16`。 |
| `hearing.input_audio_format` | 输入音频格式，通常为 `pcm16`。 |
| `hearing.turn_detection` | `server_vad` 或 `null`。 |
| `vision` | 视频感知开关，由 `/video` 通道输入图像后在服务端使用。 |
| `knowledge` | 知识库或脚本配置。 |

## VAD 模式

服务端 VAD：

```ts
client.updateSession({
  hearing: {
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 200,
    },
  },
});
```

Push-to-talk 或客户端 VAD：

```ts
client.updateSession({
  hearing: {
    turn_detection: null,
  },
});

// 松开按钮后
client.createResponse();
```

## 工具模式

客户端工具：

- 通过 `client.addTool(definition, handler)` 注册。
- SDK 会把工具定义合并到 `session.model.tools`。
- 服务端发回同名 function call 后，SDK 自动执行 handler 并回传 `function_call_output`。

服务端工具或机器人动作：

- 直接放入 `session.model.tools`。
- 不通过 `addTool()` 注册 handler。
- SDK 只展示 function call，不会自动执行，也不会自动回传结果。

MCP 或服务端展开工具：

- Stardust 服务端会在 `session.update` 中预处理 `mcp` / `ticos_mcp` 类型工具。
- SDK 不负责连接 MCP server。

## 事件映射

常见下行事件：

| 服务端事件 | SDK 消费方式 |
| --- | --- |
| `session.created` | `client.waitForSessionCreated()` 或 `realtime.event`。 |
| `session.updated` | `realtime.event` 或 `client.realtime.on('server.session.updated')`。 |
| `conversation.item.created` | 转为 `conversation.item.appended` / `conversation.updated`。 |
| `response.text.delta` | 转为 `conversation.updated.delta.text`。 |
| `response.audio.delta` | 转为 `conversation.updated.delta.audio`。 |
| `response.audio_transcript.delta` | 转为 `conversation.updated.delta.transcript`。 |
| `response.function_call_arguments.*` | 转为 `item.formatted.tool.arguments`。 |
| `response.video.done` | 当前 SDK 不做专门 reducer，可从 `realtime.event` 或底层事件监听读取。 |

## 安全边界

- `terminal_secret` 出现在浏览器 URL 中时，对用户可见。
- 不要在前端长期保存 `terminal_secret`、模型 API key、工具代码或知识库敏感内容。
- 调试面板展示 `realtime.event` 时应过滤 `audio`、`delta`、`session` 中的敏感字段。
- 生产环境建议由业务后端签发短期连接 URL，或通过后端 relay 代理 Stardust WebSocket。

## 与服务端代码的对应关系

Stardust 服务端当前相关入口：

- `/realtime`：`src/websockethandlers/realtime_handler.py`
- 通用 WebSocket 鉴权：`src/websockethandlers/websocket_handler_base.py`
- Session 协议说明：`docs/session_config.md`
- `/video`：`src/websockethandlers/video_handler.py`
- Video 协议说明：`docs/video_websocket_protocol.md`
