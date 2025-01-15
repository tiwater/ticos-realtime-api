import { RealtimeEventHandler } from './event-handler';
import { RealtimeAPI } from './api';
import { RealtimeConversation } from './conversation';
import type { BaseConfig, ClientOptions, ToolDefinition } from './types/client';  
import type { ItemType, Content } from './types/conversation';
import { RealtimeUtils } from './utils';

/**
 * Event interface for conversation updates.
 */
interface ConversationUpdateEvent {
  item: ItemType;
  delta: any;
}

/**
 * High-level client for the Realtime API that manages conversations and tools.
 * Provides an interface for connecting to the API, managing conversations,
 * and handling tool registrations and executions.
 */
export class RealtimeClient extends RealtimeEventHandler {
  protected config: BaseConfig;
  protected realtime: RealtimeAPI;
  protected conversation: RealtimeConversation;
  protected tools: Record<string, { definition: ToolDefinition; handler: Function }> = {};
  protected inputAudioBuffer: Int16Array = new Int16Array(0);

  /**
   * Creates a new RealtimeClient instance.
   * 
   * @param {ClientOptions} settings - Configuration settings for the client
   * @param {BaseConfig} config - Configuration instance
   */
  constructor(settings: ClientOptions = { url: 'wss://api.ticos.ai/v1/realtime', apiKey: '' }, config: BaseConfig) {
    super();
    this.config = config;
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
      const payload = this.getSessionPayload();
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
    this.tools = {};
    this.config.reset();
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

  protected getSessionPayload(): { session: any } {
    return this.config.getSessionPayload();
  }

  public updateConfig(updates: any): void {
    this.config.updateConfig(updates);
    this.updateSession();
  }

  /**
   * Sends user message content and generates a response
   * @param {Array<Content>} content - Array of content to send (text, audio, etc.)
   * @returns {boolean} Always returns true
   */
  public sendUserMessageContent(content: Content[] = []): boolean {
    if (content.length) {
      for (const c of content) {
        if (c.type === 'audio' && typeof c.audio !== 'string') {
          c.audio = RealtimeUtils.arrayBufferToBase64(c.audio);
        }
      }
      this.realtime.send('conversation.item.create', {
        item: {
          type: 'message',
          role: 'user',
          content,
        },
      });
    }
    this.createResponse();
    return true;
  }

  /**
   * Appends user audio to the existing audio buffer
   * @param {Int16Array | ArrayBuffer} arrayBuffer - Audio data to append
   * @returns {boolean} Always returns true
   */
  public appendInputAudio(arrayBuffer: Int16Array | ArrayBuffer): boolean {
    if (arrayBuffer.byteLength > 0) {
      this.realtime.send('input_audio_buffer.append', {
        audio: RealtimeUtils.arrayBufferToBase64(arrayBuffer),
      });
      this.inputAudioBuffer = RealtimeUtils.mergeInt16Arrays(
        this.inputAudioBuffer,
        arrayBuffer,
      );
    }
    return true;
  }

  /**
   * Forces a model response generation
   * @returns {boolean} Always returns true
   */
  public createResponse(): boolean {
    if (
      this.config.getTurnDetectionType() === null &&
      this.inputAudioBuffer.byteLength > 0
    ) {
      this.realtime.send('input_audio_buffer.commit');
      this.conversation.queueInputAudio(this.inputAudioBuffer);
      this.inputAudioBuffer = new Int16Array(0);
    }
    this.realtime.send('response.create');
    return true;
  }

  /**
   * Cancels the ongoing server generation and truncates ongoing generation, if applicable
   * If no id provided, will simply call `cancel_generation` command
   * @param {string} id - The id of the message to cancel
   * @param {number} [sampleCount=0] - The number of samples to truncate past for the ongoing generation
   * @returns {{ item: ItemType | null }} The canceled item or null
   */
  public cancelResponse(id: string, sampleCount: number = 0): { item: ItemType | null } {
    if (!id) {
      this.realtime.send('response.cancel');
      return { item: null };
    } else {
      const item = this.getConversationItem(id);
      if (!item) {
        throw new Error(`Could not find item "${id}"`);
      }
      if (item.type !== 'message') {
        throw new Error(`Can only cancelResponse messages with type "message"`);
      } else if (item.role !== 'assistant') {
        throw new Error(`Can only cancelResponse messages with role "assistant"`);
      }
      this.realtime.send('response.cancel');
      const audioIndex = item.content.findIndex((c) => c.type === 'audio');
      if (audioIndex === -1) {
        throw new Error(`Could not find audio on item to cancel`);
      }
      this.realtime.send('conversation.item.truncate', {
        item_id: id,
        content_index: audioIndex,
        audio_end_ms: Math.floor(
          (sampleCount / this.conversation.defaultFrequency) * 1000,
        ),
      });
      return { item };
    }
  }

  /**
   * Gets an item from the conversation by ID
   * @private
   * @param {string} id - Item ID to find
   * @returns {ItemType | undefined} The found item or undefined
   */
  private getConversationItem(id: string): ItemType | undefined {
    return this.conversation.getItems().find(item => item.id === id);
  }
} 