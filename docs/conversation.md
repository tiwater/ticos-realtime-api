# RealtimeConversation

`RealtimeConversation` 是 SDK 的对话状态 reducer。它接收服务端 realtime 事件，维护本地 item 列表、response 列表、音频缓存、文本 delta 和工具调用参数。

业务通常不需要直接创建它，可以通过：

```ts
const items = client.conversation.getItems();
const item = client.conversation.getItem(itemId);
```

读取当前状态。

## 核心职责

- 处理 `conversation.item.created`、`conversation.item.deleted`、`conversation.item.truncated`。
- 处理 `response.created`、`response.output_item.added`、`response.output_item.done`。
- 合并 `response.text.delta`、`response.audio.delta`、`response.audio_transcript.delta`。
- 累积 `response.function_call_arguments.delta`。
- 兼容 `response.function_call_arguments.done` 早于 item 创建的乱序情况。
- 根据 `previous_item_id` 重排对话 item。
- 缓存用户输入音频，用于手动提交音频后的本地展示。

## Item 格式化字段

每个 item 会补充 `formatted` 字段，便于 UI 直接消费：

```ts
type FormattedItem = {
  id: string;
  type: string;
  role?: 'user' | 'assistant' | 'system';
  status?: 'in_progress' | 'completed' | 'incomplete';
  formatted: {
    text?: string;
    transcript?: string;
    audio?: Int16Array;
    tool?: {
      type: 'function';
      name: string;
      call_id: string;
      arguments: string;
    };
    output?: string;
  };
};
```

UI 推荐优先读取：

- `item.formatted.text`
- `item.formatted.transcript`
- `item.formatted.audio`
- `item.formatted.tool`
- `item.formatted.output`

## 事件处理结果

`processEvent(event, ...args)` 返回：

```ts
{
  item: Item | null;
  delta: {
    text?: string;
    transcript?: string;
    audio?: Int16Array;
    arguments?: string;
  } | null;
}
```

`RealtimeClient` 会把这个结果转发为 `conversation.updated`。

## 对话顺序

服务端事件可能乱序到达，尤其是 response 和 conversation 事件交错时。SDK 会使用 `previous_item_id` 构造链式顺序：

1. 先找没有有效前驱的 item。
2. 再深度访问每个 item 的子节点。
3. 最后补上没有访问到的孤立 item。

这样可以避免 UI 只按到达顺序渲染导致历史对话错位。

## 音频处理

助手音频：

- `response.audio.delta` 的 base64 payload 会被解码为 `Int16Array`。
- 新片段会合并到 `item.formatted.audio`。
- 本次片段会作为 `delta.audio` 返回给播放器。

用户音频：

- `RealtimeClient.createResponse()` 在无 VAD 模式下会提交本地输入音频缓存。
- `conversation.queueInputAudio()` 会把这段音频挂到后续用户 item 的 `formatted.audio` 上。

## 容错边界

当前 reducer 对多数未知或缺失 item 的事件会抛错，由 `RealtimeClient` 捕获并打印 warning。一个例外是 `response.audio.delta` 找不到 item 时会跳过，避免音频乱序导致整个 UI 中断。

如果需要展示完整调试信息，请同时监听：

```ts
client.on('realtime.event', appendRawEvent);
```
