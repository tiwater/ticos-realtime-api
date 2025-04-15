import * as fs from 'fs';
import * as path from 'path';
import * as TJS from 'typescript-json-schema';

// Generate JSON Schema from TypeScript types
const program = TJS.getProgramFromFiles(
  [
    path.resolve('src/types/client.ts'),
    path.resolve('src/types/conversation.ts'),
    path.resolve('src/types/events.ts'),
    path.resolve('src/core/client.ts'),
    path.resolve('src/core/conversation.ts'),
    path.resolve('src/core/realtime.ts'),
  ],
  {
    strictNullChecks: true,
  }
);

// Generate schemas for specific types
const settings: TJS.PartialArgs = {
  required: true,
  ref: false,
  aliasRef: false,
  topRef: false,
  noExtraProps: true,
};

const generator = TJS.buildGenerator(program, settings);
if (!generator) {
  console.error('Failed to create schema generator');
  process.exit(1);
}

// Extract schemas from TypeScript types
const clientOptionsSchema = generator.getSchemaForSymbol('ClientOptions');
const toolDefinitionSchema = generator.getSchemaForSymbol('ToolDefinition');
const itemTypeSchema = generator.getSchemaForSymbol('ItemType');
const eventSchema = generator.getSchemaForSymbol('Event');

// Create OpenAPI spec using extracted schemas
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Realtime API',
    version: '0.1.1',
    description: `
Official SDK for Realtime API. This API provides real-time communication capabilities through WebSocket connections.

## Core Classes

### RealtimeClient
The main client class for interacting with the Realtime API. It handles WebSocket connections, authentication, and event management.

\`\`\`typescript
const client = new RealtimeClient({
  url: 'wss://stardust.ticos.cn/realtime',
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
      url: 'wss://stardust.ticos.cn/realtime',
      description: 'Production WebSocket endpoint',
    },
    {
      url: 'wss://staging.stardust.ticos.cn/realtime',
      description: 'Staging WebSocket endpoint',
    },
  ],
  components: {
    schemas: {
      // Use extracted schemas
      ClientOptions: clientOptionsSchema || {},
      ToolDefinition: toolDefinitionSchema || {},
      ItemType: itemTypeSchema || {},
      Event: eventSchema || {},
    },
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
      },
    },
  },
  paths: {
    '/': {
      get: {
        summary: 'Connect to the Realtime API WebSocket',
        description: `
Establishes a WebSocket connection to the Realtime API. Once connected, you can send and receive messages in real-time.

\`\`\`typescript
const client = new RealtimeClient({
  url: 'wss://stardust.ticos.cn/realtime',
  apiKey: 'YOUR_API_KEY'
});

await client.connect();
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
};

// Create docs directory if it doesn't exist
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs');
}

// Write the OpenAPI spec to a JSON file
fs.writeFileSync('docs/openapi.json', JSON.stringify(openApiSpec, null, 2));

// Create a simple HTML file that uses ReDoc to display the OpenAPI spec
const redocHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Realtime API Documentation</title>
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