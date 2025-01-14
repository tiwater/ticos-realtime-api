import { ItemType } from './conversation';
import { RealtimeClientSettings, ToolDefinition } from './client';

/**
 * Base event interface
 */
export interface Event {
  type: string;
}

/**
 * WebSocket event source
 */
export type EventSource = 'client' | 'server';

/**
 * Event with timestamp and source
 */
export interface TimestampedEvent {
  time: string;
  source: EventSource;
  event: Event;
}

/**
 * Session update event payload
 */
export interface SessionUpdateEvent extends Event {
  session: RealtimeClientSettings;
}

/**
 * Conversation start event payload
 */
export interface ConversationStartEvent extends Event {
  conversation_id: string;
  metadata?: Record<string, any>;
}

/**
 * Conversation end event payload
 */
export interface ConversationEndEvent extends Event {
  conversation_id: string;
  reason: 'completed' | 'timeout' | 'error';
}

/**
 * Item event payload
 */
export interface ItemEvent extends Event {
  item: ItemType;
}

/**
 * Item error event payload
 */
export interface ItemErrorEvent extends ItemEvent {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Tool registration event payload
 */
export interface ToolRegisterEvent extends Event {
  tool: ToolDefinition;
}

/**
 * Tool call event payload
 */
export interface ToolCallEvent extends Event {
  tool_name: string;
  parameters: Record<string, any>;
  call_id: string;
}

/**
 * Tool response event payload
 */
export interface ToolResponseEvent extends Event {
  call_id: string;
  result?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
} 