# Ticos Realtime API

Official WebSocket-based Realtime API SDK for Ticos. This SDK provides real-time communication capabilities for building interactive AI applications.

## Features

- 🚀 Real-time bidirectional communication
- 🎯 Support for text, audio, and image messages
- 🛠️ Function calling and tool registration
- 🔄 Session management
- 💬 Conversation state tracking
- 🔒 Enhanced error handling and type safety
- 📦 TypeScript support out of the box

## Quick Start

The fastest way to see the SDK in action is to run the demo project:

```bash
# Clone the repository
git clone https://github.com/tiwater/ticos-realtime-api.git
cd ticos-realtime-api

# Install dependencies
pnpm install

# Build the SDK
pnpm build

# Navigate to the demo project
cd examples/realtime-chat

# Install demo dependencies
pnpm install

# Create a .env.local file with your API key
echo "NEXT_PUBLIC_TICOS_API_KEY=your_api_key_here" > .env.local
echo "NEXT_PUBLIC_TICOS_API_URL=wss://stardust.ticos.cn/realtime" >> .env.local

# Start the demo
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) with your browser to see the chat demo in action.

## Installation

To use the SDK in your own project:

```bash
# Using pnpm (recommended)
pnpm add @ticos/realtime-api

# Using npm
npm install @ticos/realtime-api

# Using yarn
yarn add @ticos/realtime-api
```

## Basic Usage

```typescript
import { RealtimeClient } from '@ticos/realtime-api';

// Initialize the client
const client = new RealtimeClient();

// Connect to the Ticos Realtime API
await client.connect();

// Send a message
client.sendUserMessageContent([{ type: 'text', text: 'Hello, Ticos!' }]);

// Listen for responses
client.on('conversation.updated', (event) => {
  if (event.item.role === 'assistant') {
    console.log('Assistant response:', event.item.formatted.text);
  }
});

// Wait for a completed message
const { item } = await client.waitForNextCompletedItem();
console.log('Completed response:', item);
```

## Documentation

For detailed API documentation, run:

```bash
pnpm documentation
```

This will generate and serve the API documentation locally.

## Core Functionality

### Real-time Communication

The Ticos Realtime API enables real-time bidirectional communication between your application and Ticos AI models through WebSockets.

### Function Calling and Tool Registration

Register custom tools that can be called by the AI:

```typescript
// Register a tool
client.registerTool(
  {
    name: 'search',
    description: 'Search for information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  async (parameters) => {
    // Tool implementation
    const result = await yourSearchImplementation(parameters.query);
    return result;
  }
);

// Tools are automatically called when the model invokes them
// Listen for completed items to see if a tool was executed
client.on('conversation.item.completed', (event) => {
  console.log('Item completed:', event.item);
});
```

### Audio Support

Send and receive audio messages:

```typescript
// Send audio
const audioBuffer = new Int16Array([
  /* your audio data */
]);
client.sendUserMessageContent([{ type: 'audio', audio: audioBuffer }]);

// Or stream audio input
client.appendInputAudio(audioBuffer);
client.createResponse();

// Listen for audio responses
client.on('conversation.updated', (event) => {
  if (event.item.formatted?.audio) {
    const audioData = event.item.formatted.audio;
    // Process audio data
  }
});
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Generate documentation
pnpm documentation

# Start development mode with watch
pnpm dev
```

## License

MIT
