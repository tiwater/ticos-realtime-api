/**
 * Types of content that can be sent in a message
 */
export type ContentType = 'text' | 'audio' | 'image' | 'input_text' | 'input_audio';

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
 * Input text content in a message
 */
export interface InputTextContent extends ContentBase {
  type: 'input_text';
  text: string;
}

/**
 * Input audio content in a message
 */
export interface InputAudioContent extends ContentBase {
  type: 'input_audio';
  audio?: string; // Base64 encoded audio data
  transcript?: string | null;
}

/**
 * Union type for all possible content types
 */
export type Content = TextContent | AudioContent | ImageContent | InputTextContent | InputAudioContent;

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
  type: 'message' | 'text' | 'audio' | 'image' | 'tool_call' | 'tool_response';
  role?: 'user' | 'assistant';
  content: Content[];
  status?: 'completed' | 'incomplete';
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