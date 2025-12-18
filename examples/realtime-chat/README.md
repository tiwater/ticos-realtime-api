# Ticos Realtime API Chat Demo

This is a demonstration project showcasing how to integrate the Ticos Realtime API into a Next.js application to build a real-time chat interface.

## Features

- 💬 Real-time chat interface with Ticos AI
- 🔄 WebSocket connection management
- 🧩 React context for easy state management
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design for all devices
- 📝 TypeScript for type safety

## Quick Start

The fastest way to run this demo is to follow these steps:

### Prerequisites

- Node.js 18+ installed
- pnpm (recommended) or npm/yarn

### From the Root of the Repository

If you're starting from the root of the Ticos Realtime API repository:

```bash
# Install dependencies in the root
pnpm install

# Build the SDK
pnpm build

# Navigate to the demo project
cd examples/realtime-chat

# Install demo dependencies
pnpm install

# Create a .env.local file
echo "NEXT_PUBLIC_TICOS_API_URL=wss://realtime-relay.ticos.cn" > .env.local

# Option A (recommended for browsers): use the relay (see below) and DO NOT set a public API key

# Option B (not recommended): use an API key in the browser
# echo "NEXT_PUBLIC_TICOS_API_KEY=your_api_key_here" >> .env.local
# echo "NEXT_PUBLIC_DANGEROUSLY_ALLOW_API_KEY_IN_BROWSER=true" >> .env.local

# Start the development server
pnpm dev
```

### From the Demo Directory

If you're already in the demo directory:

```bash
# Install dependencies
pnpm install

# Create a .env.local file
echo "NEXT_PUBLIC_TICOS_API_URL=wss://realtime-relay.ticos.cn" > .env.local

# Option A (recommended for browsers): use the relay (see below) and DO NOT set a public API key

# Option B (not recommended): use an API key in the browser
# echo "NEXT_PUBLIC_TICOS_API_KEY=your_api_key_here" >> .env.local
# echo "NEXT_PUBLIC_DANGEROUSLY_ALLOW_API_KEY_IN_BROWSER=true" >> .env.local

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the chat demo in action.

## Important Notes

- This demo uses the local version of the Ticos Realtime API SDK from the parent directory.
- Make sure you've built the SDK before running the demo (`pnpm build` in the root directory).
- If you connect directly to `wss://stardust.ticos.cn/realtime`, you'll need a valid API key from Ticos. If you use the hosted relay (`wss://realtime-relay.ticos.cn`), you should NOT set a browser API key.

## Browser Auth (Relay)

Browsers can’t set custom WebSocket handshake headers like `Authorization`. If your server requires headers during the handshake, use the relay service in this repo:

```bash
# Option A: use the hosted relay
#   NEXT_PUBLIC_TICOS_API_URL=wss://realtime-relay.ticos.cn
#
# Option B: run the relay locally (from the repo root)
PORT=2859 TARGET_URL="https://stardust.ticos.cn/realtime" AUTH_TOKEN="..." pnpm relay
```

Then point the demo at the relay:

```bash
cd examples/realtime-chat
echo "NEXT_PUBLIC_TICOS_API_URL=wss://realtime-relay.ticos.cn" > .env.local
pnpm dev
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx         # Main page component
│   └── layout.tsx       # Root layout with RealtimeProvider
├── components/
│   ├── chat-container.tsx  # Main chat interface
│   ├── chat-input.tsx      # Message input component
│   └── message.tsx        # Individual message component
└── contexts/
    └── realtime-context.tsx  # Context for Ticos Realtime API
```

## How It Works

This demo uses the Ticos Realtime API to establish a WebSocket connection with Ticos AI services. The application is structured around a React context (`RealtimeContext`) that manages the connection state and provides methods for interacting with the API.

### Key Components

- **RealtimeProvider**: Initializes the Ticos Realtime API client and provides connection management
- **ChatContainer**: Displays the conversation history and handles message rendering
- **ChatInput**: Allows users to type and send messages to the AI

### Connection Flow

1. The RealtimeProvider initializes the client with your API key
2. When the user opens the chat, the provider establishes a WebSocket connection
3. Messages are sent and received in real-time through this connection
4. The UI updates dynamically as new messages arrive

## Learn More

- [Ticos Realtime API Documentation](https://github.com/tiwater/ticos-realtime-api)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
