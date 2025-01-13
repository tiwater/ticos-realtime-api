import { RealtimeClient, RealtimeClientSettings } from '../client';
import type { OpenAIConfig } from '../config/openai';
import { OpenAIConfigManager } from '../config/openai';

export class OpenAIRealtimeClient extends RealtimeClient {
  protected override configManager: OpenAIConfigManager;

  constructor(settings: RealtimeClientSettings = {}) {
    super(settings);
    this.configManager = new OpenAIConfigManager();
  }

  public updateConfig(updates: Partial<OpenAIConfig>): void {
    this.configManager.updateConfig(updates);
    this.updateSession();
  }
} 