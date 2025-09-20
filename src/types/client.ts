import { ItemType, Content } from './conversation';

export { ItemType, Content };

/**
 * Configuration options for initializing the client
 */
export interface ClientOptions {
  /** WebSocket endpoint URL */
  url: string;
  /** API key for authentication */
  apiKey?: string;
  /** Whether to allow API key usage in browser (not recommended for production) */
  dangerouslyAllowAPIKeyInBrowser?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  /** Parameter type */
  type: string;
  /** Parameter description */
  description: string;
}

/**
 * Tool definition for registering tools with the client
 */
export interface ToolDefinition {
  /** Tool type, always "function" */
  type: "function";
  /** Optional unique identifier */
  id?: string;
  /** Name of the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Parameters schema */
  parameters?: {
    type?: "object";
    properties?: Record<string, ToolParameter | any>;
    required?: string[];
  } | any;
  /** Required parameter names */
  required?: string[];
  /** Tool operation mode */
  operation_mode?: "client_mode" | "server_mode";
  /** Tool execution type */
  execution_type?: "synchronous" | "asynchronous";
  /** How to handle the tool's result */
  result_handling?: "process_in_llm" | "process_in_client" | "ignore_result";
  /** Tool implementation code */
  code?: string;
  /** Programming language of the code */
  language?: "python" | "shell";
  /** Operating system platform */
  platform?: "linux" | "macos" | "windows";
}

/**
 * Configuration with methods for dynamic session management
 */
export interface ConfigWithMethods {
  /** Get session payload */
  getSessionPayload(): { session: Partial<RealtimeConfig> };
  /** Update configuration */
  updateConfig(updates: Partial<RealtimeConfig>): void;
  /** Reset configuration to defaults */
  reset(): void;
  /** Get turn detection type */
  getTurnDetectionType(): string | null | { type: string;[key: string]: unknown };
}

/**
 * Tool registration type combining definition and handler
 */
export interface ToolRegistration {
  definition: ToolDefinition;
  handler: Function;
}

/**
 * Model configuration settings
 */
export interface ModelConfig {
  /** Model provider (e.g., 'tiwater') */
  provider: string;
  /** Model name (e.g., 'stardust-2.5-turbo') */
  name: string;
  /** Supported modalities */
  modalities: string[];
  /** System instructions */
  instructions?: string;
  /** Work mode for the model */
  workmode?: 'realtime' | 'restful';
  /** Emotion classifier model */
  emotion_classifier?: string | null;
  /** Memory instructions */
  memory_instructions?: string;
  /** Enable memory generation setting */
  enable_memory_generation?: 'disabled' | 'server' | 'client';
  /** Position for memory insertion */
  memory_position?: string;
  /** Instructions for memory generation */
  memory_generation_instructions?: string;
  /** Multi-LLM configuration */
  multi_llm?: string;
  /** API key for the model */
  api_key?: string;
  /** Include initial prompt configuration */
  include_initial_prompt?: 'first' | 'last' | string | undefined;
  /** Initial user prompt content */
  initial_user_prompt?: string;
  /** Initial assistant prompt content */
  initial_assistant_prompt?: string;
  /** History conversation length */
  history_conversation_length?: number;
  /** Available tools */
  tools?: ToolDefinition[];
  /** Tool choice strategy */
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  /** Temperature for response generation */
  temperature?: number;
  /** Top-p setting for nucleus sampling */
  top_p?: number;
  /** Top-k setting */
  top_k?: number;
  /** Maximum tokens in responses */
  max_response_output_tokens?: number | 'inf';
}

/**
 * Speech configuration settings
 */
export interface SpeechConfig {
  /** Voice ID for audio responses */
  voice: string;
  /** Format of audio output */
  output_audio_format: string;
  /** Emotion for the voice */
  emotion?: string;
  /** Speed ratio (1-100) */
  speed_ratio?: number;
  /** Pitch ratio (1-100) */
  pitch_ratio?: number;
  /** Volume ratio (1-100) */
  volume_ratio?: number;
}

/**
 * Hearing configuration settings
 */
export interface HearingConfig {
  /** Format of audio input */
  input_audio_format: string;
  /** Audio provider */
  provider?: 'aliyun' | 'bytedance' | 'baidu' | 'qcloud' | 'jdcloud' | 'bytedance_streaming' | 'aliyun_streaming';
  /** Silence detector configuration */
  silence_detector?: any;
  /** Settings for conversation turn detection */
  turn_detection: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
  /** Voiceprint configuration */
  turn_voiceprint?: {
    use: boolean;
    type: 'group' | 'single';
    group_id?: string;
    profile_id?: string;
    threshold?: number;
  } | null;
}

/**
 * Vision configuration settings
 */
export interface VisionConfig {
  /** Enable face detection */
  enable_face_detection?: boolean;
  /** Enable object detection */
  enable_object_detection?: boolean;
  /** Enable face identification */
  enable_face_identification?: boolean;
  /** Target classes for object detection */
  object_detection_target_classes?: string[];
}

/**
 * Knowledge configuration settings
 */
export interface KnowledgeConfig {
  /** Available scripts for conversation */
  scripts?: Array<{
    id: string;
    name: string;
    description: string;
    priority: number;
    tags: string[];
    dialogues: any[];
  }>;
  /** Memory configuration */
  memories?: {
    enable: boolean;
  };
}

/**
 * Script configuration for predefined dialogues
 */
export interface ScriptConfig {
  /** Unique identifier */
  id: string;
  /** Script name */
  name: string;
  /** Script description */
  description: string;
  /** Priority level */
  priority?: number;
  /** Categorization tags */
  tags: string[];
  /** Predefined dialogues */
  dialogues: Dialogue[];
}

/**
 * Dialogue structure for scripted responses
 */
export interface Dialogue {
  /** Unique identifier */
  id: string;
  /** Input prompts that trigger this dialogue */
  prompts: string[];
  /** Possible responses */
  responses: DialogueResponse[];
}

/**
 * Response types in dialogues
 */
export type DialogueResponse = MessageResponse | FunctionResponse;

/**
 * Message response in dialogues
 */
export interface MessageResponse {
  /** Unique identifier */
  id: string;
  /** Response type */
  type: 'message';
  /** Message content */
  message: string;
}

/**
 * Function response in dialogues
 */
export interface FunctionResponse {
  /** Unique identifier */
  id: string;
  /** Response type */
  type: 'function';
  /** Function to execute */
  function: string;
}

/**
 * Complete configuration
 */
export interface RealtimeConfig {
  /** Agent ID for server-side configuration */
  agent_id?: string;
  /** Model configuration */
  model?: ModelConfig;
  /** Speech configuration */
  speech?: SpeechConfig;
  /** Hearing configuration */
  hearing?: HearingConfig;
  /** Vision configuration */
  vision?: VisionConfig;
  /** Knowledge configuration */
  knowledge?: KnowledgeConfig;
} 