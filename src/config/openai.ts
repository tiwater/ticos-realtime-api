import { ConfigManager } from './base';

/**
 * Configuration interface for the OpenAI Realtime API client.
 * @interface OpenAIConfig
 * 
 * @property {string} [apiKey] - OpenAI API key for authentication. Required for non-browser environments.
 * @property {string} [model] - The OpenAI model to use (e.g., 'gpt-4o-realtime-preview-2024-10-01').
 * @property {boolean} [dangerouslyAllowAPIKeyInBrowser] - Whether to allow API key usage in browser environments (not recommended).
 * @property {string[]} [modalities] - Supported interaction modalities (e.g., ['text', 'audio']).
 * @property {string} [instructions] - System instructions for the model.
 * @property {string} [voice] - Voice ID for audio responses (e.g., 'verse').
 * @property {string} [input_audio_format] - Format for audio input (e.g., 'pcm16').
 * @property {string} [output_audio_format] - Format for audio output (e.g., 'pcm16').
 * @property {string | null} [input_audio_transcription] - Transcription settings for audio input.
 * @property {any} [turn_detection] - Configuration for turn-based conversation detection.
 * @property {any[]} [tools] - Array of tool configurations available to the model.
 * @property {string} [tool_choice] - Strategy for tool selection ('auto' | 'none' | specific tool).
 * @property {number} [temperature] - Sampling temperature for model responses (0.0 to 1.0).
 * @property {number} [max_response_output_tokens] - Maximum number of tokens in model responses.
 */
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

/**
 * Manages configuration settings for the OpenAI Realtime API client.
 * Extends the base ConfigManager to provide OpenAI-specific configuration management.
 * 
 * @example
 * ```typescript
 * const config = new OpenAIConfigManager();
 * config.updateConfig({
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4o-realtime-preview-2024-10-01',
 *   temperature: 0.7
 * });
 * ```
 */
export class OpenAIConfigManager extends ConfigManager {
  /** Current configuration state */
  declare config: OpenAIConfig;

  /**
   * Creates a new OpenAIConfigManager instance with default settings.
   * Initializes the configuration with sensible defaults for realtime interactions.
   */
  constructor() {
    super();
    this.reset();
  }

  /**
   * Resets the configuration to default values.
   * This method is useful when you need to start fresh with default settings.
   * 
   * @example
   * ```typescript
   * config.reset(); // Resets all settings to defaults
   * ```
   */
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

  /**
   * Updates the current configuration with new values.
   * Merges the provided updates with the existing configuration.
   * 
   * @param {Partial<OpenAIConfig>} updates - Partial configuration object containing only the values to update
   * 
   * @example
   * ```typescript
   * config.updateConfig({
   *   temperature: 0.9,
   *   max_response_output_tokens: 2048
   * });
   * ```
   */
  public updateConfig(updates: Partial<OpenAIConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
  }

  /**
   * Retrieves the current configuration formatted as a session payload.
   * Used internally by the client to send configuration to the API.
   * 
   * @returns {{ session: OpenAIConfig }} Configuration wrapped in a session object
   * 
   * @example
   * ```typescript
   * const payload = config.getSessionPayload();
   * // { session: { temperature: 0.8, ... } }
   * ```
   */
  public getSessionPayload(): { session: OpenAIConfig } {
    return { session: this.config };
  }
} 