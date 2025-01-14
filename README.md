# Ticos Realtime API

Official WebSocket-based Realtime API SDK for Ticos. This SDK provides real-time communication capabilities for building interactive AI applications.

## Features

- 🚀 Real-time bidirectional communication
- 🎯 Support for text, audio, and image messages
- 🛠️ Tool registration and execution
- 🔄 Session management
- 💬 Conversation state tracking
- 📦 TypeScript support out of the box

## Installation

```bash
# Using npm
npm install @ticos/realtime-api

# Using pnpm
pnpm add @ticos/realtime-api

# Using yarn
yarn add @ticos/realtime-api
```

## Quick Start

```typescript
import { RealtimeClient } from '@ticos/realtime-api';

// Initialize the client
const client = new RealtimeClient({
  url: 'wss://api.ticos.ai/v1/realtime',
  apiKey: 'YOUR_API_KEY',
});

// Connect to the server
await client.connect();

// Create a conversation
const conversation = await client.createConversation();

// Send a message
await conversation.sendMessage('Hello!');

// Listen for responses
conversation.on('item.appended', (item) => {
  if (item.type === 'text') {
    console.log('Received:', item.content[0].text);
  }
});
```

## Core Classes

### RealtimeClient

The main client class for interacting with the Ticos Realtime API.

```typescript
const client = new RealtimeClient({
  url: 'wss://api.ticos.ai/v1/realtime',
  apiKey: 'YOUR_API_KEY',
  debug: true, // Optional: Enable debug logging
});

// Event handling
client.on('connected', () => console.log('Connected!'));
client.on('error', (error) => console.error('Error:', error));
```

### RealtimeConversation

Manages conversation flow and message handling.

```typescript
// Create a conversation
const conversation = await client.createConversation();

// Send different types of messages
// Text message
await conversation.sendMessage('Hello!');

// Audio message
await conversation.sendMessage({
  type: 'audio',
  data: audioBuffer,
  transcript: 'Hello!',
});

// Handle conversation events
conversation.on('item.completed', (item) => {
  console.log('Message completed:', item);
});
```

### RealtimeAPI

Handles tool registration and execution.

```typescript
// Register a tool
await client.api.registerTool({
  name: 'search',
  description: 'Search for information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
    },
    required: ['query'],
  },
});

// Handle tool calls
client.api.on('tool.call', async (toolCall) => {
  if (toolCall.tool_name === 'search') {
    // Handle the search request
    const result = await performSearch(toolCall.parameters.query);
    return result;
  }
});
```

## WebSocket Events

The SDK uses various WebSocket events for real-time communication:

- **client.\*** - All client-side events
- **server.\*** - All server-side events
- **session.update** - Session configuration updates
- **conversation.start** - New conversation started
- **conversation.end** - Conversation ended
- **conversation.item.appended** - New message added
- **conversation.item.completed** - Message processing completed
- **conversation.item.error** - Error in message processing
- **tool.register** - Tool registration
- **tool.call** - Tool execution request
- **tool.response** - Tool execution response

## Error Handling

```typescript
// Global error handling
client.on('error', (error) => {
  console.error('Client error:', error);
});

// Conversation-specific error handling
conversation.on('item.error', (error) => {
  console.error('Conversation error:', error);
});

// Tool execution error handling
client.api.on('tool.error', (error) => {
  console.error('Tool error:', error);
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
pnpm docs

# Start development mode with watch
pnpm dev
```

## API Documentation

For detailed API documentation, run:

```bash
pnpm docs
```

This will generate and serve the API documentation locally.

## License

MIT © [Tiwater](https://github.com/tiwater)
