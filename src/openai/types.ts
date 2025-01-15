import type { AudioConfig, ToolDefinition } from '../types/client';

export type OpenaiVoiceType = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";

/**
 * OpenAI-specific tool definition extending the base tool definition
 */
export interface OpenaiToolDefinition extends ToolDefinition {
  /** OpenAI-specific tool properties */
  openai_properties?: Record<string, any>;
}

/**
 * OpenAI configuration options
 */
export interface OpenaiConfig {
  /** Voice for text-to-speech */
  voice: OpenaiVoiceType;
  /** Audio input/output configuration */
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: any | null;
  turn_detection: any | null;
  /** Available tools */
  tools: OpenaiToolDefinition[];
  /** Required system instructions */
  instructions: string;
  /** Tool choice strategy */
  tool_choice: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  /** Temperature for response generation */
  temperature: number;
  /** Maximum tokens in responses */
  max_response_output_tokens: number | 'inf';
} 