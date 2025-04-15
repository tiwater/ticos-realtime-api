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
cd examples/realtime-chat-demo

# Install demo dependencies
pnpm install

# Create a .env.local file with your API key
echo "NEXT_PUBLIC_TICOS_API_KEY=your_api_key_here" > .env.local
echo "NEXT_PUBLIC_TICOS_API_URL=wss://stardust.ticos.cn/realtime" >> .env.local

# Start the development server
pnpm dev
```

### From the Demo Directory

If you're already in the demo directory:

```bash
# Install dependencies
pnpm install

# Create a .env.local file with your API key
echo "NEXT_PUBLIC_TICOS_API_KEY=your_api_key_here" > .env.local
echo "NEXT_PUBLIC_TICOS_API_URL=wss://stardust.ticos.cn/realtime" >> .env.local

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the chat demo in action.

## Important Notes

- This demo uses the local version of the Ticos Realtime API SDK from the parent directory.
- Make sure you've built the SDK before running the demo (`pnpm build` in the root directory).
- You'll need a valid API key from Ticos to use the demo.

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
