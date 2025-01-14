/**
 * Types of content that can be sent in a message
 */
export type ContentType = 'text' | 'audio' | 'image';

/**
 * Status of a conversation item
 */
export type ItemStatus = 'pending' | 'completed' | 'error';

/**
 * Base content interface for messages
 */
export interface ContentBase {
  type: ContentType;
}

/**
 * Text content in a message
 */
export interface TextContent extends ContentBase {
  type: 'text';
  text: string;
}

/**
 * Audio content in a message
 */
export interface AudioContent extends ContentBase {
  type: 'audio';
  audio: string; // Base64 encoded audio data
  transcript?: string;
}

/**
 * Image content in a message
 */
export interface ImageContent extends ContentBase {
  type: 'image';
  image: string; // Base64 encoded image data
  caption?: string;
}

/**
 * Union type for all possible content types
 */
export type Content = TextContent | AudioContent | ImageContent;

/**
 * Error information for items with error status
 */
export interface ItemError {
  code: string;
  message: string;
}

/**
 * Base item type for conversation items
 */
export interface ItemType {
  id: string;
  type: 'text' | 'audio' | 'image' | 'tool_call' | 'tool_response';
  content: Content[];
  status: ItemStatus;
  error?: ItemError;
}

/**
 * Conversation state type
 */
export interface ConversationState {
  id: string;
  items: ItemType[];
  status: 'active' | 'completed' | 'error';
  metadata?: Record<string, any>;
} 