# Stardust Realtime SDK

`ticos-realtime-api` is a JavaScript SDK for connecting browser or Node.js
applications to the Stardust realtime WebSocket service.

It wraps the low-level realtime socket, Stardust `session.update` payloads,
text input, PCM16 audio streaming, assistant audio/text deltas, conversation
state, and client-side function tools.

## Quickstart

Install from the local package or workspace path:

```bash
npm install /path/to/ticos-realtime-api
```

Import the SDK:

```js
import { RealtimeClient } from 'stardust-js';
```

Create a client with a Stardust realtime WebSocket URL:

```js
const client = new RealtimeClient({
  url: 'wss://stardust.example.com/realtime?terminal_secret=YOUR_TERMINAL_SECRET',
});

client.on('conversation.updated', ({ item, delta }) => {
  if (delta?.text) {
    console.log('assistant text:', delta.text);
  }

  if (delta?.audio) {
    console.log('assistant audio samples:', delta.audio.length, item.id);
  }
});

client.on('realtime.event', ({ source, event }) => {
  console.log(`[${source}]`, event.type);
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
      turn_detection: null,
    },
  },
  'stardust',
);

client.sendUserMessageContent([
  { type: 'input_text', text: '你好，请简单介绍一下你自己。' },
]);
```

## Documentation

Start from the docs index:

- [Docs index](./docs/README.md)
- [Integration guide](./docs/integration-guide.md)
- [RealtimeClient](./docs/realtime-client.md)
- [RealtimeAPI](./docs/realtime-api.md)
- [Conversation state](./docs/conversation.md)
- [Stardust integration](./docs/stardust-integration.md)
- [Video API](./docs/video-api.md)
- [Examples](./docs/examples.md)

## Project Structure

```text
ticos-realtime-api/
  index.js
  lib/
    api.js             # WebSocket transport
    client.js          # High-level realtime client
    conversation.js    # Conversation item cache and event reducer
    event_handler.js   # Event emitter helpers
    utils.js           # Audio/base64/id helpers
  docs/
  examples/
  test/
```

## Tests

Run offline unit tests:

```bash
npm run test:unit
```

The unit tests do not require a real Stardust service or API key. They cover
custom Stardust URLs, OpenAI compatibility helpers, Stardust tool sync, nullable
session updates, and TypedArray audio encoding.

## Compatibility Notes

The SDK keeps limited OpenAI Realtime compatibility in the transport and session
configuration APIs. Stardust applications should prefer:

```js
new RealtimeClient({ url: stardustRealtimeUrl })
client.updateSession(session, 'stardust')
```

OpenAI authentication headers and subprotocols are only attached when connecting
to the OpenAI default realtime URL with an API key.
