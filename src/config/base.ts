export interface BaseConfig {
  modalities: string[];
  instructions: string;
  tools: any[];
  tool_choice: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  temperature: number;
  max_response_output_tokens: number | 'inf';
}

export interface AudioConfig {
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: any | null;
  turn_detection: any | null;
}

export abstract class ConfigManager {
  protected config!: any;
  
  abstract updateConfig(updates: Partial<any>): void;
  abstract getSessionPayload(): any;
  abstract reset(): void;
} 