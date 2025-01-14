import { BaseConfig, AudioConfig, ConfigManager } from './base';

export interface TicosModelConfig extends BaseConfig {
  provider: string;
  name: string;
}


export type MessageResponse = {
  id: string;
  type: 'message';
  message: string; // The response content, either texts or predefined actions
};

export type FunctionResponse = {
  id: string;
  type: 'function';
  function: string;
};

export type DialogueResponse = MessageResponse | FunctionResponse;

/**
* Represents a mapping between a human's input and the robot's possible responses.
* When a human's question matches the prompt (using vector similarity),
* the robot will use one of the responses as its guided answer.
*/
export type Dialogue = {
  id: string;
  prompts: string[]; // The human's input/question that prompts this response
  responses: DialogueResponse[]; // Array of possible response sequences. Each sequence contains one or more sentences.
};

/**
* A script is a collection of predefined dialogues that guide
* how the robot should respond to specific human inputs.
*/
export type ScriptConfig = {
  id: string;
  name: string;
  description: string;
  priority?: number; // Higher priority scripts take precedence when multiple matches are found
  tags: string[]; // Tags help categorize scripts by topics or scenarios
  dialogues: Dialogue[]; // The dialogues in this script
};

export interface KnowledgeConfig {
  scripts?: ScriptConfig[];
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
  knowledge?: KnowledgeConfig;
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
    if (updates.knowledge) {
      this.config.knowledge = {
        ...this.config.knowledge,
        ...updates.knowledge
      };
    }
  }

  public getSessionPayload(): { session: TicosConfig } {
    return { session: this.config };
  }
} 