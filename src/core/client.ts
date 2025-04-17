import { RealtimeEventHandler } from './event-handler';
import { RealtimeAPI } from './realtime';
import { RealtimeConversation } from './conversation';
import type { ClientOptions, ToolDefinition, RealtimeConfig } from '../types/client';
import type { ItemType, Content } from '../types/conversation';
import { RealtimeUtils } from '../utils';
import { Event, ItemEvent, RealtimeEvent } from '../types/events';

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
  protected realtime: RealtimeAPI;
  protected conversation: RealtimeConversation;
  protected tools: Record<string, { definition: ToolDefinition; handler: Function }> = {};
  protected inputAudioBuffer: Int16Array = new Int16Array(0);
  protected sessionCreated: boolean = false;
  protected config: RealtimeConfig = {
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
    },
    vision: {
      enable_face_detection: false,
      enable_object_detection: false,
      enable_face_identification: false,
      object_detection_target_classes: [],
    },
    knowledge: {
      scripts: [],
    },
  };
  private _configWithMethods: any;

  /**
   * Creates a new RealtimeClient instance.
   *
   * @param {ClientOptions} [settings] - Configuration settings for the client
   * @param {RealtimeConfig | any} [config] - Optional configuration settings or config object with methods
   */
  constructor(settings?: ClientOptions, config?: Partial<RealtimeConfig> | any) {
    super();
    // Apply default settings if none provided
    const defaultSettings: ClientOptions = {
      url: 'wss://stardust.ticos.cn/realtime',
      apiKey: '',
    };

    // Merge provided settings with defaults
    const mergedSettings = settings ? { ...defaultSettings, ...settings } : defaultSettings;

    this.realtime = new RealtimeAPI(mergedSettings);
    this.conversation = new RealtimeConversation();

    if (config) {
      // Handle config object with getSessionPayload method (API compatibility)
      if (typeof config.getSessionPayload === 'function') {
        // It's a config object with methods, use its payload
        const sessionPayload = config.getSessionPayload().session;
        this.config = sessionPayload || this.config;

        // Store the config object with methods for later use
        this._configWithMethods = config;
      } else {
        // It's a standard config object
        this.updateConfig(config);
      }
    }

    this._addAPIEventHandlers();
  }

  /**
   * Listens for all events and forwards them to realtime.event with proper metadata
   * @private
   */
  private _addAPIEventHandlers(): void {
    const self = this;

    // Add a handler for all client. prefixed events
    // Manually add listener for all event types rather than using wildcards
    this.realtime.on('client.connected', handleClientEvent);
    this.realtime.on('client.disconnected', handleClientEvent);
    this.realtime.on('client.error', handleClientEvent);
    this.realtime.on('client.session.update', handleClientEvent);
    this.realtime.on('client.conversation.item.create', handleClientEvent);
    this.realtime.on('client.response.create', handleClientEvent);
    this.realtime.on('client.response.cancel', handleClientEvent);
    this.realtime.on('client.input_audio_buffer.append', handleClientEvent);
    this.realtime.on('client.input_audio_buffer.commit', handleClientEvent);
    this.realtime.on('client.conversation.item.truncate', handleClientEvent);
    this.realtime.on('client.tool.register', handleClientEvent);
    this.realtime.on('client.tool.response', handleClientEvent);
    this.realtime.on('client.tool.error', handleClientEvent);

    // Add a handler for all server. prefixed events
    // Manually add listener for common event types rather than using wildcards
    this.realtime.on('server.session.created', (event: Event) => {
      handleServerEvent(event);
      this.sessionCreated = true;
    });
    this.realtime.on('server.session.update', handleServerEvent);
    this.realtime.on('server.conversation.created', handleServerEvent);
    this.realtime.on('server.conversation.updated', handleServerEvent);
    this.realtime.on('server.conversation.item.created', handleServerEvent);
    this.realtime.on('server.conversation.item.truncated', handleServerEvent);
    this.realtime.on('server.conversation.item.deleted', handleServerEvent);
    this.realtime.on('server.response.created', handleServerEvent);
    this.realtime.on('server.response.output_item.added', handleServerEvent);
    this.realtime.on('server.response.content_part.added', handleServerEvent);
    this.realtime.on('server.response.text.delta', handleServerEvent);
    this.realtime.on('server.response.audio.delta', handleServerEvent);
    this.realtime.on('server.input_audio_buffer.speech_started', handleServerEvent);
    this.realtime.on('server.input_audio_buffer.speech_stopped', handleServerEvent);
    this.realtime.on('server.tool.call', handleServerEvent);

    function handleClientEvent(event: Event) {
      const realtimeEvent = {
        time: new Date().toISOString(),
        source: 'client',
        event: event,
        type: 'realtime.event',
      };
      self.dispatch('realtime.event', realtimeEvent);
    }

    function handleServerEvent(event: Event) {
      const realtimeEvent = {
        time: new Date().toISOString(),
        source: 'server',
        event: event,
        type: 'realtime.event',
      };
      self.dispatch('realtime.event', realtimeEvent);
    }
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
      this.realtime.send('session.update', { session: this.config });
    }
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
    this.realtime.registerTool(definition.name, definition);
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
    if (this.tools[name]) {
      delete this.tools[name];
      // Update session to reflect tool removal
      this.updateSession();
    }
  }

  /**
   * Executes a registered tool with the provided arguments.
   *
   * @param {string} name - Name of the tool to execute
   * @param {Record<string, any>} args - Arguments to pass to the tool
   * @returns {Promise<any>} Result of the tool execution
   * @throws {Error} If the tool is not registered
   *
   * @example
   * ```typescript
   * const result = await client.executeTool('calculate', { expression: '2 + 2' });
   * console.log(result); // 4
   * ```
   */
  public async executeTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.tools[name]) {
      throw new Error(`Tool "${name}" is not registered`);
    }

    try {
      const result = await this.tools[name].handler(args);
      return result;
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
  public async waitForNextItem(): Promise<{ item: ItemType | null }> {
    const event = await this.waitForNext<ItemEvent>('conversation.item.appended');
    if (!event) return { item: null };
    return { item: event.item };
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
  public async waitForNextCompletedItem(): Promise<{ item: ItemType | null }> {
    const event = await this.waitForNext<ItemEvent>('conversation.item.completed');
    if (!event) return { item: null };
    return { item: event.item };
  }

  protected getSessionPayload(): { session: RealtimeConfig } {
    return {
      session: { ...this.config },
    };
  }

  /**
   * Updates the configuration with the provided partial config
   * @param {Partial<RealtimeConfig>} updates - Configuration updates to apply
   */
  public updateConfig(updates: Partial<RealtimeConfig>): void {
    if (updates.model) {
      this.config.model = {
        ...this.config.model,
        ...updates.model,
      };
    }
    if (updates.speech) {
      this.config.speech = {
        ...this.config.speech,
        ...updates.speech,
      };
    }
    if (updates.hearing) {
      this.config.hearing = {
        ...this.config.hearing,
        ...updates.hearing,
      };
    }
    if (updates.vision) {
      this.config.vision = {
        ...this.config.vision,
        ...updates.vision,
      };
    }
    if (updates.knowledge) {
      this.config.knowledge = {
        ...this.config.knowledge,
        ...updates.knowledge,
      };
    }
    this.updateSession();
  }

  /**
   * Adds a tool to the configuration
   * @param {ToolDefinition} tool - Tool definition to add
   */
  public addTool(tool: ToolDefinition): void {
    this.config.model.tools = [...(this.config.model?.tools || []), tool];
    this.updateSession();
  }

  /**
   * Removes a tool from the configuration
   * @param {string} name - Name of the tool to remove
   */
  public removeTool(name: string): void {
    this.config.model.tools =
      this.config.model?.tools?.filter((tool: ToolDefinition) => tool.name !== name) || [];
    this.updateSession();
  }

  /**
   * Gets all registered tools
   * @returns {ToolDefinition[]} Array of tool definitions
   */
  public getTools(): ToolDefinition[] {
    return [...(this.config.model?.tools || [])];
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
      },
      vision: {
        enable_face_detection: false,
        enable_object_detection: false,
        enable_face_identification: false,
        object_detection_target_classes: [],
      },
      knowledge: {
        scripts: [],
      },
    };
    this.updateSession();
  }

  /**
   * Gets the turn detection type from config
   * @returns {string | null} Turn detection type or null
   */
  public getTurnDetectionType(): string | null {
    // Check for config with methods first
    if (
      this._configWithMethods &&
      typeof this._configWithMethods.getTurnDetectionType === 'function'
    ) {
      return this._configWithMethods.getTurnDetectionType();
    }

    // Otherwise use the config object
    return this.config.hearing?.turn_detection || null;
  }

  /**
   * Send user message content to the realtime service
   * @param {Content[]} content - Content for the message
   * @returns {boolean} True if message was sent successfully
   */
  public sendUserMessageContent(content: Content[]): boolean {
    if (content.length) {
      const normalizedContent: Content[] = content.map((c: any) => {
        const contentCopy = { ...c };

        // Convert input_text to text
        if (contentCopy.type === 'input_text' && 'input_text' in contentCopy) {
          return {
            type: 'text' as const,
            text: contentCopy.input_text,
          };
        }

        // Convert input_audio to audio
        if (contentCopy.type === 'input_audio' && 'input_audio' in contentCopy) {
          const audioContent = contentCopy.input_audio;
          return {
            type: 'audio' as const,
            audio:
              typeof audioContent === 'string'
                ? audioContent
                : RealtimeUtils.arrayBufferToBase64(audioContent),
          };
        }

        // Handle base64 conversion for audio content if needed
        if (contentCopy.type === 'audio' && 'audio' in contentCopy) {
          if (contentCopy.audio instanceof ArrayBuffer || ArrayBuffer.isView(contentCopy.audio)) {
            contentCopy.audio = RealtimeUtils.arrayBufferToBase64(contentCopy.audio);
          }
        }

        return contentCopy;
      });

      // Send the message to the realtime service
      this.realtime.send('conversation.item.create', {
        item: {
          type: 'message',
          role: 'user',
          content: normalizedContent,
        },
      });

      this.createResponse();
    }

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
      this.inputAudioBuffer = RealtimeUtils.mergeInt16Arrays(this.inputAudioBuffer, arrayBuffer);
    }
    return true;
  }

  /**
   * Forces a model response generation
   * @returns {boolean} Always returns true
   */
  public createResponse(): boolean {
    if (this.config.hearing.turn_detection === null && this.inputAudioBuffer.byteLength > 0) {
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
        audio_end_ms: Math.floor((sampleCount / this.conversation.defaultFrequency) * 1000),
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
    return this.conversation.getItems().find((item) => item.id === id);
  }
}
