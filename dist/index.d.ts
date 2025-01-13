import { WebSocket as WebSocket$1 } from 'ws';

interface ItemType {
    id: string;
    type: string;
    role: string;
    content: Array<{
        type: string;
        text?: string;
        audio?: string;
        transcript?: string;
    }>;
    status: 'completed' | 'in_progress';
    object: string;
}
interface ToolDefinitionType {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
interface AudioTranscriptionType {
    model: string;
}
interface TurnDetectionServerVadType {
    type: 'server_vad';
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
}
interface ResponseResourceType {
    type: string;
    data: any;
}
type AudioFormatType = "pcm16" | "g711_ulaw" | "g711_alaw";

type EventHandlerCallbackType = (event: Record<string, any>) => void;
declare class RealtimeEventHandler {
    private eventHandlers;
    private nextEventHandlers;
    clearEventHandlers(): true;
    on(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType;
    onNext(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType;
    off(eventName: string, callback?: EventHandlerCallbackType): true;
    offNext(eventName: string, callback?: EventHandlerCallbackType): true;
    waitForNext(eventName: string, timeout?: number | null): Promise<Record<string, any> | null>;
    protected emit(eventName: string, event: any): true;
}

type WebSocketType = WebSocket$1 | WebSocket;
interface RealtimeAPISettings {
    url?: string;
    apiKey?: string;
    dangerouslyAllowAPIKeyInBrowser?: boolean;
    debug?: boolean;
}
declare class RealtimeAPI extends RealtimeEventHandler {
    private defaultUrl;
    private url;
    readonly apiKey: string | null;
    private debug;
    private ws;
    constructor(settings?: RealtimeAPISettings);
    isConnected(): boolean;
    private log;
    connect(settings?: {
        model?: string;
    }): Promise<true>;
    disconnect(ws?: WebSocketType): true;
    private receive;
    send(eventName: string, data?: Record<string, any>): true;
    private generateId;
    waitForNext(eventName: string, timeout?: number): Promise<any>;
}

declare class RealtimeConversation {
    private items;
    private currentItemId;
    private queuedAudio;
    readonly defaultFrequency: number;
    constructor();
    addItem(item: ItemType): void;
    getCurrentItem(): ItemType | null;
    getItems(): ItemType[];
    clear(): void;
    updateItem(itemId: string, updates: Partial<ItemType>): void;
    queueInputAudio(audio: Int16Array): void;
    getQueuedAudio(): Int16Array | null;
    clearQueuedAudio(): void;
    processEvent(event: string, ...args: any[]): {
        item: ItemType | null;
        delta: any;
    };
    private encodeAudioToBase64;
}

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
interface AudioConfig {
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: any | null;
    turn_detection: any | null;
}
declare abstract class ConfigManager {
    protected config: any;
    abstract updateConfig(updates: Partial<any>): void;
    abstract getSessionPayload(): any;
    abstract reset(): void;
}

interface RealtimeClientSettings {
    url?: string;
    apiKey?: string;
    dangerouslyAllowAPIKeyInBrowser?: boolean;
    debug?: boolean;
}
declare class RealtimeClient extends RealtimeEventHandler {
    protected configManager: ConfigManager;
    protected realtime: RealtimeAPI;
    protected conversation: RealtimeConversation;
    protected tools: Record<string, {
        definition: ToolDefinitionType;
        handler: Function;
    }>;
    constructor(settings?: RealtimeClientSettings);
    private _addAPIEventHandlers;
    connect(): Promise<void>;
    disconnect(): void;
    isConnected(): boolean;
    protected updateSession(): void;
    reset(): void;
    registerTool(definition: ToolDefinitionType, handler: Function): void;
    unregisterTool(name: string): void;
    executeTool(name: string, args: Record<string, any>): Promise<any>;
    waitForNextItem(): Promise<{
        item: null;
    } | {
        item: ItemType;
    }>;
    waitForNextCompletedItem(): Promise<{
        item: null;
    } | {
        item: ItemType;
    }>;
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

interface OpenAIConfig$1 {
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
declare class OpenAIConfigManager extends ConfigManager {
    config: OpenAIConfig$1;
    constructor();
    reset(): void;
    updateConfig(updates: Partial<OpenAIConfig$1>): void;
    getSessionPayload(): {
        session: OpenAIConfig$1;
    };
}

declare class OpenAIRealtimeClient extends RealtimeClient {
    protected configManager: OpenAIConfigManager;
    constructor(settings?: RealtimeClientSettings);
    updateConfig(updates: Partial<OpenAIConfig$1>): void;
}

type OpenaiVoiceType = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";
interface OpenaiToolDefinitionType extends ToolDefinitionType {
    type: 'function';
}
interface OpenAIConfig extends BaseConfig, AudioConfig {
    voice: OpenaiVoiceType;
    input_audio_transcription: AudioTranscriptionType | null;
    turn_detection: TurnDetectionServerVadType | null;
    tools: OpenaiToolDefinitionType[];
}

export { type AudioFormatType, type AudioTranscriptionType, type ItemType, type OpenAIConfig, OpenAIRealtimeClient, type OpenaiToolDefinitionType, type OpenaiVoiceType, RealtimeAPI, RealtimeClient, type RealtimeClientSettings, RealtimeConversation, RealtimeEventHandler, RealtimeUtils, type ResponseResourceType, type ToolDefinitionType, type TurnDetectionServerVadType };
