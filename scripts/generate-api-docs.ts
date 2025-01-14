import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as TJS from 'typescript-json-schema';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: {
      apiKey: {
        type: string;
        in: string;
        name: string;
        description: string;
      };
    };
    'x-websocket-events'?: Record<string, {
      description: string;
      payload: {
        type: string;
        properties: Record<string, any>;
      };
    }>;
  };
  paths: Record<string, {
    get?: {
      summary: string;
      description: string;
      tags: string[];
      parameters: Array<{
        name: string;
        in: string;
        schema: {
          type: string;
          default?: string;
        };
        description: string;
      }>;
      responses: Record<string, {
        description: string;
      }>;
    };
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
}

async function generateOpenAPISpec() {
  // Settings for TypeScript JSON Schema generation
  const settings: TJS.PartialArgs = {
    required: true,
    ref: false,
    aliasRef: false,
    topRef: false,
    noExtraProps: true,
    excludePrivate: true,
    defaultNumberType: 'number',
  };

  // Generate JSON Schema from TypeScript types
  const program = TJS.getProgramFromFiles(
    [
      path.resolve('src/types.ts'),
      path.resolve('src/client.ts'),
      path.resolve('src/conversation.ts'),
      path.resolve('src/api.ts'),
    ],
    {
      strictNullChecks: true,
    }
  );

  const generator = TJS.buildGenerator(program, settings);
  if (!generator) {
    throw new Error('Failed to create schema generator');
  }

  // Generate schemas for main types
  const schemas = {
    RealtimeClientSettings: generator.getSchemaForSymbol('RealtimeClientSettings'),
    ItemType: generator.getSchemaForSymbol('ItemType'),
    ToolDefinitionType: generator.getSchemaForSymbol('ToolDefinitionType'),
  };

  // Base OpenAPI specification
  const openApiSpec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'Ticos Realtime API',
      version: '0.0.1-beta.1',
      description: 'Official Realtime API SDK for Ticos',
    },
    servers: [
      {
        url: 'wss://api.openai.com/v1/realtime',
        description: 'WebSocket endpoint',
      },
    ],
    components: {
      schemas,
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'API key for authentication',
        },
      },
    },
    paths: {
      '/': {
        get: {
          summary: 'Establish WebSocket connection',
          description: 'Establishes a WebSocket connection to the Realtime API server',
          tags: ['WebSocket'],
          parameters: [
            {
              name: 'model',
              in: 'query',
              schema: {
                type: 'string',
                default: 'gpt-4o-realtime-preview-2024-10-01',
              },
              description: 'The model to use for the connection',
            },
          ],
          responses: {
            '101': {
              description: 'WebSocket connection established',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'WebSocket',
        description: 'WebSocket-related operations',
      },
      {
        name: 'Conversation',
        description: 'Conversation management operations',
      },
      {
        name: 'Tools',
        description: 'Tool registration and execution operations',
      },
    ],
  };

  // Extract WebSocket events from JSDoc comments
  const events = {
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
  };

  // Add WebSocket events to OpenAPI spec
  openApiSpec.components['x-websocket-events'] = events;

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
}

generateOpenAPISpec().catch(console.error); 