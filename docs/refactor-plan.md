# ticos-realtime-api 历史重构计划

> 本文是重构过程中的历史计划和风险记录。当前接入入口请优先阅读
> [README](../README.md)、[文档索引](./README.md) 和
> [集成接入文档](./integration-guide.md)。下文的“当前主要问题”保留为当时
> 的问题清单，其中一部分已经在后续重构中完成修复。

## 背景

`ticos-realtime-api` 当前处于从 OpenAI Realtime reference client 迁移到 Stardust Realtime SDK 的中间状态。核心代码已经加入 Stardust session 结构、工具调用处理和下游 playground 接入，但连接层、文档、测试、类型声明和发布流程仍保留较多 OpenAI 原始实现痕迹。

本次重构目标不是一次性重写 SDK，而是先稳定现有业务依赖，再逐步收敛协议边界、开发体验和发布质量。

## 当前实施状态

已完成第一阶段和第二阶段中的基础项：

1. `RealtimeAPI.connect()` 已改为浏览器和 Node.js 都使用传入的 `url`。
2. OpenAI 鉴权 subprotocol/header 只在 OpenAI 默认地址且存在 `apiKey` 时附加。
3. `addTool()` 和 `removeTool()` 已同步 Stardust `session.update`。
4. `session.update` 支持通过 `null` 清空部分 Stardust 配置字段。
5. `RealtimeUtils.arrayBufferToBase64()` 已只编码 TypedArray view 自身范围。
6. 新增 `npm run test:unit` 离线单元测试，覆盖连接适配、工具同步、配置清空和音频编码。

## 重构目标

1. 明确 SDK 的主要运行目标是 Stardust realtime，而不是 OpenAI reference client。
2. 保证浏览器和 Node.js 两种运行环境都能正确使用自定义 `url`。
3. 固化 `session.update`、工具调用、音频收发、事件缓存的行为契约。
4. 提供无需真实外部服务即可运行的核心回归测试。
5. 统一包名、README、类型声明、构建脚本和下游 vendored 同步流程。

## 非目标

1. 不在第一阶段移除所有 OpenAI 兼容能力。
2. 不改变 Stardust 服务端协议字段，除非服务端契约已经明确更新。
3. 不直接重构 `ticos-playground-demo` 的 UI 交互，只修正 SDK 使用契约和同步方式。

## 当前主要问题

### 连接层仍与 OpenAI 强绑定

`lib/api.js` 的浏览器分支会为 WebSocket 固定附加 OpenAI subprotocol，包括 `openai-insecure-api-key.*` 和 `openai-beta.realtime-v1`。Node.js 分支更严重，会直接连接硬编码的 OpenAI URL，忽略构造函数传入的 `url`。

这会导致：

1. Node.js 环境下无法可靠连接 Stardust realtime。
2. 无 `apiKey` 时浏览器分支可能发送 `openai-insecure-api-key.null`。
3. SDK 的连接行为和 `new RealtimeClient({ url })` 的直觉不一致。

### Stardust session 与工具同步语义不完整

当前默认 `activeConfigType` 是 `stardust`，但 `addTool()` 之后调用无参 `updateSession()` 时，不会把 `this.tools` 合并进 `stardustConfig.model.tools`。`removeTool()` 删除本地工具后也不会自动同步服务端 session。

这会导致：

1. 客户端注册的工具处理器和服务端可见工具定义不一致。
2. 工具移除后服务端 session 可能继续保留旧工具。
3. 下游业务难以判断工具调用到底应该由客户端处理还是仅展示。

### 音频编码对 TypedArray view 不安全

`RealtimeUtils.arrayBufferToBase64()` 在接收 `Int16Array` 时直接使用 `.buffer`，没有考虑 `byteOffset` 和 `byteLength`。如果传入的是某个大 buffer 的局部视图，可能把视图范围外的数据一起编码发送。

这对麦克风流式音频尤其危险，因为真实音频 chunk 经常来自带 offset 的 `Buffer` 或 TypedArray view。

### session 配置无法显式清空部分字段

Stardust 配置更新中，`knowledge`、`agent_id` 等字段使用 truthy 判断，无法通过空字符串、`null`、空对象等值表达“清空配置”。同时 `updateSession()` 会无条件打印完整 sessionConfig，后续如果包含 `api_key`、知识库脚本或业务配置，会产生日志泄露风险。

### 文档、包信息和测试仍停留在 OpenAI reference client

`README.md` 仍指导用户安装和导入 `@openai/realtime-api-beta`，测试依赖 `OPENAI_API_KEY` 和 OpenAI 服务端错误文案，`package-lock.json` 的根包名也仍是 `@openai/realtime-api-beta`。

这会导致：

1. 新接入者无法判断当前 SDK 的真实定位。
2. 测试无法稳定覆盖 Stardust 行为。
3. 发布物和源码身份不一致。

### 类型声明和构建流程没有脚本化

`package.json` 的 `types` 指向 `dist/index.d.ts`，但没有声明生成脚本。`dist` 中部分类型比源码 JSDoc 更新，部分返回值又和源码不一致，说明类型产物可能依赖手工更新。

### 下游 vendored SDK 缺少同步机制

`ticos-playground-demo` 通过 alias 使用 `vendor/ticos-realtime-api` 中的源码副本。原项目修复后，如果没有同步脚本、版本号或检查项，下游仍可能运行旧 SDK。

## 推荐重构阶段

### 第一阶段：修正高风险行为

优先级最高，建议作为一个小版本完成。

