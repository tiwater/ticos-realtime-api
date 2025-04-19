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
export { RealtimeClient } from './core/client';
export { RealtimeAPI } from './core/realtime';
export { RealtimeConversation } from './core/conversation';
export { RealtimeEventHandler } from './core/event-handler';

// Utilities
export * from './utils';

// Export types from event-handler
export type { EventHandlerCallbackType } from './core/event-handler';

// Export types from conversation
export type { ItemContentDelta } from './core/conversation';
