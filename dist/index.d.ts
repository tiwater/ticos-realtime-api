import { WebSocket as WebSocket$1 } from 'ws';

/**
 * Configuration options for the RealtimeClient
 */
interface RealtimeClientSettings$1 {
    /** WebSocket endpoint URL */
    url: string;
    /** API key for authentication */
    apiKey: string;
    /** Whether to allow API key usage in browser (not recommended for production) */
    dangerouslyAllowAPIKeyInBrowser?: boolean;
    /** Enable debug logging */
    debug?: boolean;
}
/**
 * Tool definition for registering tools with the client
 */
interface ToolDefinition {
    /** Name of the tool */
    name: string;
    /** Description of what the tool does */
    description: string;
    /** JSON Schema for the tool parameters */
    parameters: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}
/**
 * Tool registration type combining definition and handler
 */
interface ToolRegistration {
    definition: ToolDefinition;
    handler: Function;
}
/**
 * Model configuration settings
 */
interface TicosModelConfig {
    /** Model provider (e.g., 'tiwater') */
    provider: string;
    /** Model name (e.g., 'stardust-2.5-turbo') */
    name: string;
    /** Supported modalities */
    modalities: string[];
    /** System instructions */
    instructions: string;
    /** Available tools */
    tools: ToolDefinition[];
    /** Tool choice strategy */
    tool_choice: 'auto' | 'none' | 'required' | {
        type: 'function';
        name: string;
    };
    /** Temperature for response generation */
    temperature: number;
    /** Maximum tokens in responses */
    max_response_output_tokens: number | 'inf';
}
/**
 * Audio configuration settings
 */
interface AudioConfig$1 {
    /** Voice ID for audio responses */
    voice: string;
    /** Format of audio input */
    input_audio_format: string;
    /** Format of audio output */
    output_audio_format: string;
    /** Configuration for audio transcription */
    input_audio_transcription: any | null;
    /** Settings for conversation turn detection */
    turn_detection: any | null;
}
/**
 * Vision configuration settings
 */
interface VisionConfig {
    /** Enable face detection */
    enable_face_detection?: boolean;
    /** Enable object detection */
    enable_object_detection?: boolean;
    /** Enable face identification */
    enable_face_identification?: boolean;
    /** Target classes for object detection */
    object_detection_target_classes?: string[];
}
/**
 * Knowledge configuration settings
 */
interface KnowledgeConfig {
    /** Available scripts for conversation */
    scripts?: ScriptConfig[];
}
/**
 * Script configuration for predefined dialogues
 */
interface ScriptConfig {
    /** Unique identifier */
    id: string;
    /** Script name */
    name: string;
    /** Script description */
    description: string;
    /** Priority level */
    priority?: number;
    /** Categorization tags */
    tags: string[];
    /** Predefined dialogues */
    dialogues: Dialogue[];
}
/**
 * Dialogue structure for scripted responses
 */
interface Dialogue {
    /** Unique identifier */
    id: string;
    /** Input prompts that trigger this dialogue */
    prompts: string[];
    /** Possible responses */
    responses: DialogueResponse[];
}
/**
 * Response types in dialogues
 */
type DialogueResponse = MessageResponse | FunctionResponse;
/**
 * Message response in dialogues
 */
interface MessageResponse {
    /** Unique identifier */
    id: string;
    /** Response type */
    type: 'message';
    /** Message content */
    message: string;
}
/**
 * Function response in dialogues
 */
interface FunctionResponse {
    /** Unique identifier */
    id: string;
    /** Response type */
    type: 'function';
    /** Function to execute */
    function: string;
}
/**
 * Complete Ticos configuration
 */
interface TicosConfigOptions {
    /** Model configuration */
    model: TicosModelConfig;
    /** Speech configuration */
    speech: Partial<AudioConfig$1>;
    /** Hearing configuration */
    hearing: Partial<AudioConfig$1>;
    /** Vision configuration */
    vision?: VisionConfig;
    /** Knowledge configuration */
    knowledge?: KnowledgeConfig;
}
/**
 * Audio transcription configuration
 */
