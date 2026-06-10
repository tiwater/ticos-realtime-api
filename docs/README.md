# ticos-realtime-api 文档索引

这个目录放置 `ticos-realtime-api` 自身的 SDK 文档。根目录
`README.md` 只保留快速开始和导航；更完整的协议、API、示例和集成说明放在这里。

## 推荐阅读顺序

1. [集成接入文档](./integration-guide.md)
2. [RealtimeClient](./realtime-client.md)
3. [Stardust 集成说明](./stardust-integration.md)
4. [RealtimeAPI](./realtime-api.md)
5. [Conversation 状态](./conversation.md)
6. [Video API](./video-api.md)
7. [示例代码](./examples.md)

## 文档职责

| 文档 | 内容 |
| --- | --- |
| [integration-guide.md](./integration-guide.md) | 完整端到端接入手册，适合业务方第一次接入。 |
| [realtime-client.md](./realtime-client.md) | `RealtimeClient` 的生命周期、session、文本、音频、工具和事件。 |
| [realtime-api.md](./realtime-api.md) | 底层 WebSocket 连接、鉴权、事件收发和 OpenAI 兼容边界。 |
| [conversation.md](./conversation.md) | `RealtimeConversation` 如何维护 item、response、delta 和乱序事件。 |
| [stardust-integration.md](./stardust-integration.md) | Stardust `/realtime` 端点、`session.update`、工具、agent 和安全边界。 |
| [video-api.md](./video-api.md) | Stardust `/video` 的关系、鉴权、二进制 JPEG 帧协议和 realtime 事件反馈。 |
| [examples.md](./examples.md) | 最小文本、音频、工具、事件调试和视频封包示例。 |
| [refactor-plan.md](./refactor-plan.md) | 历史重构计划和风险记录，不作为当前接入入口。 |

## 当前 SDK 边界

- SDK 主要面向 Stardust realtime WebSocket。
- 高级接入优先使用 `RealtimeClient`。
- 需要底层协议调试时再使用 `RealtimeAPI`。
- SDK 负责 `/realtime` 语音、文本、对话和工具链路。
- `/video` 是 Stardust 服务端的独立 WebSocket 通道，不由当前 SDK 自动管理。
- 浏览器中携带 `terminal_secret` 会暴露给前端用户，生产环境建议使用短期凭证或后端 relay。
