// Core types
export {
  // Client types
  ClientOptions,
  ToolDefinition,
  ToolRegistration,
  // Config types
  RealtimeConfig,
  ModelConfig,
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
export * from './config/openai';
export * from './config/ticos';

// Provider types
export * from './openai/types';

// Utilities
export * from './utils';
