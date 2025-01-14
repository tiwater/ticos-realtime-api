// Core types
export {
  // Client types
  RealtimeClientSettings,
  ToolDefinition,
  ToolRegistration,
  // Config types
  TicosConfigOptions,
  TicosModelConfig,
  AudioConfig,
  VisionConfig,
  KnowledgeConfig,
} from './types/client';

// Event types
export * from './types/events';

// Message types
export * from './types/conversation';

// Core functionality
export * from './client';
export * from './api';
export * from './conversation';
export * from './event-handler';

// Configuration
export * from './config/base';
export * from './config/ticos';

// Provider implementations
export * from './openai/client';
export * from './openai/types';

// Utilities
export * from './utils';