type AudioTranscriptionType = {
    provider: string;
    language?: string;
    model?: string;
};
/**
 * Turn detection configuration using server VAD
 */
type TurnDetectionServerVadType = {
    provider: string;
    min_silence_duration?: number;
    silence_threshold?: number;
};

/**
 * Types of content that can be sent in a message
 */
type ContentType = 'text' | 'audio' | 'image';
/**
 * Status of a conversation item
 */
type ItemStatus = 'pending' | 'completed' | 'error';
/**
 * Base content interface for messages
 */
interface ContentBase {
    type: ContentType;
}
/**
 * Text content in a message
 */
interface TextContent extends ContentBase {
    type: 'text';
    text: string;
}
/**
 * Audio content in a message
 */
interface AudioContent extends ContentBase {
    type: 'audio';
    audio: string;
    transcript?: string;
}
/**
 * Image content in a message
 */
interface ImageContent extends ContentBase {
    type: 'image';
    image: string;
    caption?: string;
}
/**
 * Union type for all possible content types
 */
type Content = TextContent | AudioContent | ImageContent;
/**
 * Error information for items with error status
 */
interface ItemError {
    code: string;
    message: string;
}
/**
 * Base item type for conversation items
 */
interface ItemType {
    id: string;
    type: 'text' | 'audio' | 'image' | 'tool_call' | 'tool_response';
    content: Content[];
    status: ItemStatus;
    error?: ItemError;
}
/**
 * Conversation state type
 */
interface ConversationState {
    id: string;
    items: ItemType[];
    status: 'active' | 'completed' | 'error';
    metadata?: Record<string, any>;
}

/**
 * Base event interface
 */
interface Event {
    type: string;
}
/**
 * WebSocket event source
 */
type EventSource = 'client' | 'server';
/**
 * Event with timestamp and source
 */
interface TimestampedEvent {
    time: string;
    source: EventSource;
    event: Event;
}
/**
 * Session update event payload
 */
interface SessionUpdateEvent extends Event {
    session: RealtimeClientSettings$1;
}
/**
 * Conversation start event payload
 */
interface ConversationStartEvent extends Event {
    conversation_id: string;
    metadata?: Record<string, any>;
}
/**
 * Conversation end event payload
 */
interface ConversationEndEvent extends Event {
    conversation_id: string;
    reason: 'completed' | 'timeout' | 'error';
}
/**
 * Item event payload
 */
interface ItemEvent extends Event {
    item: ItemType;
}
/**
 * Item error event payload
 */
interface ItemErrorEvent extends ItemEvent {
    error: {
        code: string;
        message: string;
    };
}
/**
 * Tool registration event payload
 */
interface ToolRegisterEvent extends Event {
    tool: ToolDefinition;
}
/**
 * Tool call event payload
 */
interface ToolCallEvent extends Event {
    tool_name: string;
    parameters: Record<string, any>;
    call_id: string;
}
/**
 * Tool response event payload
 */
interface ToolResponseEvent extends Event {
    call_id: string;
    result?: Record<string, any>;
    error?: {
        code: string;
        message: string;
    };
}

/** Callback function type for event handlers */
type EventHandlerCallbackType = (event: Record<string, any>) => void;
/**
 * Base class for handling real-time events with support for persistent and one-time event listeners.
 * Provides methods for subscribing to events, handling them once, and waiting for specific events.
 */
