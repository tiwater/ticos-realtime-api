/**
 * Types of content that can be sent in a message
 */
type ContentType = 'text' | 'audio' | 'image' | 'input_text' | 'input_audio';
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
 * Input text content in a message
 */
interface InputTextContent extends ContentBase {
    type: 'input_text';
    text: string;
}
/**
 * Input audio content in a message
 */
interface InputAudioContent extends ContentBase {
    type: 'input_audio';
    audio?: string;
    transcript?: string | null;
}
/**
 * Union type for all possible content types
 */
type Content = TextContent | AudioContent | ImageContent | InputTextContent | InputAudioContent;
/**
 * Error information for items with error status
 */
interface ItemError {
    code: string;
    message: string;
}
/**
 * Formatted properties for items
 */
interface FormattedProperties {
    text?: string;
    audio?: Int16Array;
    transcript?: string;
    tool?: {
        type: string;
        name: string;
        call_id: string;
        arguments: string;
    };
    output?: string;
    file?: {
        url?: string;
        blob?: Blob;
    };
}
/**
 * Base item type for conversation items
 */
interface ItemType {
    id: string;
    type: 'message' | 'text' | 'audio' | 'image' | 'tool_call' | 'tool_response' | 'function_call' | 'function_call_output';
    role?: 'user' | 'assistant' | 'system';
    content: Content[];
    status?: 'in_progress' | 'completed' | 'incomplete';
    formatted?: FormattedProperties;
    arguments?: string;
    call_id?: string;
    name?: string;
    output?: string;
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
 * Configuration options for initializing the client
 */
interface ClientOptions {
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
 * Tool parameter definition
 */
interface ToolParameter {
    /** Parameter type */
    type: string;
    /** Parameter description */
    description: string;
}
/**
 * Tool definition for registering tools with the client
 */
interface ToolDefinition {
    /** Tool type, always "function" */
    type: "function";
    /** Optional unique identifier */
    id?: string;
    /** Name of the tool */
    name: string;
    /** Description of what the tool does */
    description: string;
    /** Parameters schema */
    parameters: {
        type: "object";
        properties: Record<string, ToolParameter>;
    };
    /** Required parameter names */
    required: string[];
    /** Tool operation mode */
    operation_mode: "client_mode" | "server_mode";
    /** Tool execution type */
    execution_type: "synchronous" | "asynchronous";
    /** How to handle the tool's result */
    result_handling: "process_in_llm" | "process_in_client" | "ignore_result";
    /** Tool implementation code */
    code: string;
    /** Programming language of the code */
    language: "python" | "shell";
    /** Operating system platform */
    platform: "linux" | "macos" | "windows";
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
interface ModelConfig {
    /** Model provider (e.g., 'tiwater') */
    provider: string;
    /** Model name (e.g., 'stardust-2.5-turbo') */
    name: string;
    /** Supported modalities */
    modalities: string[];
    /** System instructions */
    instructions?: string;
    /** Available tools */
    tools?: ToolDefinition[];
    /** Tool choice strategy */
    tool_choice?: 'auto' | 'none' | 'required' | {
        type: 'function';
        name: string;
    };
    /** Temperature for response generation */
    temperature?: number;
    /** Maximum tokens in responses */
    max_response_output_tokens?: number | 'inf';
}
/**
 * Audio configuration settings
 */
interface AudioConfig {
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
 * Complete configuration
 */
interface RealtimeConfig {
    /** Model configuration */
    model: ModelConfig;
    /** Speech configuration */
    speech: Partial<AudioConfig>;
    /** Hearing configuration */
    hearing: Partial<AudioConfig>;
    /** Vision configuration */
    vision?: VisionConfig;
    /** Knowledge configuration */
    knowledge?: KnowledgeConfig;
}

/**
 * Base event interface
 */
interface Event {
    type: string;
    [key: string]: any;
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
    session: RealtimeConfig;
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
/**
 * Realtime event with metadata
 */
interface RealtimeEvent extends Event {
    time: string;
    source: 'client' | 'server';
    event: Event;
}

/**
 * EventHandler callback type definition
 */
type EventHandlerCallbackType<T extends Event = Event> = (event: T) => void;
/**
 * Base class for handling real-time events
 * Provides methods for subscribing to events, handling them once, and waiting for specific events.
 * Used by RealtimeAPI and RealtimeClient classes.
 */
declare class RealtimeEventHandler {
    /** Event handlers for persistent event listeners */
    private eventHandlers;
    /** Event handlers for one-time event listeners */
    private nextEventHandlers;
    /**
     * Creates a new RealtimeEventHandler instance
     */
    constructor();
    /**
     * Clears all event handlers
     * @returns {boolean} Always returns true
     */
    clearEventHandlers(): boolean;
    /**
     * Listen to specific events
     * @param {string} eventName The name of the event to listen to (supports wildcards with '*')
     * @param {EventHandlerCallbackType<T>} callback Code to execute on event
     * @returns {EventHandlerCallbackType<T>} The callback function
     */
    on<T extends Event = Event>(eventName: string, callback: EventHandlerCallbackType<T>): EventHandlerCallbackType<T>;
    /**
     * Listen for the next event of a specified type
     * @param {string} eventName The name of the event to listen to (supports wildcards with '*')
     * @param {EventHandlerCallbackType<T>} callback Code to execute on event
     * @returns {EventHandlerCallbackType<T>} The callback function
     */
    onNext<T extends Event = Event>(eventName: string, callback: EventHandlerCallbackType<T>): EventHandlerCallbackType<T>;
    /**
     * Turns off event listening for specific events
     * Calling without a callback will remove all listeners for the event
     * @param {string} eventName Event name to stop listening to
     * @param {EventHandlerCallbackType<T>} [callback] Optional specific callback to remove
     * @returns {boolean} Always returns true
     */
    off<T extends Event = Event>(eventName: string, callback?: EventHandlerCallbackType<T>): boolean;
    /**
     * Turns off event listening for the next event of a specific type
     * Calling without a callback will remove all listeners for the next event
     * @param {string} eventName Event name to stop listening to
     * @param {EventHandlerCallbackType<T>} [callback] Optional specific callback to remove
     * @returns {boolean} Always returns true
     */
    offNext<T extends Event = Event>(eventName: string, callback?: EventHandlerCallbackType<T>): boolean;
    /**
     * Waits for next event of a specific type and returns the payload
     * @param {string} eventName Event name to wait for
     * @param {number|null} [timeout=null] Optional timeout in milliseconds
     * @returns {Promise<T|null>} Promise that resolves with the event data or null if timed out
     */
    waitForNext<T extends Event = Event>(eventName: string, timeout?: number | null): Promise<T | null>;
    /**
     * Executes all events in the order they were added, with .on() event handlers executing before .onNext() handlers
     * Supports wildcard patterns for event names using '*'
     *
     * @param {string} eventName Event name to dispatch
     * @param {T} event Event data to pass to handlers
     * @returns {boolean} Always returns true
     */
    dispatch<T extends Event>(eventName: string, event: T): boolean;
}

/**
 * Main client for interacting with the Realtime API.
 * Provides WebSocket-based communication with real-time capabilities.
 *
 * @class RealtimeAPI
 *
 * @example
 * ```typescript
 * const api = new RealtimeAPI({
 *   url: 'wss://stardust.ticos.cn/realtime',
 *   apiKey: 'your-api-key'
 * });
 *
 * await api.connect();
 * api.send('message', { text: 'Hello!' });
 * ```
 */
declare class RealtimeAPI extends RealtimeEventHandler {
    /** WebSocket endpoint URL */
    private url;
    /** Default WebSocket endpoint URL */
    private defaultUrl;
    /** API key for authentication */
    private apiKey;
    /** WebSocket connection */
    private ws;
    /** Debug mode flag */
    private debug;
    /** Connection status */
    private connected;
    /**
     * Creates a new RealtimeAPI instance.
     *
     * @param {ClientOptions} settings - Configuration settings for the client
     * @throws {Error} If API key is provided in browser without explicit permission
     */
    constructor(settings?: ClientOptions);
    /**
     * Establishes a WebSocket connection to the Realtime API server.
     *
     * @returns {Promise<void>} Resolves when the connection is established
     * @throws {Error} If connection fails
     *
     * @example
     * ```typescript
     * await api.connect();
     * console.log('Connected to Realtime API');
     * ```
     */
    connect(): Promise<void>;
    /**
     * Closes the WebSocket connection.
     *
     * @example
     * ```typescript
     * api.disconnect();
     * console.log('Disconnected from Realtime API');
     * ```
     */
    disconnect(): void;
    /**
     * Checks if the client is currently connected to the server.
     *
     * @returns {boolean} True if connected, false otherwise
     *
     * @example
     * ```typescript
     * if (api.isConnected()) {
     *   console.log('Connected to Realtime API');
     * }
     * ```
     */
    isConnected(): boolean;
    /**
     * Receives an event from WebSocket and dispatches the raw event
     *
     * @param {string} eventName - Event name
     * @param {Record<string, any>} event - Event data
     * @returns {boolean} Always returns true
     * @private
     */
    private receive;
    /**
     * Sends a message to the server.
     * If not connected, the message will fail rather than being queued.
     *
     * @param {string} type - Message type
     * @param {Record<string, any>} payload - Message payload
     * @returns {boolean} True if sent successfully, false if failed
     *
     * @example
     * ```typescript
     * api.send('message', { text: 'Hello!' });
     * ```
     */
    send(type: string, payload?: Record<string, any>): boolean;
    /**
     * Registers a tool with the server.
     *
     * @param {string} name - Tool name
     * @param {object} definition - Tool definition
     * @returns {boolean} True if sent immediately, false if queued
     *
     * @example
     * ```typescript
     * api.registerTool('calculator', {
     *   description: 'Performs calculations',
     *   parameters: {
     *     type: 'object',
     *     properties: {
     *       expression: {
     *         type: 'string',
     *         description: 'The expression to calculate'
     *       }
     *     },
     *     required: ['expression']
     *   }
     * });
     * ```
     */
    registerTool(name: string, definition: object): boolean;
    /**
     * Sends a tool response to the server.
     *
     * @param {string} toolCallId - Tool call ID
     * @param {any} response - Tool response
     * @returns {boolean} True if sent immediately, false if queued
     *
     * @example
     * ```typescript
     * api.sendToolResponse('tool-call-123', { result: 42 });
     * ```
     */
    sendToolResponse(toolCallId: string, response: any): boolean;
    /**
     * Sends a tool error to the server.
     *
     * @param {string} toolCallId - Tool call ID
     * @param {string} error - Error message
     * @returns {boolean} True if sent immediately, false if queued
     *
     * @example
     * ```typescript
     * api.sendToolError('tool-call-123', 'Invalid expression');
     * ```
     */
    sendToolError(toolCallId: string, error: string): boolean;
}

/**
 * Contains text and audio information about an item
 * Can also be used as a delta
 */
interface ItemContentDelta {
    text?: string;
    audio?: Int16Array;
    arguments?: string;
    transcript?: string;
    output?: string;
}
/**
 * Manages the state and events of a realtime conversation.
 * Handles conversation items, audio queuing, and event processing.
 *
 * @class RealtimeConversation
 */
declare class RealtimeConversation {
    /** Default audio sampling frequency in Hz */
    readonly defaultFrequency: number;
    /** Lookup for items by ID */
    private itemLookup;
    /** Array of conversation items */
    private items;
    /** Lookup for responses by ID */
    private responseLookup;
    /** Array of responses */
    private responses;
    /** Queued speech items by ID */
    private queuedSpeechItems;
    /** Queued transcript items by ID */
    private queuedTranscriptItems;
    /** Queued audio data for processing */
    private queuedInputAudio;
    /**
     * Creates a new RealtimeConversation instance.
     * Initializes empty conversation state.
     */
    constructor();
    /**
     * Clears the conversation history and resets to default
     * @returns {boolean} Always returns true
     */
    clear(): boolean;
    /**
     * Queues audio data for processing.
     *
     * @param {Int16Array} audio - Audio data to queue
     * @returns {Int16Array} The queued audio data
     */
    queueInputAudio(audio: Int16Array): Int16Array;
    /**
     * Process an event from the WebSocket server and compose items
     * @param {any} event - The event to process
     * @param {...any} args - Additional arguments
     * @returns {{ item: ItemType | null, delta: ItemContentDelta | null }} Processed item and delta
     */
    processEvent(event: any, ...args: any[]): {
        item: ItemType | null;
        delta: ItemContentDelta | null;
    };
    /**
     * Retrieves a item by id
     * @param {string} id - Item ID
     * @returns {ItemType | null} The item or null if not found
     */
    getItem(id: string): ItemType | null;
    /**
     * Gets all items in the conversation.
     *
     * @returns {ItemType[]} Array of all conversation items
     */
    getItems(): ItemType[];
    /**
     * Event processors for different event types
     * @private
     */
    private EventProcessors;
}

/**
 * High-level client for the Realtime API that manages conversations and tools.
 * Provides an interface for connecting to the API, managing conversations,
 * and handling tool registrations and executions.
 */
declare class RealtimeClient extends RealtimeEventHandler {
    protected realtime: RealtimeAPI;
    protected conversation: RealtimeConversation;
    protected tools: Record<string, {
        definition: ToolDefinition;
        handler: Function;
    }>;
    protected inputAudioBuffer: Int16Array;
    protected sessionCreated: boolean;
    protected config: RealtimeConfig;
    private _configWithMethods;
    /**
     * Creates a new RealtimeClient instance.
     *
     * @param {ClientOptions} [settings] - Configuration settings for the client
     * @param {RealtimeConfig | any} [config] - Optional configuration settings or config object with methods
     */
    constructor(settings?: ClientOptions, config?: Partial<RealtimeConfig> | any);
    /**
     * Listens for all events and forwards them to realtime.event with proper metadata
     * @private
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
     * @throws {Error} If the tool is not registered
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
        item: ItemType | null;
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
        item: ItemType | null;
    }>;
    protected getSessionPayload(): {
        session: RealtimeConfig;
    };
    /**
     * Updates the configuration with the provided partial config
     * @param {Partial<RealtimeConfig>} updates - Configuration updates to apply
     */
    updateConfig(updates: Partial<RealtimeConfig>): void;
    /**
     * Adds a tool to the configuration
     * @param {ToolDefinition} tool - Tool definition to add
     */
    addTool(tool: ToolDefinition): void;
    /**
     * Removes a tool from the configuration
     * @param {string} name - Name of the tool to remove
     */
    removeTool(name: string): void;
    /**
     * Gets all registered tools
     * @returns {ToolDefinition[]} Array of tool definitions
     */
    getTools(): ToolDefinition[];
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
     * Gets the turn detection type from config
     * @returns {string | null} Turn detection type or null
     */
    getTurnDetectionType(): string | null;
    /**
     * Send user message content to the realtime service
     * @param {Content[]} content - Content for the message
     * @returns {boolean} True if message was sent successfully
     */
    sendUserMessageContent(content: Content[]): boolean;
    /**
     * Appends user audio to the existing audio buffer
     * @param {Int16Array | ArrayBuffer} arrayBuffer - Audio data to append
     * @returns {boolean} Always returns true
     */
    appendInputAudio(arrayBuffer: Int16Array | ArrayBuffer): boolean;
    /**
     * Forces a model response generation
     * @returns {boolean} Always returns true
     */
    createResponse(): boolean;
    /**
     * Cancels the ongoing server generation and truncates ongoing generation, if applicable
     * If no id provided, will simply call `cancel_generation` command
     * @param {string} id - The id of the message to cancel
     * @param {number} [sampleCount=0] - The number of samples to truncate past for the ongoing generation
     * @returns {{ item: ItemType | null }} The canceled item or null
     */
    cancelResponse(id: string, sampleCount?: number): {
        item: ItemType | null;
    };
    /**
     * Gets an item from the conversation by ID
     * @private
     * @param {string} id - Item ID to find
     * @returns {ItemType | undefined} The found item or undefined
     */
    private getConversationItem;
}

/**
 * Basic utilities for the Realtime API
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

export { type AudioConfig, type AudioContent, type ClientOptions, type Content, type ContentBase, type ContentType, type ConversationEndEvent, type ConversationStartEvent, type ConversationState, type Event, type EventSource, type FormattedProperties, type ImageContent, type InputAudioContent, type InputTextContent, type ItemError, type ItemErrorEvent, type ItemEvent, type ItemStatus, type ItemType, type KnowledgeConfig, type ModelConfig, RealtimeAPI, RealtimeClient, type RealtimeConfig, RealtimeConversation, type RealtimeEvent, RealtimeEventHandler, RealtimeUtils, type SessionUpdateEvent, type TextContent, type TimestampedEvent, type ToolCallEvent, type ToolDefinition, type ToolRegisterEvent, type ToolRegistration, type ToolResponseEvent, type VisionConfig };
