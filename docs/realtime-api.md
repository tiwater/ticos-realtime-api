# RealtimeAPI

`RealtimeAPI` 是底层 WebSocket 封装。多数业务接入应使用
`RealtimeClient`，只有在调试协议、写适配层或构建自定义客户端时才需要直接使用它。

## 创建连接

```ts
import { RealtimeAPI } from 'stardust-js';

const realtime = new RealtimeAPI({
  url: 'wss://stardust.example.com/realtime?terminal_secret=YOUR_TERMINAL_SECRET',
  debug: true,
});

await realtime.connect();
```

Stardust URL 会原样用于浏览器和 Node.js 环境。SDK 不会把自定义 URL 替换为 OpenAI 默认地址。

## 鉴权和子协议

Stardust 连接：

- URL 使用 `/realtime?terminal_secret=...`。
- 浏览器 WebSocket subprotocol 只发送 `realtime`。
- 不附加 OpenAI API key subprotocol。
- Node.js 不附加 OpenAI Authorization header。

OpenAI 兼容模式：

- 只有连接默认 `wss://api.openai.com/v1/realtime` 且提供 `apiKey` 时才会附加 OpenAI 鉴权。
- 浏览器会使用 `realtime`、`openai-insecure-api-key.*`、`openai-beta.realtime-v1` subprotocol。
- Node.js 会使用 `Authorization: Bearer ...` 和 `OpenAI-Beta: realtime=v1` header。

## 发送事件

```ts
realtime.send('session.update', {
  session: {
    model: {
      provider: 'tiwater',
      name: 'stardust-2.5-turbo',
    },
  },
});
```

`send(eventName, data)` 会自动补充：

- `event_id`
- `type`

并通过 WebSocket 发送完整事件。

## 接收事件

服务端每条消息会按原始 `type` 派发：

```ts
realtime.on('server.session.updated', (event) => {
  console.log(event.session);
});

realtime.on('server.*', (event) => {
  console.log('server event:', event.type);
});
```

客户端发送事件也会派发：

```ts
realtime.on('client.session.update', (event) => {
  console.log('sent session update:', event.event_id);
});

realtime.on('client.*', (event) => {
  console.log('client event:', event.type);
});
```

## 连接状态

| 方法 | 说明 |
| --- | --- |
| `connect(settings?)` | 建立 WebSocket。OpenAI 默认 URL 可通过 `settings.model` 设置 model query。 |
| `disconnect()` | 关闭当前 WebSocket 并清空内部 socket 引用。 |
| `isConnected()` | 是否存在活动 WebSocket。 |
| `send(eventName, data?)` | 发送 client event。未连接时会抛错。 |
| `receive(eventName, event)` | 手动派发 server event，通常只在测试中使用。 |

## close 事件

连接异常或关闭时会派发：

```ts
realtime.on('close', ({ error }) => {
  console.log(error ? 'closed by error' : 'closed');
});
```

业务重连时应先停止录音和播放，然后重新建立连接并重新发送 `session.update`。
