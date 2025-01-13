// Common Types
export interface ItemType {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string; audio?: string; transcript?: string }>;
  status: 'completed' | 'in_progress';
  object: string;
}

export interface ToolDefinitionType {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AudioTranscriptionType {
  model: string;
}

export interface TurnDetectionServerVadType {
  type: 'server_vad';
  threshold: number;
  prefix_padding_ms: number;
  silence_duration_ms: number;
}

export interface ResponseResourceType {
  type: string;
  data: any;
}

export type AudioFormatType = "pcm16" | "g711_ulaw" | "g711_alaw"; 