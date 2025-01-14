import { RealtimeClient, RealtimeClientSettings } from '../client';
import { TicosConfigManager } from '../config/ticos';
import type { TicosConfigOptions } from '../types/client';

export class TicosRealtimeClient extends RealtimeClient {
  protected configManager: TicosConfigManager;

  constructor(settings: RealtimeClientSettings = {}) {
    super(settings);
    this.configManager = new TicosConfigManager();
  }

  public updateConfig(updates: Partial<TicosConfigOptions>): void {
    this.configManager.updateConfig(updates);
  }
} 