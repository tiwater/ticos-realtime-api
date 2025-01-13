import { RealtimeClient, RealtimeClientSettings } from '../client';
import type { TicosConfig } from '../config/ticos';
import { TicosConfigManager } from '../config/ticos';

export class TicosRealtimeClient extends RealtimeClient {
  protected override configManager: TicosConfigManager;

  constructor(settings: RealtimeClientSettings = {}) {
    super(settings);
    this.configManager = new TicosConfigManager();
  }

  public updateConfig(updates: Partial<TicosConfig>): void {
    this.configManager.updateConfig(updates);
    this.updateSession();
  }
} 