import type { OpenaiConfig } from '../openai/types';
import type { BaseConfig } from '../types/client';

/**
 * Configuration for OpenAI Realtime API
 */
export class OpenAIConfig implements BaseConfig {
  private config: OpenaiConfig = {
    instructions: '',
    tools: [],
    tool_choice: 'auto',
    temperature: 0.8,
    max_response_output_tokens: 4096,
    voice: 'alloy',
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    input_audio_transcription: null,
    turn_detection: null,
  };

  public updateConfig(updates: Partial<OpenaiConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  public getSessionPayload(): { session: OpenaiConfig } {
    return {
      session: { ...this.config },
    };
  }

  public reset(): void {
    this.config = {
      instructions: '',
      tools: [],
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096,
      voice: 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: null,
      turn_detection: null,
    };
  }

  public getTurnDetectionType(): string | null {
    return this.config.turn_detection || null;
  }
} 