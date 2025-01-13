import { ConfigManager } from './base';

export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
  dangerouslyAllowAPIKeyInBrowser?: boolean;
  modalities?: string[];
  instructions?: string;
  voice?: string;
  input_audio_format?: string;
  output_audio_format?: string;
  input_audio_transcription?: string | null;
  turn_detection?: any;
  tools?: any[];
  tool_choice?: string;
  temperature?: number;
  max_response_output_tokens?: number;
}

export class OpenAIConfigManager extends ConfigManager {
  declare config: OpenAIConfig;

  constructor() {
    super();
    this.reset();
  }

  public reset(): void {
    this.config = {
      modalities: ['text', 'audio'],
      instructions: '',
      voice: 'verse',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: null,
      turn_detection: null,
      tools: [],
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096,
    };
  }

  public updateConfig(updates: Partial<OpenAIConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
  }

  public getSessionPayload(): { session: OpenAIConfig } {
    return { session: this.config };
  }
} 