import * as fs from 'fs';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Ticos Realtime API',
    version: '0.0.1-beta.1',
    description: `
Official Realtime API SDK for Ticos. This API provides real-time communication capabilities through WebSocket connections.

## Core Classes

### RealtimeClient
The main client class for interacting with the Ticos Realtime API. It handles WebSocket connections, authentication, and event management.

\`\`\`typescript
const client = new RealtimeClient({
  url: 'wss://api.ticos.ai/v1/realtime',
  apiKey: 'YOUR_API_KEY'
});

await client.connect();
\`\`\`

### RealtimeAPI
Manages the API-level operations and provides methods for tool registration and execution.

\`\`\`typescript
const api = client.api;
await api.registerTool({
  name: 'search',
  description: 'Search for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    }
  }
});
\`\`\`

### RealtimeConversation
Handles conversation flow, message management, and state tracking.

\`\`\`typescript
const conversation = await client.createConversation();
await conversation.sendMessage('Hello!');
\`\`\`

## Features
- Real-time bidirectional communication
- Support for text and audio messages
- Tool registration and execution
- Session management
- Conversation state tracking

## Authentication
All connections require an API key that should be passed in the Authorization header.
    `,
  },
  servers: [
    {
      url: 'wss://api.ticos.ai/v1/realtime',
      description: 'Production WebSocket endpoint',
    },
    {
      url: 'wss://api.staging.ticos.ai/v1/realtime',
      description: 'Staging WebSocket endpoint',
    },
  ],
  components: {
    schemas: {
      RealtimeClientSettings: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'WebSocket endpoint URL',
            example: 'wss://api.ticos.ai/v1/realtime',
          },
          apiKey: {
            type: 'string',
            description: 'API key for authentication',
            example: 'sk_ticos_xxxxxxxxxxxx',
          },
          dangerouslyAllowAPIKeyInBrowser: {
            type: 'boolean',
            description: 'Whether to allow API key usage in browser (not recommended for production)',
            default: false,
          },
          debug: {
            type: 'boolean',
            description: 'Enable debug logging',
            default: false,
          },
        },
        required: ['url', 'apiKey'],
      },
      ItemType: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the item',
            example: 'msg_123456789',
          },
          type: {
            type: 'string',
            description: 'Type of the item',
            enum: ['text', 'audio', 'image', 'tool_call', 'tool_response'],
            example: 'text',
          },
          content: {
            type: 'array',
            description: 'Array of content objects containing the actual message data',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: 'Content type',
                  enum: ['text', 'audio', 'image'],
                },
                text: {
                  type: 'string',
                  description: 'Text content if type is text',
                  example: 'Hello, how can I help you today?',
                },
                audio: {
                  type: 'string',
                  description: 'Base64 encoded audio data if type is audio',
                  example: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10...',
                },
                transcript: {
                  type: 'string',
                  description: 'Audio transcript if type is audio',
                  example: 'Hello, how can I help you today?',
                },
                image: {
                  type: 'string',
                  description: 'Base64 encoded image data if type is image',
                  example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
                },
              },
            },
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'error'],
            description: 'Current status of the item',
            example: 'completed',
          },
          error: {
            type: 'object',
            description: 'Error details if status is error',
            properties: {
              code: {
                type: 'string',
                description: 'Error code',
                example: 'invalid_request',
              },
              message: {
                type: 'string',
                description: 'Error message',
                example: 'Invalid request parameters',
              },
            },
          },
        },
        required: ['id', 'type', 'content', 'status'],
      },
      ToolDefinitionType: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the tool',
            example: 'search_database',
          },
          description: {
            type: 'string',
            description: 'Description of what the tool does',
            example: 'Searches the database for relevant information',
          },
          parameters: {
            type: 'object',
            description: 'JSON Schema for the tool parameters',
            example: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                },
              },
              required: ['query'],
            },
          },
        },
        required: ['name', 'description', 'parameters'],
      },
      RealtimeClient: {
        type: 'object',
        description: 'Main client class for interacting with the Ticos Realtime API',
        properties: {
          settings: {
            $ref: '#/components/schemas/RealtimeClientSettings',
          },
          api: {
            $ref: '#/components/schemas/RealtimeAPI',
          },
          isConnected: {
            type: 'boolean',
            description: 'Whether the client is currently connected',
          },
          isConnecting: {
            type: 'boolean',
            description: 'Whether the client is currently establishing a connection',
          },
        },
        methods: {
          connect: {
            description: 'Establishes a WebSocket connection to the server',
            returns: 'Promise<void>',
            example: 'await client.connect();',
          },
          disconnect: {
            description: 'Closes the WebSocket connection',
            returns: 'Promise<void>',
            example: 'await client.disconnect();',
          },
          createConversation: {
            description: 'Creates a new conversation instance',
            returns: 'Promise<RealtimeConversation>',
            example: 'const conversation = await client.createConversation();',
          },
          on: {
            description: 'Registers an event listener',
            parameters: {
              event: {
                type: 'string',
                description: 'Event name to listen for',
              },
              handler: {
                type: 'function',
                description: 'Callback function to handle the event',
              },
            },
            example: "client.on('connected', () => console.log('Connected!'));",
          },
          off: {
            description: 'Removes an event listener',
            parameters: {
              event: {
                type: 'string',
                description: 'Event name to stop listening for',
              },
              handler: {
                type: 'function',
                description: 'Callback function to remove',
              },
            },
          },
        },
      },
      RealtimeAPI: {
        type: 'object',
        description: 'API management class for tool registration and execution',
        properties: {
          client: {
            $ref: '#/components/schemas/RealtimeClient',
            description: 'Reference to the parent client instance',
          },
          tools: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ToolDefinitionType',
            },
            description: 'List of registered tools',
          },
        },
        methods: {
          registerTool: {
            description: 'Registers a new tool with the API',
            parameters: {
              tool: {
                $ref: '#/components/schemas/ToolDefinitionType',
                description: 'Tool definition to register',
              },
            },
            returns: 'Promise<void>',
            example: `await api.registerTool({
  name: 'search',
  description: 'Search for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    }
  }
});`,
          },
          unregisterTool: {
            description: 'Removes a registered tool',
            parameters: {
              name: {
                type: 'string',
                description: 'Name of the tool to unregister',
              },
            },
            returns: 'Promise<void>',
          },
          handleToolCall: {
            description: 'Handles incoming tool execution requests',
            parameters: {
              toolCall: {
                type: 'object',
                properties: {
                  tool_name: { type: 'string' },
                  parameters: { type: 'object' },
                  call_id: { type: 'string' },
                },
              },
            },
            returns: 'Promise<void>',
          },
        },
      },
      RealtimeConversation: {
        type: 'object',
        description: 'Manages conversation flow and message handling',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the conversation',
          },
          client: {
            $ref: '#/components/schemas/RealtimeClient',
            description: 'Reference to the parent client instance',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ItemType',
            },
            description: 'List of conversation items (messages, events, etc.)',
          },
          status: {
            type: 'string',
            enum: ['active', 'completed', 'error'],
            description: 'Current status of the conversation',
          },
        },
        methods: {
          sendMessage: {
            description: 'Sends a message in the conversation',
            parameters: {
              content: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Text message content',
                  },
                  {
                    type: 'object',
                    description: 'Complex message content (audio, image, etc.)',
                  },
                ],
              },
              options: {
                type: 'object',
                description: 'Additional message options',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['text', 'audio', 'image'],
                  },
                },
              },
            },
            returns: 'Promise<ItemType>',
            example: `// Send text message
await conversation.sendMessage('Hello!');

// Send audio message
await conversation.sendMessage({
  type: 'audio',
  data: audioBuffer,
  transcript: 'Hello!'
});`,
          },
          end: {
            description: 'Ends the conversation',
            parameters: {
              reason: {
                type: 'string',
                enum: ['completed', 'timeout', 'error'],
                description: 'Reason for ending the conversation',
              },
            },
            returns: 'Promise<void>',
          },
          on: {
            description: 'Registers a conversation-specific event listener',
            parameters: {
              event: {
                type: 'string',
                description: 'Event name to listen for',
              },
              handler: {
                type: 'function',
                description: 'Callback function to handle the event',
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key for authentication. Use format: "Bearer YOUR_API_KEY"',
      },
    },
    'x-websocket-events': {
      'client.*': {
        description: 'All client-side events',
        payload: {
          type: 'object',
          properties: {
            event_id: { type: 'string' },
            type: { type: 'string' },
          },
        },
      },
      'server.*': {
        description: 'All server-side events',
        payload: {
          type: 'object',
          properties: {
            type: { type: 'string' },
          },
        },
      },
      'session.update': {
        description: 'Update session configuration',
        payload: {
          type: 'object',
          properties: {
            session: { $ref: '#/components/schemas/RealtimeClientSettings' },
          },
        },
      },
      'conversation.start': {
        description: 'Start a new conversation',
        payload: {
          type: 'object',
          properties: {
            conversation_id: { 
              type: 'string',
              example: 'conv_123456789',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata for the conversation',
            },
          },
        },
      },
      'conversation.end': {
        description: 'End the current conversation',
        payload: {
          type: 'object',
          properties: {
            conversation_id: { 
              type: 'string',
              example: 'conv_123456789',
            },
            reason: {
              type: 'string',
              enum: ['completed', 'timeout', 'error'],
              example: 'completed',
            },
          },
        },
      },
      'conversation.item.appended': {
        description: 'New item added to conversation',
        payload: {
          type: 'object',
          properties: {
            item: { $ref: '#/components/schemas/ItemType' },
          },
        },
      },
      'conversation.item.completed': {
        description: 'Conversation item completed',
        payload: {
          type: 'object',
          properties: {
            item: { $ref: '#/components/schemas/ItemType' },
          },
        },
      },
      'conversation.item.error': {
        description: 'Error occurred while processing conversation item',
        payload: {
          type: 'object',
          properties: {
            item: { $ref: '#/components/schemas/ItemType' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      'tool.register': {
        description: 'Register a new tool',
        payload: {
          type: 'object',
          properties: {
            tool: { $ref: '#/components/schemas/ToolDefinitionType' },
          },
        },
      },
      'tool.call': {
        description: 'Tool execution request',
        payload: {
          type: 'object',
          properties: {
            tool_name: { type: 'string' },
            parameters: { type: 'object' },
            call_id: { type: 'string' },
          },
        },
      },
      'tool.response': {
        description: 'Tool execution response',
        payload: {
          type: 'object',
          properties: {
            call_id: { type: 'string' },
            result: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        summary: 'Establish WebSocket connection',
        description: `
Establishes a WebSocket connection to the Realtime API server.

## Connection Flow
1. Client initiates WebSocket connection with API key in Authorization header
2. Server validates API key and accepts connection
3. Client receives welcome message and session configuration
4. Client can start sending and receiving messages

## Example (JavaScript)
\`\`\`javascript
const client = new RealtimeClient({
  url: 'wss://api.ticos.ai/v1/realtime',
  apiKey: 'YOUR_API_KEY',
});

// Connect and handle events
await client.connect();
const conversation = await client.createConversation();

// Send a message
await conversation.sendMessage('Hello!');

// Register a tool
await client.api.registerTool({
  name: 'search',
  description: 'Search for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    }
  }
});
\`\`\`
        `,
        tags: ['WebSocket'],
        parameters: [
          {
            name: 'model',
            in: 'query',
            schema: {
              type: 'string',
              default: 'gpt-4o-realtime-preview-2024-10-01',
              enum: [
                'gpt-4o-realtime-preview-2024-10-01',
                'gpt-4o-realtime-preview-2024-03-01',
              ],
            },
            description: 'The model to use for the connection',
            required: true,
          },
          {
            name: 'version',
            in: 'query',
            schema: {
              type: 'string',
              default: '2024-03-01',
            },
            description: 'API version to use',
            required: false,
          },
        ],
        responses: {
          '101': {
            description: 'WebSocket connection established successfully',
          },
          '401': {
            description: 'Invalid or missing API key',
          },
          '429': {
            description: 'Rate limit exceeded',
          },
        },
        security: [
          {
            apiKey: [],
          },
        ],
      },
    },
  },
  tags: [
    {
      name: 'WebSocket',
      description: 'WebSocket connection management',
    },
    {
      name: 'Conversation',
      description: 'Conversation flow and message handling',
    },
    {
      name: 'Tools',
      description: 'Tool registration and execution',
    },
  ],
  security: [
    {
      apiKey: [],
    },
  ],
};

// Create docs directory if it doesn't exist
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs');
}

// Write the OpenAPI specification to a file
fs.writeFileSync(
  'docs/openapi.json',
  JSON.stringify(openApiSpec, null, 2)
);

// Generate HTML documentation using Redoc
const redocHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Ticos Realtime API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url="openapi.json"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
`;

// Write the HTML file
fs.writeFileSync('docs/index.html', redocHTML);

console.log('✨ Generated OpenAPI documentation in docs/'); 