1. 重构 `RealtimeAPI.connect()`：
   - 浏览器和 Node.js 都必须使用 `this.url`。
   - 只在连接 OpenAI 默认地址且存在 `apiKey` 时附加 OpenAI 鉴权协议或 header。
   - Stardust URL 不应携带 OpenAI subprotocol。
   - `model` 参数只应在 OpenAI 默认连接或调用方明确要求时追加。

2. 修正工具同步：
   - 抽出 `buildStardustSession()` 或等价内部方法，统一合并 `stardustConfig` 与 `this.tools`。
   - `addTool()` 和 `removeTool()` 都应在已连接时触发 `session.update`。
   - 明确 server-side tool/action 与 client-side handler tool 的区分字段。

3. 修正音频编码：
   - 对 `Int16Array`、`Float32Array`、`ArrayBuffer` 分别处理。
   - TypedArray 只编码其 view 范围内的字节。
   - 增加 offset view 的单元测试。

4. 移除默认 session 日志：
   - 删除无条件 `console.log`。
   - 如需调试，复用 `debug` 开关并脱敏敏感字段。

### 第二阶段：稳定 Stardust session 契约

1. 定义 Stardust session 字段更新语义：
   - `undefined` 表示不更新。
   - `null` 表示显式清空。
   - 空数组和空对象应按调用方原样发送。

2. 补齐类型和 JSDoc：
   - `agent_id`、`knowledge`、`model.api_key`、speech 音色参数等字段保持源码和声明一致。
   - 明确 `updateSession()`、`updateStardustSession()` 的返回值。

3. 明确连接生命周期：
   - 是否允许在 `connect()` 前调用 `updateSession()` 缓存配置。
   - `connect()` 是否自动发送默认 `session.update`。
   - 下游是否应在 `connect()` 前注册事件监听。

4. 梳理事件容错策略：
   - 哪些未知 server event 应忽略。
   - 哪些缺失 item/response 应抛错。
   - 哪些乱序事件需要队列缓存。

### 第三阶段：测试体系重建

1. 增加 mock WebSocket 测试，不依赖外部网络或真实密钥。
2. 覆盖以下核心场景：
   - 自定义 Stardust URL 在浏览器和 Node.js 下均被使用。
   - `session.update` 发送 Stardust 默认 session。
   - `addTool()`、`removeTool()` 会同步工具列表。
   - server-side function/action 不会被自动回写 `function_call_output`。
   - `response.function_call_arguments.done` 早于 item created 时仍能创建稳定 item。
   - 音频 delta 合并、TypedArray view 编码、用户音频队列缓存。
   - close/error 事件不会导致重复断开或状态泄露。

3. 保留少量在线集成测试，但默认跳过：
   - 通过环境变量显式开启。
   - 区分 OpenAI 集成测试和 Stardust 集成测试。

### 第四阶段：发布和文档收敛

1. 更新包身份：
   - 确认包名是否为 `@ticos/realtime-api` 或内部私有包名。
   - 同步 `package.json`、`package-lock.json`、README、示例代码。

2. 增加脚本：
   - `build`：生成类型声明。
   - `test:unit`：运行无网络测试。
   - `test:integration`：运行外部服务测试。
   - `lint` 或 `typecheck`：检查 JSDoc/声明输出。

3. 重写 README：
   - Stardust 浏览器接入。
   - Stardust Node.js 接入。
   - session.update 配置示例。
   - 音频输入输出格式。
   - 工具调用模式。
   - 与 OpenAI 兼容模式的边界。

4. 更新示例：
   - 移除或标记 OpenAI 原始示例。
   - 增加 Stardust realtime URL + terminal_secret 示例。
   - 增加最小浏览器示例和 Node.js mock/example。

### 第五阶段：下游同步治理

1. 为 `ticos-playground-demo/vendor/ticos-realtime-api` 增加同步说明或脚本。
2. 每次 SDK 修改后，明确是否需要同步 vendored 目录。
3. 在 playground 构建或文档中记录 SDK 源版本。
4. 中长期建议让 playground 依赖正式包或 workspace 包，而不是手工复制源码。

## 建议验证清单

每个阶段完成后至少执行：

1. 核心源码语法检查。
2. SDK 单元测试。
3. 类型声明生成检查。
4. playground 使用 vendored SDK 的构建检查。
5. 浏览器端手动连接 Stardust realtime。
6. Node.js 端自定义 URL 连接验证。

对于第一阶段，额外验证：

1. 自定义 URL 不再落到 OpenAI 默认地址。
2. 无 `apiKey` 的 Stardust 浏览器连接不会发送 OpenAI 鉴权 subprotocol。
3. `addTool()` 后服务端收到工具定义。
4. `removeTool()` 后服务端不再收到旧工具定义。
5. 带 `byteOffset` 的音频 chunk 编码后长度正确。

## 风险和注意事项

1. 连接层改动会影响 OpenAI 兼容模式，需要用明确测试保护。
2. session 清空语义可能改变现有调用方行为，建议先文档化再修改。
3. 工具同步修复可能暴露之前被隐藏的重复工具定义问题，需要给出清晰错误信息。
4. 下游 playground 当前使用 vendored 副本，SDK 修复不会自动生效。
5. 如果服务端 Stardust 协议仍在变化，SDK 应尽量把协议字段集中在一个 builder/adapter 层，减少散落修改。

## 推荐落地顺序

1. 修 `RealtimeAPI.connect()` 的 URL 和鉴权适配。
2. 修 `arrayBufferToBase64()` 的 TypedArray view 编码。
3. 抽出 Stardust session builder，统一处理工具合并和清空语义。
4. 增加 mock WebSocket 单元测试。
5. 收敛 README、package-lock、examples 和类型生成脚本。
6. 建立 playground vendored 同步流程。
