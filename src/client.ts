import { RealtimeEventHandler } from './event-handler';
import { RealtimeAPI } from './api';
import { RealtimeConversation } from './conversation';
import type { ItemType, ToolDefinition } from './types';
import { ConfigManager } from './config/base';

/**
 * Configuration settings for initializing the Realtime Client.
 * 
 * @interface RealtimeClientSettings
 * @property {string} [url] - WebSocket endpoint URL. Defaults to the API's default URL.
 * @property {string} [apiKey] - API key for authentication. Required for non-browser environments.
 * @property {boolean} [dangerouslyAllowAPIKeyInBrowser] - Whether to allow API key usage in browser (not recommended).
 * @property {boolean} [debug] - Enable debug logging of WebSocket communication.
 */
export interface RealtimeClientSettings {
  url?: string;
  apiKey?: string;
  dangerouslyAllowAPIKeyInBrowser?: boolean;
  debug?: boolean;
}

/**
 * Event interface for conversation updates.
 * 
 * @interface ConversationUpdateEvent
 * @property {ItemType} item - The conversation item being updated
 * @property {any} delta - The changes made to the item
 */
interface ConversationUpdateEvent {
  item: ItemType;
  delta: any;
}

/**
 * High-level client for the Realtime API that manages conversations and tools.
 * Provides an interface for connecting to the API, managing conversations,
 * and handling tool registrations and executions.
 * 
 * @extends {RealtimeEventHandler}
 * 
 * @example
 * ```typescript
 * const client = new RealtimeClient({
 *   apiKey: 'your-api-key',
 *   debug: true
 * });
 * 
 * await client.connect();
 * client.registerTool({
 *   name: 'greet',
 *   description: 'Greets a person'
 * }, (args) => `Hello, ${args.name}!`);
 * ```
 */
export class RealtimeClient extends RealtimeEventHandler {
  /** Configuration manager instance */
  protected configManager!: ConfigManager;
  /** Low-level API client instance */
  protected realtime: RealtimeAPI;
  /** Conversation manager instance */
  protected conversation: RealtimeConversation;
  /** Map of registered tools and their handlers */
  protected tools: Record<string, { definition: ToolDefinition; handler: Function }> = {};

  /**
   * Creates a new RealtimeClient instance.
   * 
   * @param {RealtimeClientSettings} settings - Configuration settings for the client
   */
  constructor(settings: RealtimeClientSettings = {}) {
    super();
    this.realtime = new RealtimeAPI(settings);
    this.conversation = new RealtimeConversation();
    this._addAPIEventHandlers();
  }

  /**
   * Sets up event handlers for the API client.
   * Forwards all events to the client's event system with additional metadata.
   * 
   * @private
   * @returns {boolean} Always returns true
   */
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

  /**
   * Establishes a connection to the Realtime API server.
   * 
   * @returns {Promise<void>} Resolves when the connection is established
   * 
   * @example
   * ```typescript
   * await client.connect();
   * ```
   */
  public async connect(): Promise<void> {
    await this.realtime.connect();
  }

  /**
   * Closes the connection to the Realtime API server.
   * 
   * @example
   * ```typescript
   * client.disconnect();
   * ```
   */
  public disconnect(): void {
    this.realtime.disconnect();
  }

  /**
   * Checks if the client is currently connected to the server.
   * 
   * @returns {boolean} True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.realtime.isConnected();
  }

  /**
   * Updates the session configuration on the server.
   * Called internally when configuration or tools change.
   * 
   * @protected
   */
  protected updateSession(): void {
    if (this.isConnected()) {
      const payload = this.configManager.getSessionPayload();
      this.realtime.send('session.update', payload);
    }
  }

  /**
   * Resets the client to its initial state.
   * Clears all configuration and registered tools.
   * 
   * @example
   * ```typescript
   * client.reset();
   * ```
   */
  public reset(): void {
    this.configManager.reset();
    this.tools = {};
    this.updateSession();
  }

  /**
   * Returns the current conversation items.
   * 
   * @returns {ItemType[]} The current conversation items
   */
  public getConversationItems(): ItemType[] {
    return this.conversation.getItems();
  }

  /**
   * Registers a new tool that can be used during conversations.
   * 
   * @param {ToolDefinition} definition - Tool definition including name and description
   * @param {Function} handler - Function to execute when the tool is called
   * @throws {Error} If the tool definition doesn't have a name
   * 
   * @example
   * ```typescript
   * client.registerTool({
   *   name: 'calculate',
   *   description: 'Performs a calculation'
   * }, (args) => eval(args.expression));
   * ```
   */
  public registerTool(definition: ToolDefinition, handler: Function): void {
    if (!definition.name) {
      throw new Error('Tool definition must have a name');
    }
    this.tools[definition.name] = { definition, handler };
    this.updateSession();
  }

  /**
   * Removes a registered tool.
   * 
   * @param {string} name - Name of the tool to unregister
   * 
   * @example
   * ```typescript
   * client.unregisterTool('calculate');
   * ```
   */
  public unregisterTool(name: string): void {
    delete this.tools[name];
    this.updateSession();
  }

  /**
   * Executes a registered tool with the provided arguments.
   * 
   * @param {string} name - Name of the tool to execute
   * @param {Record<string, any>} args - Arguments to pass to the tool
   * @returns {Promise<any>} Result of the tool execution
   * @throws {Error} If the tool is not found or execution fails
   * 
   * @example
   * ```typescript
   * const result = await client.executeTool('calculate', { expression: '2 + 2' });
   * console.log(result); // 4
   * ```
   */
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

  /**
   * Waits for the next item to be added to the conversation.
   * 
   * @returns {Promise<{ item: ItemType | null }>} The next conversation item or null
   * 
   * @example
   * ```typescript
   * const { item } = await client.waitForNextItem();
   * if (item) {
   *   console.log('New item:', item);
   * }
   * ```
   */
  public async waitForNextItem() {
    const event = await this.waitForNext('conversation.item.appended');
    if (!event) return { item: null };
    return { item: event.item as ItemType };
  }

  /**
   * Waits for the next item to be completed in the conversation.
   * 
   * @returns {Promise<{ item: ItemType | null }>} The completed conversation item or null
   * 
   * @example
   * ```typescript
   * const { item } = await client.waitForNextCompletedItem();
   * if (item) {
   *   console.log('Completed item:', item);
   * }
   * ```
   */
  public async waitForNextCompletedItem() {
    const event = await this.waitForNext('conversation.item.completed');
    if (!event) return { item: null };
    return { item: event.item as ItemType };
  }
} 