import { RealtimeClientSettings, ToolDefinition, TicosConfigOptions, AudioConfig, TicosModelConfig } from '../types';
import { BaseConfig, ConfigManager } from './base';

/**
 * Configuration manager for Ticos Realtime API
 */
export class TicosConfig implements BaseConfig {
  protected config: TicosConfigOptions = {
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

  private settings: RealtimeClientSettings = {
    url: 'wss://api.ticos.ai/v1/realtime',
    apiKey: '',
  };

  // BaseConfig implementation
  public get modalities(): string[] {
    return this.config.model.modalities;
  }

  public get instructions(): string {
    return this.config.model.instructions;
  }

  public get tools(): ToolDefinition[] {
    return this.config.model.tools;
  }

  public get tool_choice(): 'auto' | 'none' | 'required' | { type: 'function'; name: string } {
    return this.config.model.tool_choice;
  }

  public get temperature(): number {
    return this.config.model.temperature;
  }

  public get max_response_output_tokens(): number | 'inf' {
    return this.config.model.max_response_output_tokens;
  }

  /**
   * Updates the client settings
   */
  public updateSettings(settings: Partial<RealtimeClientSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  /**
   * Gets the current client settings
   */
  public getSettings(): RealtimeClientSettings {
    return { ...this.settings };
  }

  /**
   * Updates the model configuration
   */
  public updateModelConfig(updates: Partial<TicosModelConfig>): void {
    this.config.model = {
      ...this.config.model,
      ...updates,
    };
  }

  /**
   * Updates the speech configuration
   */
  public updateSpeechConfig(updates: Partial<AudioConfig>): void {
    this.config.speech = {
      ...this.config.speech,
      ...updates,
    };
  }

  /**
   * Updates the hearing configuration
   */
  public updateHearingConfig(updates: Partial<AudioConfig>): void {
    this.config.hearing = {
      ...this.config.hearing,
      ...updates,
    };
  }

  /**
   * Updates the vision configuration
   */
  public updateVisionConfig(updates: Partial<TicosConfigOptions['vision']>): void {
    this.config.vision = {
      ...this.config.vision,
      ...updates,
    };
  }

  /**
   * Updates the knowledge configuration
   */
  public updateKnowledgeConfig(updates: Partial<TicosConfigOptions['knowledge']>): void {
    this.config.knowledge = {
      ...this.config.knowledge,
      ...updates,
    };
  }

  /**
   * Adds a tool to the configuration
   */
  public addTool(tool: ToolDefinition): void {
    this.config.model.tools.push(tool);
  }

  /**
   * Removes a tool from the configuration
   */
  public removeTool(name: string): void {
    this.config.model.tools = this.config.model.tools.filter(tool => tool.name !== name);
  }

  /**
   * Gets all registered tools
   */
  public getTools(): ToolDefinition[] {
    return [...this.config.model.tools];
  }

  /**
   * Gets the session payload for WebSocket communication
   */
  public getSessionPayload(): { session: TicosConfigOptions } {
    return {
      session: { ...this.config },
    };
  }

  /**
   * Resets the configuration to default values
   */
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

    this.settings = {
      url: 'wss://api.ticos.ai/v1/realtime',
      apiKey: '',
    };
  }
}

export class TicosConfigManager extends ConfigManager {
  protected config: TicosConfig;

  constructor() {
    super();
    this.config = new TicosConfig();
  }

  public updateConfig(updates: Partial<TicosConfigOptions>): void {
    if (updates.model) {
      this.config.updateModelConfig(updates.model);
    }
    if (updates.speech) {
      this.config.updateSpeechConfig(updates.speech);
    }
    if (updates.hearing) {
      this.config.updateHearingConfig(updates.hearing);
    }
    if (updates.vision) {
      this.config.updateVisionConfig(updates.vision);
    }
    if (updates.knowledge) {
      this.config.updateKnowledgeConfig(updates.knowledge);
    }
  }

  public getSessionPayload(): { session: TicosConfigOptions } {
    return this.config.getSessionPayload();
  }

  public reset(): void {
    this.config.reset();
  }
} 