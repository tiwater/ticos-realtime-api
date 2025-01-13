import type { BaseConfig, AudioConfig } from '../config/base';
import type { AudioTranscriptionType, TurnDetectionServerVadType, ToolDefinitionType } from '../types';

export type OpenaiVoiceType = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";

export interface OpenaiToolDefinitionType extends ToolDefinitionType {
  type: 'function';
}

export interface OpenAIConfig extends BaseConfig, AudioConfig {
  voice: OpenaiVoiceType;
  input_audio_transcription: AudioTranscriptionType | null;
  turn_detection: TurnDetectionServerVadType | null;
  tools: OpenaiToolDefinitionType[];
} 