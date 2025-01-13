import { RealtimeEventHandler } from './event-handler';
import { RealtimeAPI } from './api';
import { RealtimeConversation } from './conversation';
import type { ItemType, ToolDefinitionType } from './types';
import { ConfigManager } from './config/base';

export interface RealtimeClientSettings {
  url?: string;
  apiKey?: string;
  dangerouslyAllowAPIKeyInBrowser?: boolean;
  debug?: boolean;
}

interface ConversationUpdateEvent {
  item: ItemType;
  delta: any;
}

export class RealtimeClient extends RealtimeEventHandler {
  protected configManager!: ConfigManager;
  protected realtime: RealtimeAPI;
  protected conversation: RealtimeConversation;
  protected tools: Record<string, { definition: ToolDefinitionType; handler: Function }> = {};

  constructor(settings: RealtimeClientSettings = {}) {
    super();
    this.realtime = new RealtimeAPI(settings);
    this.conversation = new RealtimeConversation();
    this._addAPIEventHandlers();
  }

  private _addAPIEventHandlers(): boolean {
    this.realtime.on('client.*', (event: any) => {
      this.emit('realtime.event', {
        time: new Date().toISOString(),
        source: 'client',
        event: event,
      });
    });

    this.realtime.on('server.*', (event: any) => {
      this.emit('realtime.event', {
        time: new Date().toISOString(),
        source: 'server',
        event: event,
      });
    });

    return true;
  }

  public async connect(): Promise<void> {
    await this.realtime.connect();
  }

  public disconnect(): void {
    this.realtime.disconnect();
  }

  public isConnected(): boolean {
    return this.realtime.isConnected();
  }

  protected updateSession(): void {
    if (this.isConnected()) {
      const payload = this.configManager.getSessionPayload();
      this.realtime.send('session.update', payload);
    }
  }

  public reset(): void {
    this.configManager.reset();
    this.tools = {};
    this.updateSession();
  }

  public registerTool(definition: ToolDefinitionType, handler: Function): void {
    if (!definition.name) {
      throw new Error('Tool definition must have a name');
    }
    this.tools[definition.name] = { definition, handler };
    this.updateSession();
  }

  public unregisterTool(name: string): void {
    delete this.tools[name];
    this.updateSession();
  }

  public async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools[name];
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    try {
      return await tool.handler(args);
    } catch (error) {
      console.error(`Error executing tool "${name}":`, error);
      throw error;
    }
  }

  public async waitForNextItem() {
    const event = await this.waitForNext('conversation.item.appended');
    if (!event) return { item: null };
    return { item: event.item as ItemType };
  }

  public async waitForNextCompletedItem() {
    const event = await this.waitForNext('conversation.item.completed');
    if (!event) return { item: null };
    return { item: event.item as ItemType };
  }
} 