declare class RealtimeEventHandler {
    /** Map of event names to arrays of persistent event handlers */
    private eventHandlers;
    /** Map of event names to arrays of one-time event handlers */
    private nextEventHandlers;
    /**
     * Removes all event handlers, both persistent and one-time.
     * @returns {true} Always returns true
     */
    clearEventHandlers(): true;
    /**
     * Registers a persistent event handler for a specific event.
     * The handler will be called every time the event occurs until explicitly removed.
     *
     * @param {string} eventName - Name of the event to listen for
     * @param {EventHandlerCallbackType} callback - Function to call when the event occurs
     * @returns {EventHandlerCallbackType} The registered callback function
     */
    on(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType;
    /**
     * Registers a one-time event handler for a specific event.
     * The handler will be called only once when the event next occurs, then automatically removed.
     *
     * @param {string} eventName - Name of the event to listen for
     * @param {EventHandlerCallbackType} callback - Function to call when the event occurs
     * @returns {EventHandlerCallbackType} The registered callback function
     */
    onNext(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType;
    /**
     * Removes a persistent event handler for a specific event.
     * If no callback is provided, removes all handlers for the event.
     *
     * @param {string} eventName - Name of the event to stop listening for
     * @param {EventHandlerCallbackType} [callback] - Specific handler to remove
     * @returns {true} Always returns true
     * @throws {Error} If the specified callback is not found as a listener
     */
    off(eventName: string, callback?: EventHandlerCallbackType): true;
    /**
     * Removes a one-time event handler for a specific event.
     * If no callback is provided, removes all one-time handlers for the event.
     *
     * @param {string} eventName - Name of the event to stop listening for
     * @param {EventHandlerCallbackType} [callback] - Specific handler to remove
     * @returns {true} Always returns true
     * @throws {Error} If the specified callback is not found as a listener
     */
    offNext(eventName: string, callback?: EventHandlerCallbackType): true;
    /**
     * Waits for the next occurrence of a specific event.
     * Returns a promise that resolves with the event data when the event occurs.
     *
     * @param {string} eventName - Name of the event to wait for
     * @param {number | null} [timeout=null] - Optional timeout in milliseconds
     * @returns {Promise<Record<string, any> | null>} Promise resolving to event data or null if timed out
     */
    waitForNext(eventName: string, timeout?: number | null): Promise<Record<string, any> | null>;
    /**
     * Protected method to emit events to all registered handlers.
     * Calls both persistent and one-time handlers, then removes the one-time handlers.
     *
     * @protected
     * @param {string} eventName - Name of the event to emit
     * @param {any} event - Event data to pass to handlers
     * @returns {true} Always returns true
     */
    protected emit(eventName: string, event: any): true;
}

/** Type alias for WebSocket instances that works in both Node.js and browser environments */
type WebSocketType = WebSocket$1 | WebSocket;
/**
 * Configuration settings for initializing the Realtime API client.
 *
 * @interface RealtimeAPISettings
 * @property {string} [url] - WebSocket endpoint URL. Defaults to OpenAI's realtime API endpoint.
 * @property {string} [apiKey] - API key for authentication. Required for non-browser environments.
 * @property {boolean} [dangerouslyAllowAPIKeyInBrowser] - Whether to allow API key usage in browser (not recommended).
 * @property {boolean} [debug] - Enable debug logging of WebSocket communication.
 */
interface RealtimeAPISettings {
    url?: string;
    apiKey?: string;
    dangerouslyAllowAPIKeyInBrowser?: boolean;
    debug?: boolean;
}
/**
 * Main client for interacting with the Realtime API.
 * Provides WebSocket-based communication with real-time capabilities.
 *
 * @extends {RealtimeEventHandler}
 *
 * @example
 * ```typescript
 * const api = new RealtimeAPI({
 *   apiKey: 'your-api-key',
 *   debug: true
 * });
 *
 * await api.connect();
 * api.send('message', { content: 'Hello!' });
 * ```
 */
declare class RealtimeAPI extends RealtimeEventHandler {
    /** Default WebSocket endpoint URL */
    private defaultUrl;
    /** Current WebSocket endpoint URL */
    private url;
    /** API key for authentication */
    readonly apiKey: string | null;
    /** Debug mode flag */
    private debug;
    /** Active WebSocket connection */
    private ws;
    /**
     * Creates a new RealtimeAPI instance.
     *
     * @param {RealtimeAPISettings} settings - Configuration settings for the client
     * @throws {Error} If API key is provided in browser without explicit permission
     */
    constructor(settings?: RealtimeAPISettings);
    /**
     * Checks if the client is currently connected to the WebSocket server.
     *
     * @returns {boolean} True if connected, false otherwise
     */
    isConnected(): boolean;
    /**
     * Internal logging function for debug messages.
     * Only logs when debug mode is enabled.
     *
     * @private
     * @param {...any[]} args - Arguments to log
     * @returns {true} Always returns true
     */
    private log;
    /**
     * Establishes a WebSocket connection to the server.
     * Handles both browser and Node.js environments differently.
     *
     * @param {Object} settings - Connection settings
     * @param {string} [settings.model='gpt-4o-realtime-preview-2024-10-01'] - Model to use for the connection
     * @returns {Promise<true>} Resolves when connection is established
     * @throws {Error} If already connected or connection fails
     *
     * @example
     * ```typescript
     * await api.connect({ model: 'gpt-4o-realtime-preview-2024-10-01' });
     * ```
     */
    connect(settings?: {
        model?: string;
    }): Promise<true>;
    /**
     * Closes the WebSocket connection.
     *
     * @param {WebSocketType} [ws] - Optional WebSocket instance to disconnect
     * @returns {true} Always returns true
     *
     * @example
     * ```typescript
     * api.disconnect(); // Closes the current connection
     * ```
     */
    disconnect(ws?: WebSocketType): true;
    /**
     * Internal method to handle incoming WebSocket messages.
     * Emits events for the received message type.
     *
     * @private
     * @param {string} eventName - Type of the received event
     * @param {Record<string, any>} event - Event data
     * @returns {true} Always returns true
     */
    private receive;
    /**
     * Sends a message through the WebSocket connection.
     *
     * @param {string} eventName - Type of event to send
     * @param {Record<string, any>} data - Data to send with the event
     * @returns {true} Always returns true
     * @throws {Error} If not connected or if data is not an object
     *
     * @example
     * ```typescript
     * api.send('message', { content: 'Hello world!' });
     * ```
     */
    send(eventName: string, data?: Record<string, any>): true;
    /**
     * Generates a unique ID for events.
     *
     * @private
     * @param {string} [prefix=''] - Optional prefix for the generated ID
     * @returns {string} Generated unique ID
     */
    private generateId;
    /**
     * Waits for the next occurrence of a specific event.
     *
     * @param {string} eventName - Name of the event to wait for
     * @param {number} [timeout] - Optional timeout in milliseconds
     * @returns {Promise<any>} Resolves with the event data when received
     *
     * @example
     * ```typescript
     * const response = await api.waitForNext('message', 5000);
     * ```
     */
    waitForNext(eventName: string, timeout?: number): Promise<any>;
}

/**
 * Manages the state and events of a realtime conversation.
 * Handles conversation items, audio queuing, and event processing.
 *
 * @class RealtimeConversation
 *
 * @example
 * ```typescript
 * const conversation = new RealtimeConversation();
 * conversation.addItem({
 *   id: '123',
 *   type: 'text',
 *   content: [{ type: 'text', text: 'Hello!' }]
 * });
 * ```
 */
declare class RealtimeConversation {
    /** Array of conversation items */
    private items;
    /** ID of the currently active item */
    private currentItemId;
    /** Queued audio data for processing */
    private queuedAudio;
    /** Default audio sampling frequency in Hz */
    readonly defaultFrequency: number;
    /**
     * Creates a new RealtimeConversation instance.
     * Initializes empty conversation state.
     */
    constructor();
    /**
     * Adds a new item to the conversation.
     * Sets it as the current item.
     *
     * @param {ItemType} item - The item to add to the conversation
     */
    addItem(item: ItemType): void;
    /**
     * Gets the currently active conversation item.
     *
     * @returns {ItemType | null} The current item or null if none is active
     */
    getCurrentItem(): ItemType | null;
    /**
     * Gets all items in the conversation.
     * Returns a copy of the items array to prevent direct modification.
     *
     * @returns {ItemType[]} Array of all conversation items
     */
    getItems(): ItemType[];
    /**
     * Clears the conversation state.
     * Removes all items and resets audio queue.
     */
    clear(): void;
    /**
     * Updates an existing conversation item.
     *
     * @param {string} itemId - ID of the item to update
     * @param {Partial<ItemType>} updates - Partial item data to merge with existing item
     */
    updateItem(itemId: string, updates: Partial<ItemType>): void;
    /**
     * Queues audio data for processing.
     *
     * @param {Int16Array} audio - Audio data to queue
     */
    queueInputAudio(audio: Int16Array): void;
    /**
     * Gets the currently queued audio data.
     *
     * @returns {Int16Array | null} Queued audio data or null if none is queued
     */
    getQueuedAudio(): Int16Array | null;
    /**
     * Clears the queued audio data.
     */
    clearQueuedAudio(): void;
    /**
     * Processes various conversation events and updates the conversation state accordingly.
     * Handles item creation, updates, deletions, and various content updates.
     *
     * @param {string} event - Type of event to process
     * @param {...any[]} args - Event-specific arguments
     * @returns {{ item: ItemType | null; delta: any }} Updated item and changes made
     *
     * @example
     * ```typescript
     * const { item, delta } = conversation.processEvent('item.created', {
     *   id: '123',
     *   type: 'text',
     *   content: [{ type: 'text', text: 'Hello!' }]
     * });
     * ```
     */
    processEvent(event: string, ...args: any[]): {
        item: ItemType | null;
        delta: any;
    };
    /**
     * Converts audio data to base64 string format.
     *
     * @private
     * @param {Int16Array} audio - Audio data to encode
     * @returns {string} Base64 encoded audio data
     */
    private encodeAudioToBase64;
}

/**
 * Base configuration interface for all Realtime API clients.
 * Defines the common configuration properties shared across different implementations.
 *
 * @interface BaseConfig
 * @property {string[]} modalities - List of supported interaction modalities (e.g., ['text', 'audio']).
 * @property {string} instructions - System instructions or prompts for the model.
 * @property {any[]} tools - Array of tool configurations that the model can use.
 * @property {'auto' | 'none' | 'required' | { type: 'function'; name: string }} tool_choice - Tool selection strategy.
 * @property {number} temperature - Sampling temperature for model responses (0.0 to 1.0).
 * @property {number | 'inf'} max_response_output_tokens - Maximum tokens in model responses ('inf' for unlimited).
 */
interface BaseConfig {
    modalities: string[];
    instructions: string;
    tools: any[];
    tool_choice: 'auto' | 'none' | 'required' | {
        type: 'function';
        name: string;
    };
    temperature: number;
    max_response_output_tokens: number | 'inf';
}
/**
 * Configuration interface for audio-related features.
 * Defines settings specific to audio input and output handling.
 *
 * @interface AudioConfig
 * @property {string} voice - Voice ID to use for audio responses.
 * @property {string} input_audio_format - Format of the audio input (e.g., 'pcm16', 'mp3').
 * @property {string} output_audio_format - Format of the audio output (e.g., 'pcm16', 'mp3').
 * @property {any | null} input_audio_transcription - Configuration for audio input transcription.
 * @property {any | null} turn_detection - Settings for conversation turn detection in audio.
 */
interface AudioConfig {
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: any | null;
    turn_detection: any | null;
}
/**
 * Abstract base class for configuration management.
 * Provides a common interface for managing configuration across different implementations.
 *
 * @abstract
 * @class ConfigManager
 *
 * @example
 * ```typescript
 * class MyConfigManager extends ConfigManager {
 *   // Implement abstract methods
 *   updateConfig(updates: Partial<MyConfig>) { ... }
 *   getSessionPayload() { ... }
 *   reset() { ... }
 * }
 * ```
 */
declare abstract class ConfigManager {
    /** Current configuration state. Type is specified by implementing classes. */
    protected config: any;
    /**
     * Updates the current configuration with new values.
     * @abstract
     * @param {Partial<any>} updates - Partial configuration object with values to update
     */
    abstract updateConfig(updates: Partial<any>): void;
    /**
     * Retrieves the configuration formatted as a session payload.
     * @abstract
     * @returns {any} Configuration wrapped in an appropriate format for API communication
     */
    abstract getSessionPayload(): any;
    /**
     * Resets the configuration to default values.
     * @abstract
     */
    abstract reset(): void;
}

/**
 * Configuration settings for initializing the Realtime Client.
 *
 * @interface RealtimeClientSettings
 * @property {string} [url] - WebSocket endpoint URL. Defaults to the API's default URL.
 * @property {string} [apiKey] - API key for authentication. Required for non-browser environments.
 * @property {boolean} [dangerouslyAllowAPIKeyInBrowser] - Whether to allow API key usage in browser (not recommended).
 * @property {boolean} [debug] - Enable debug logging of WebSocket communication.
 */
interface RealtimeClientSettings {
    url?: string;
    apiKey?: string;
    dangerouslyAllowAPIKeyInBrowser?: boolean;
    debug?: boolean;
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
declare class RealtimeClient extends RealtimeEventHandler {
    /** Configuration manager instance */
    protected configManager: ConfigManager;
    /** Low-level API client instance */
    protected realtime: RealtimeAPI;
    /** Conversation manager instance */
    protected conversation: RealtimeConversation;
    /** Map of registered tools and their handlers */
    protected tools: Record<string, {
        definition: ToolDefinition;
        handler: Function;
    }>;
    /**
     * Creates a new RealtimeClient instance.
     *
     * @param {RealtimeClientSettings} settings - Configuration settings for the client
     */
    constructor(settings?: RealtimeClientSettings);
    /**
     * Sets up event handlers for the API client.
     * Forwards all events to the client's event system with additional metadata.
     *
     * @private
     * @returns {boolean} Always returns true
     */
    private _addAPIEventHandlers;
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
    connect(): Promise<void>;
    /**
     * Closes the connection to the Realtime API server.
     *
     * @example
     * ```typescript
     * client.disconnect();
     * ```
     */
    disconnect(): void;
    /**
     * Checks if the client is currently connected to the server.
     *
     * @returns {boolean} True if connected, false otherwise
     */
    isConnected(): boolean;
    /**
     * Updates the session configuration on the server.
     * Called internally when configuration or tools change.
     *
     * @protected
     */
    protected updateSession(): void;
    /**
     * Resets the client to its initial state.
     * Clears all configuration and registered tools.
     *
     * @example
     * ```typescript
     * client.reset();
     * ```
     */
    reset(): void;
    /**
     * Returns the current conversation items.
     *
     * @returns {ItemType[]} The current conversation items
     */
    getConversationItems(): ItemType[];
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
    registerTool(definition: ToolDefinition, handler: Function): void;
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
    unregisterTool(name: string): void;
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
    executeTool(name: string, args: Record<string, any>): Promise<any>;
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
    waitForNextItem(): Promise<{
        item: null;
    } | {
        item: ItemType;
    }>;
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
    waitForNextCompletedItem(): Promise<{
        item: null;
    } | {
        item: ItemType;
    }>;
}

/**
 * Configuration manager for Ticos Realtime API
 */
declare class TicosConfig implements BaseConfig {
    protected config: TicosConfigOptions;
    private settings;
    get modalities(): string[];
    get instructions(): string;
    get tools(): ToolDefinition[];
    get tool_choice(): 'auto' | 'none' | 'required' | {
        type: 'function';
        name: string;
    };
    get temperature(): number;
    get max_response_output_tokens(): number | 'inf';
    /**
     * Updates the client settings
     */
    updateSettings(settings: Partial<RealtimeClientSettings$1>): void;
    /**
     * Gets the current client settings
     */
    getSettings(): RealtimeClientSettings$1;
    /**
     * Updates the model configuration
     */
    updateModelConfig(updates: Partial<TicosModelConfig>): void;
    /**
     * Updates the speech configuration
     */
    updateSpeechConfig(updates: Partial<AudioConfig$1>): void;
    /**
     * Updates the hearing configuration
     */
    updateHearingConfig(updates: Partial<AudioConfig$1>): void;
    /**
     * Updates the vision configuration
     */
    updateVisionConfig(updates: Partial<TicosConfigOptions['vision']>): void;
    /**
     * Updates the knowledge configuration
     */
    updateKnowledgeConfig(updates: Partial<TicosConfigOptions['knowledge']>): void;
    /**
     * Adds a tool to the configuration
     */
    addTool(tool: ToolDefinition): void;
    /**
     * Removes a tool from the configuration
     */
    removeTool(name: string): void;
    /**
     * Gets all registered tools
     */
    getTools(): ToolDefinition[];
    /**
     * Gets the session payload for WebSocket communication
     */
    getSessionPayload(): {
        session: TicosConfigOptions;
    };
    /**
     * Resets the configuration to default values
     */
    reset(): void;
}
declare class TicosConfigManager extends ConfigManager {
    protected config: TicosConfig;
    constructor();
    updateConfig(updates: Partial<TicosConfigOptions>): void;
    getSessionPayload(): {
        session: TicosConfigOptions;
    };
    reset(): void;
}

/**
 * Configuration interface for the OpenAI Realtime API client.
 * @interface OpenAIConfig
 *
 * @property {string} [apiKey] - OpenAI API key for authentication. Required for non-browser environments.
 * @property {string} [model] - The OpenAI model to use (e.g., 'gpt-4o-realtime-preview-2024-10-01').
 * @property {boolean} [dangerouslyAllowAPIKeyInBrowser] - Whether to allow API key usage in browser environments (not recommended).
 * @property {string[]} [modalities] - Supported interaction modalities (e.g., ['text', 'audio']).
 * @property {string} [instructions] - System instructions for the model.
 * @property {string} [voice] - Voice ID for audio responses (e.g., 'verse').
 * @property {string} [input_audio_format] - Format for audio input (e.g., 'pcm16').
 * @property {string} [output_audio_format] - Format for audio output (e.g., 'pcm16').
 * @property {string | null} [input_audio_transcription] - Transcription settings for audio input.
 * @property {any} [turn_detection] - Configuration for turn-based conversation detection.
 * @property {any[]} [tools] - Array of tool configurations available to the model.
 * @property {string} [tool_choice] - Strategy for tool selection ('auto' | 'none' | specific tool).
 * @property {number} [temperature] - Sampling temperature for model responses (0.0 to 1.0).
 * @property {number} [max_response_output_tokens] - Maximum number of tokens in model responses.
 */
interface OpenAIConfig {
    apiKey?: string;
    model?: string;
    dangerouslyAllowAPIKeyInBrowser?: boolean;
    modalities?: string[];
    instructions?: string;
    voice?: string;
    input_audio_format?: string;
    output_audio_format?: string;
    input_audio_transcription?: string | null;
    turn_detection?: any;
    tools?: any[];
    tool_choice?: string;
    temperature?: number;
    max_response_output_tokens?: number;
}
/**
 * Manages configuration settings for the OpenAI Realtime API client.
 * Extends the base ConfigManager to provide OpenAI-specific configuration management.
 *
 * @example
 * ```typescript
 * const config = new OpenAIConfigManager();
 * config.updateConfig({
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4o-realtime-preview-2024-10-01',
 *   temperature: 0.7
 * });
 * ```
 */
declare class OpenAIConfigManager extends ConfigManager {
    /** Current configuration state */
    config: OpenAIConfig;
    /**
     * Creates a new OpenAIConfigManager instance with default settings.
     * Initializes the configuration with sensible defaults for realtime interactions.
     */
    constructor();
    /**
     * Resets the configuration to default values.
     * This method is useful when you need to start fresh with default settings.
     *
     * @example
     * ```typescript
     * config.reset(); // Resets all settings to defaults
     * ```
     */
    reset(): void;
    /**
     * Updates the current configuration with new values.
     * Merges the provided updates with the existing configuration.
     *
     * @param {Partial<OpenAIConfig>} updates - Partial configuration object containing only the values to update
     *
     * @example
     * ```typescript
     * config.updateConfig({
     *   temperature: 0.9,
     *   max_response_output_tokens: 2048
     * });
     * ```
     */
    updateConfig(updates: Partial<OpenAIConfig>): void;
    /**
     * Retrieves the current configuration formatted as a session payload.
     * Used internally by the client to send configuration to the API.
     *
     * @returns {{ session: OpenAIConfig }} Configuration wrapped in a session object
     *
     * @example
     * ```typescript
     * const payload = config.getSessionPayload();
     * // { session: { temperature: 0.8, ... } }
     * ```
     */
    getSessionPayload(): {
        session: OpenAIConfig;
    };
}

declare class OpenAIRealtimeClient extends RealtimeClient {
    protected configManager: OpenAIConfigManager;
    constructor(settings?: RealtimeClientSettings);
    updateConfig(updates: Partial<OpenAIConfig>): void;
}

type OpenaiVoiceType = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";
/**
 * OpenAI-specific tool definition extending the base tool definition
 */
interface OpenaiToolDefinition extends ToolDefinition {
    /** OpenAI-specific tool properties */
    openai_properties?: Record<string, any>;
}
/**
 * OpenAI configuration options
 */
interface OpenaiConfig extends BaseConfig, AudioConfig {
    voice: OpenaiVoiceType;
    input_audio_transcription: AudioTranscriptionType | null;
    turn_detection: TurnDetectionServerVadType | null;
    tools: OpenaiToolDefinition[];
}

/**
 * Basic utilities for the RealtimeAPI
 */
declare class RealtimeUtils {
    /**
     * Converts Float32Array of amplitude data to ArrayBuffer in Int16Array format
     */
    static floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer;
    /**
     * Converts a base64 string to an ArrayBuffer
     */
    static base64ToArrayBuffer(base64: string): ArrayBuffer;
    /**
     * Converts an ArrayBuffer, Int16Array or Float32Array to a base64 string
     */
    static arrayBufferToBase64(arrayBuffer: ArrayBuffer | Int16Array | Float32Array): string;
    /**
     * Merge two Int16Arrays from Int16Arrays or ArrayBuffers
     */
    static mergeInt16Arrays(left: ArrayBuffer | Int16Array, right: ArrayBuffer | Int16Array): Int16Array;
    /**
     * Generates an id to send with events and messages
     */
    static generateId(prefix: string, length?: number): string;
}

export { type AudioConfig$1 as AudioConfig, type AudioContent, type BaseConfig, ConfigManager, type Content, type ContentBase, type ContentType, type ConversationEndEvent, type ConversationStartEvent, type ConversationState, type Event, type EventSource, type ImageContent, type ItemError, type ItemErrorEvent, type ItemEvent, type ItemStatus, type ItemType, type KnowledgeConfig, OpenAIRealtimeClient, type OpenaiConfig, type OpenaiToolDefinition, type OpenaiVoiceType, RealtimeAPI, RealtimeClient, type RealtimeClientSettings$1 as RealtimeClientSettings, RealtimeConversation, RealtimeEventHandler, RealtimeUtils, type SessionUpdateEvent, type TextContent, TicosConfig, TicosConfigManager, type TicosConfigOptions, type TicosModelConfig, type TimestampedEvent, type ToolCallEvent, type ToolDefinition, type ToolRegisterEvent, type ToolRegistration, type ToolResponseEvent, type VisionConfig };
