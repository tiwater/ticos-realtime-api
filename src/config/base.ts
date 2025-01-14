/**
 * Base configuration interface for all Realtime API clients.
 * Defines the common configuration properties shared across different implementations.
 * 
 * @interface BaseConfig
 * @property {string[]} modalities - List of supported interaction modalities (e.g., ['text', 'audio']).
 * @property {string} instructions - System instructions or prompts for the model.
 * @property {any[]} tools - Array of tool configurations that the model can use.
 * @property {'auto' | 'none' | 'required' | { type: 'function'; name: string }} tool_choice - Tool selection strategy.
 * @property {number} temperature - Sampling temperature for model responses (0.0 to 1.0).
 * @property {number | 'inf'} max_response_output_tokens - Maximum tokens in model responses ('inf' for unlimited).
 */
export interface BaseConfig {
  modalities: string[];
  instructions: string;
  tools: any[];
  tool_choice: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  temperature: number;
  max_response_output_tokens: number | 'inf';
}

/**
 * Configuration interface for audio-related features.
 * Defines settings specific to audio input and output handling.
 * 
 * @interface AudioConfig
 * @property {string} voice - Voice ID to use for audio responses.
 * @property {string} input_audio_format - Format of the audio input (e.g., 'pcm16', 'mp3').
 * @property {string} output_audio_format - Format of the audio output (e.g., 'pcm16', 'mp3').
 * @property {any | null} input_audio_transcription - Configuration for audio input transcription.
 * @property {any | null} turn_detection - Settings for conversation turn detection in audio.
 */
export interface AudioConfig {
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: any | null;
  turn_detection: any | null;
}

/**
 * Abstract base class for configuration management.
 * Provides a common interface for managing configuration across different implementations.
 * 
 * @abstract
 * @class ConfigManager
 * 
 * @example
 * ```typescript
 * class MyConfigManager extends ConfigManager {
 *   // Implement abstract methods
 *   updateConfig(updates: Partial<MyConfig>) { ... }
 *   getSessionPayload() { ... }
 *   reset() { ... }
 * }
 * ```
 */
export abstract class ConfigManager {
  /** Current configuration state. Type is specified by implementing classes. */
  protected config!: any;
  
  /**
   * Updates the current configuration with new values.
   * @abstract
   * @param {Partial<any>} updates - Partial configuration object with values to update
   */
  abstract updateConfig(updates: Partial<any>): void;

  /**
   * Retrieves the configuration formatted as a session payload.
   * @abstract
   * @returns {any} Configuration wrapped in an appropriate format for API communication
   */
  abstract getSessionPayload(): any;

  /**
   * Resets the configuration to default values.
   * @abstract
   */
  abstract reset(): void;
} 