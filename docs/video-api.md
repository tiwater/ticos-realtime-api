# Video API

`ticos-realtime-api` 目前只封装 Stardust `/realtime` 对话链路，不直接管理 `/video` WebSocket。视频接入需要业务侧单独建立 `/video` 连接，并按 Stardust 服务端二进制协议上传 JPEG 帧。

## 通道关系

| 通道 | 方向 | 用途 |
| --- | --- | --- |
| `/realtime` | 双向 | session、文本、音频、工具、对话事件。 |
| `/video` | 上行 | 摄像头 JPEG 帧上传。 |

典型组合：

1. 先连接 `/realtime`。
2. 发送 `session.update`，开启需要的 `vision` 能力。
3. 再连接 `/video`，上传 JPEG 帧。
4. 识别结果可能通过 realtime 下行事件或服务端控制通道返回。

## URL

```text
wss://stardust.example.com/video?terminal_secret=YOUR_TERMINAL_SECRET
```

可从 realtime URL 派生：

```ts
function buildVideoUrl(realtimeUrl: string) {
  const url = new URL(realtimeUrl);
  url.pathname = url.pathname.replace(/\/realtime$/, '/video');
  return url.toString();
}
```

## 鉴权

服务端通用 WebSocket 鉴权支持：

1. `Authorization: Bearer <token>`
2. `Proxy-Authorization: Bearer <token>`
3. Query 参数 `terminal_secret=<token>`

鉴权成功后，服务端解析 `group_id` 和 `robot_id`。如果鉴权或设备信息失败，握手会返回 401 或 400。

## 开启视觉能力

视觉开关通过 `/realtime` 的 `session.update.session.vision` 配置：

```ts
client.updateSession(
  {
    vision: {
      enable_face_detection: true,
      enable_face_identification: true,
      enable_object_detection: true,
      object_detection_target_classes: ['person', 'cup'],
    },
  },
  'stardust',
);
```

服务端 `/video` handler 会读取当前 robot/session 中的 `vision` 配置初始化视觉分析会话。

## 二进制帧格式

`/video` 每条 WebSocket binary message 表示一帧 JPEG：

| 偏移 | 长度 | 类型 | 字段 | 说明 |
| --- | --- | --- | --- | --- |
| 0 | 1 | uint8 | `sync_head` | 固定 `0x54`。 |
| 1 | 1 | uint8 | `msg_type` | 固定 `0x20`。 |
| 2 | 4 | uint32 little-endian | `seq_id` | 帧序号。 |
| 6 | 4 | uint32 little-endian | `msg_length` | JPEG payload 长度。 |
| 10 | N | bytes | `jpeg_data` | JPEG 数据。 |
| 10+N | 1 | byte | `padding` | 必须追加 1 字节。 |

注意：当前服务端解析 JPEG 使用 `message[10:-1]`，会丢弃最后 1 字节。因此发送端必须在 JPEG 数据后追加 1 字节 padding。

## 浏览器封包示例

```ts
function packVideoFrame(seqId: number, jpegBytes: Uint8Array) {
  const packet = new Uint8Array(10 + jpegBytes.byteLength + 1);
  const view = new DataView(packet.buffer);

  view.setUint8(0, 0x54);
  view.setUint8(1, 0x20);
  view.setUint32(2, seqId, true);
  view.setUint32(6, jpegBytes.byteLength, true);
  packet.set(jpegBytes, 10);
  packet[10 + jpegBytes.byteLength] = 0x00;

  return packet;
}

const ws = new WebSocket(videoUrl);
ws.binaryType = 'arraybuffer';

ws.addEventListener('open', () => {
  const packet = packVideoFrame(seqId, jpegBytes);
  ws.send(packet);
});
```

## 反馈事件

`/video` 通道本身通常不返回每帧确认。服务端会把视觉分析结果写入输出队列，常见 realtime 侧事件为：

```json
{
  "type": "response.video.done",
  "response_id": "...",
  "image_info": {
    "current_image_name": "...",
    "recv_image_count": 10
  }
}
```

也可能包含：

- `face_info`
- `object_info`
- `hand_info`

当前 SDK 不对 `response.video.done` 做专门 reducer。业务侧可监听原始事件：

```ts
client.realtime.on('server.response.video.done', (event) => {
  console.log('video result:', event);
});

client.on('realtime.event', ({ source, event }) => {
  if (source === 'server' && event.type === 'response.video.done') {
    console.log(event);
  }
});
```

## 性能建议

- 控制 JPEG 尺寸和帧率，避免浏览器和服务端队列堆积。
- 服务端处理延迟超过约 80ms 的帧可能会被丢弃。
- 不需要视觉能力时不要开启 `/video` 连接。
- 页面退出时同时关闭 `/realtime` 和 `/video`。
