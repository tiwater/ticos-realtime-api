# Examples

本文档提供可以直接搬到业务项目中的短示例。完整接入说明见 [integration-guide.md](./integration-guide.md)。

## 构造 URL

```ts
export function buildRealtimeUrl(baseUrl: string, terminalSecret: string) {
  const url = new URL('/realtime', baseUrl);
  url.searchParams.set('terminal_secret', terminalSecret);
  return url.toString().replace(/^http/, 'ws');
}

export function buildVideoUrl(realtimeUrl: string) {
  const url = new URL(realtimeUrl);
  url.pathname = url.pathname.replace(/\/realtime$/, '/video');
  return url.toString();
}
```

## 最小文本对话

```ts
import { RealtimeClient } from 'stardust-js';

const client = new RealtimeClient({ url: realtimeUrl });

client.on('conversation.updated', ({ delta }) => {
  if (delta?.text) {
    console.log(delta.text);
  }
});

await client.connect();
client.updateSession(
  {
    model: {
      provider: 'tiwater',
      name: 'stardust-2.5-turbo',
      modalities: ['text'],
      instructions: '你是一个简洁的助手。',
    },
  },
  'stardust',
);

client.sendUserMessageContent([
  { type: 'input_text', text: '用一句话解释实时语音对话。' },
]);
```

## 服务端 VAD 音频对话

```ts
const client = new RealtimeClient({ url: realtimeUrl });

client.on('conversation.interrupted', () => {
  player.stop();
});

client.on('conversation.updated', ({ item, delta }) => {
  if (delta?.audio) {
    player.add16BitPCM(delta.audio, item.id);
  }
});

await client.connect();
client.updateSession(
  {
    model: {
      provider: 'tiwater',
      name: 'stardust-2.5-turbo',
      modalities: ['text', 'audio'],
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

recorder.start((pcm16) => {
  client.appendInputAudio(pcm16);
});
```

## Push-to-talk

```ts
await client.connect();
client.updateSession(
  {
    hearing: {
      input_audio_format: 'pcm16',
      turn_detection: null,
    },
  },
  'stardust',
);

async function onPressStart() {
  client.cancelResponse();
  await recorder.start((pcm16) => client.appendInputAudio(pcm16));
}

async function onPressEnd() {
  await recorder.pause();
  client.createResponse();
}
```

## 客户端工具

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

SDK 会同步工具定义到 Stardust session。服务端返回同名 function call 后，SDK 会执行 handler，发送 `function_call_output`，并触发下一轮 `response.create`。

## 服务端动作工具

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

这种工具不通过 `addTool()` 注册 handler，因此 SDK 不会自动执行或回写结果。

## 原始事件调试面板

```ts
client.on('realtime.event', ({ time, source, event }) => {
  const shallow = { ...event };
  delete shallow.audio;
  delete shallow.delta;
  console.log(time, source, shallow.type, shallow);
});
```

调试面板不要原样展示敏感字段，例如 `terminal_secret`、`api_key`、完整 session、工具代码和知识库脚本。

## 视频帧上传

```ts
function packVideoFrame(seqId, jpegBytes) {
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

const video = new WebSocket(videoUrl);

video.addEventListener('open', () => {
  video.send(packVideoFrame(seqId, jpegBytes));
});

client.realtime.on('server.response.video.done', (event) => {
  console.log('video analysis:', event);
});
```

## 断开清理

```ts
await recorder.pause();
player.stop();
client.disconnect();
videoSocket?.close();
```
