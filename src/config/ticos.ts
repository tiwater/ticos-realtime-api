import { ClientOptions, ToolDefinition, RealtimeConfig, BaseConfig } from '../types/client';

/**
 * Configuration for Ticos Realtime API
 */
export class TicosConfig implements BaseConfig {
  private config: RealtimeConfig = {
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
    },
    vision: {
      enable_face_detection: false,
      enable_object_detection: false,
      enable_face_identification: false,
      object_detection_target_classes: [],
    },
    knowledge: {
      scripts: [],
    }
  };

  private settings: ClientOptions = {
    url: 'wss://api.ticos.ai/v1/realtime',
    apiKey: '',
  };

  public updateSettings(settings: Partial<ClientOptions>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  public getSettings(): ClientOptions {
    return { ...this.settings };
  }

  public updateConfig(updates: Partial<RealtimeConfig>): void {
    if (updates.model) {
      this.config.model = {
        ...this.config.model,
        ...updates.model,
      };
    }
    if (updates.speech) {
      this.config.speech = {
        ...this.config.speech,
        ...updates.speech,
      };
    }
    if (updates.hearing) {
      this.config.hearing = {
        ...this.config.hearing,
        ...updates.hearing,
      };
    }
    if (updates.vision) {
      this.config.vision = {
        ...this.config.vision,
        ...updates.vision,
      };
    }
    if (updates.knowledge) {
      this.config.knowledge = {
        ...this.config.knowledge,
        ...updates.knowledge,
      };
    }
  }

  public addTool(tool: ToolDefinition): void {
    this.config.model.tools.push(tool);
  }

  public removeTool(name: string): void {
    this.config.model.tools = this.config.model.tools.filter((tool: ToolDefinition) => tool.name !== name);
  }

  public getTools(): ToolDefinition[] {
    return [...this.config.model.tools];
  }

  public getSessionPayload(): { session: RealtimeConfig } {
    return {
      session: { ...this.config },
    };
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
      },
      vision: {
        enable_face_detection: false,
        enable_object_detection: false,
        enable_face_identification: false,
        object_detection_target_classes: [],
      },
      knowledge: {
        scripts: [],
      }
    };

    this.settings = {
      url: 'wss://api.ticos.ai/v1/realtime',
      apiKey: '',
    };
  }
} 