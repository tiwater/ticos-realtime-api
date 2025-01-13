import { BaseConfig, AudioConfig, ConfigManager } from './base';

export interface TicosModelConfig extends BaseConfig {
  provider: string;
  name: string;
}

export interface TicosConfig {
  model: TicosModelConfig;
  speech: Partial<AudioConfig>;
  hearing: Partial<AudioConfig>;
  vision?: {
    enable_face_detection?: boolean;
    enable_object_detection?: boolean;
    enable_face_identification?: boolean;
    object_detection_target_classes?: string[];
  };
}

export class TicosConfigManager extends ConfigManager {
  protected config!: TicosConfig;

  constructor() {
    super();
    this.reset();
  }

  public reset(): void {
    this.config = {
      model: {
        provider: 'tiwater',
        name: 'stardust-2.5-turbo',
        modalities: ['text', 'audio'],
        instructions: '',
        tools: [],
        tool_choice: 'auto',
        temperature: 0.8,
        max_response_output_tokens: 4096,
      },
      speech: {
        voice: 'verse',
        output_audio_format: 'pcm16',
      },
      hearing: {
        input_audio_format: 'pcm16',
        input_audio_transcription: null,
        turn_detection: null,
      }
    };
  }

  public updateConfig(updates: Partial<TicosConfig>): void {
    if (updates.model) {
      this.config.model = {
        ...this.config.model,
        ...updates.model
      };
    }
    if (updates.speech) {
      this.config.speech = {
        ...this.config.speech,
        ...updates.speech
      };
    }
    if (updates.hearing) {
      this.config.hearing = {
        ...this.config.hearing,
        ...updates.hearing
      };
    }
    if (updates.vision) {
      this.config.vision = {
        ...this.config.vision,
        ...updates.vision
      };
    }
  }

  public getSessionPayload(): { session: TicosConfig } {
    return { session: this.config };
  }
} 