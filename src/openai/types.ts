import type { BaseConfig, AudioConfig } from '../config/base';
import type { ToolDefinition, AudioTranscriptionType, TurnDetectionServerVadType } from '../types/client';

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
export interface OpenaiConfig extends BaseConfig, AudioConfig {
  voice: OpenaiVoiceType;
  input_audio_transcription: AudioTranscriptionType | null;
  turn_detection: TurnDetectionServerVadType | null;
  tools: OpenaiToolDefinition[];
} 