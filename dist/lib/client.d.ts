/**
 * Valid audio formats
 * @typedef {"pcm16"|"g711_ulaw"|"g711_alaw"} AudioFormatType
 */
/**
 * @typedef {Object} AudioTranscriptionType
 * @property {"whisper-1"} model
 */
/**
 * @typedef {Object} TurnDetectionServerVadType
 * @property {"server_vad"} type
 * @property {number} [threshold]
 * @property {number} [prefix_padding_ms]
 * @property {number} [silence_duration_ms]
 */

/**
 * Tool parameter definition
 * @typedef {Object} ToolParameterType
 * @property {string} type
 * @property {string} description
 */

/**
 * Tool definitions
 * @typedef {Object} ToolDefinitionType
 * @property {"function"} type
 * @property {string} [id]
 * @property {string} name
 * @property {string} description
 * @property {{
*   type: "object",
*   properties: Record<string, ToolParameterType>
* }} parameters
* @property {string[]} required
* @property {"client_mode"|"server_mode"} operation_mode
* @property {"synchronous"|"asynchronous"} execution_type
* @property {"process_in_llm"|"process_in_client"|"ignore_result"} result_handling
* @property {string} code
* @property {"python"|"shell"} language
* @property {"linux"|"macos"|"windows"} platform
*/
/**
 * @typedef {Object} SessionResourceType
 * @property {string} [model]
 * @property {string[]} [modalities]
 * @property {string} [instructions]
 * @property {"alloy"|"ash"|"ballad"|"coral"|"echo"|"sage"|"shimmer"|"verse"} [voice]
 * @property {AudioFormatType} [input_audio_format]
 * @property {AudioFormatType} [output_audio_format]
 * @property {AudioTranscriptionType|null} [input_audio_transcription]
 * @property {TurnDetectionServerVadType|null} [turn_detection]
 * @property {ToolDefinitionType[]} [tools]
 * @property {"auto"|"none"|"required"|{type:"function",name:string}} [tool_choice]
 * @property {number} [temperature]
 * @property {number|"inf"} [max_response_output_tokens]
 */
/**
 * @typedef {"in_progress"|"completed"|"incomplete"} ItemStatusType
 */
/**
 * @typedef {Object} InputTextContentType
 * @property {"input_text"} type
 * @property {string} text
 */
/**
 * @typedef {Object} InputAudioContentType
 * @property {"input_audio"} type
 * @property {string} [audio] base64-encoded audio data
 * @property {string|null} [transcript]
 */
/**
 * @typedef {Object} TextContentType
 * @property {"text"} type
 * @property {string} text
 */
/**
 * @typedef {Object} AudioContentType
 * @property {"audio"} type
 * @property {string} [audio] base64-encoded audio data
 * @property {string|null} [transcript]
 */
/**
 * @typedef {Object} SystemItemType
 * @property {string|null} [previous_item_id]
 * @property {"message"} type
 * @property {ItemStatusType} status
 * @property {"system"} role
 * @property {Array<InputTextContentType>} content
 */
/**
 * @typedef {Object} UserItemType
 * @property {string|null} [previous_item_id]
 * @property {"message"} type
 * @property {ItemStatusType} status
 * @property {"user"} role
 * @property {Array<InputTextContentType|InputAudioContentType>} content
 */
/**
 * @typedef {Object} AssistantItemType
 * @property {string|null} [previous_item_id]
 * @property {"message"} type
 * @property {ItemStatusType} status
 * @property {"assistant"} role
 * @property {Array<TextContentType|AudioContentType>} content
 */
/**
 * @typedef {Object} FunctionCallItemType
 * @property {string|null} [previous_item_id]
 * @property {"function_call"} type
 * @property {ItemStatusType} status
 * @property {string} call_id
 * @property {string} name
 * @property {string} arguments
 */
/**
 * @typedef {Object} FunctionCallOutputItemType
 * @property {string|null} [previous_item_id]
 * @property {"function_call_output"} type
 * @property {string} call_id
 * @property {string} output
 */
/**
 * @typedef {Object} FormattedToolType
 * @property {"function"} type
 * @property {string} name
 * @property {string} call_id
 * @property {string} arguments
 */
/**
 * @typedef {Object} FormattedPropertyType
 * @property {Int16Array} [audio]
 * @property {string} [text]
 * @property {string} [transcript]
 * @property {FormattedToolType} [tool]
 * @property {string} [output]
 * @property {any} [file]
 */
/**
 * @typedef {Object} FormattedItemType
 * @property {string} id
 * @property {string} object
 * @property {"user"|"assistant"|"system"} [role]
 * @property {FormattedPropertyType} formatted
 */
/**
 * @typedef {SystemItemType|UserItemType|AssistantItemType|FunctionCallItemType|FunctionCallOutputItemType} BaseItemType
 */
/**
 * @typedef {FormattedItemType & BaseItemType} ItemType
 */
/**
 * @typedef {Object} IncompleteResponseStatusType
 * @property {"incomplete"} type
 * @property {"interruption"|"max_output_tokens"|"content_filter"} reason
 */
/**
 * @typedef {Object} FailedResponseStatusType
 * @property {"failed"} type
 * @property {{code: string, message: string}|null} error
 */
/**
 * @typedef {Object} UsageType
 * @property {number} total_tokens
 * @property {number} input_tokens
 * @property {number} output_tokens
 */
/**
 * @typedef {Object} ResponseResourceType
 * @property {"in_progress"|"completed"|"incomplete"|"cancelled"|"failed"} status
 * @property {IncompleteResponseStatusType|FailedResponseStatusType|null} status_details
 * @property {ItemType[]} output
 * @property {UsageType|null} usage
 */
/**
 * RealtimeClient Class
 * @class
 */
export class RealtimeClient extends RealtimeEventHandler {
    /**
     * Create a new RealtimeClient instance
     * @param {{url?: string, apiKey?: string, dangerouslyAllowAPIKeyInBrowser?: boolean, debug?: boolean}} [settings]
     */
    constructor({ url, apiKey, dangerouslyAllowAPIKeyInBrowser, debug }?: {
        url?: string;
        apiKey?: string;
        dangerouslyAllowAPIKeyInBrowser?: boolean;
        debug?: boolean;
    });
    defaultSessionConfig: {
        modalities: string[];
        instructions: string;
        voice: string;
        input_audio_format: string;
        output_audio_format: string;
        input_audio_transcription: any;
        turn_detection: any;
        tools: any[];
        tool_choice: string;
        temperature: number;
        max_response_output_tokens: number;
    };
    sessionConfig: {};
    transcriptionModels: {
        model: string;
    }[];
    defaultServerVadConfig: {
        type: string;
        threshold: number;
        prefix_padding_ms: number;
        silence_duration_ms: number;
    };
    realtime: RealtimeAPI;
    conversation: RealtimeConversation;
    /**
     * Resets sessionConfig and conversationConfig to default
     * @private
     * @returns {true}
     */
    private _resetConfig;
    sessionCreated: boolean;
    tools: {};
    inputAudioBuffer: any;
    /**
     * Sets up event handlers for a fully-functional application control flow
     * @private
     * @returns {true}
     */
    private _addAPIEventHandlers;
    /**
     * Tells us whether the realtime socket is connected and the session has started
     * @returns {boolean}
     */
    isConnected(): boolean;
    /**
     * Resets the client instance entirely: disconnects and clears active config
     * @returns {true}
     */
    reset(): true;
    /**
     * Connects to the Realtime WebSocket API
     * Updates session config and conversation config
     * @returns {Promise<true>}
     */
    connect(): Promise<true>;
    /**
     * Waits for a session.created event to be executed before proceeding
     * @returns {Promise<true>}
     */
    waitForSessionCreated(): Promise<true>;
    /**
     * Disconnects from the Realtime API and clears the conversation history
     */
    disconnect(): void;
    /**
     * Gets the active turn detection mode
     * @returns {"server_vad"|null}
     */
    getTurnDetectionType(): "server_vad" | null;
    /**
     * Add a tool and handler
     * @param {ToolDefinitionType} definition
     * @param {function} handler
     * @returns {{definition: ToolDefinitionType, handler: function}}
     */
    addTool(definition: ToolDefinitionType, handler: Function): {
        definition: ToolDefinitionType;
        handler: Function;
    };
    /**
     * Removes a tool
     * @param {string} name
     * @returns {true}
     */
    removeTool(name: string): true;
    /**
     * Deletes an item
     * @param {string} id
     * @returns {true}
     */
    deleteItem(id: string): true;
    /**
     * Updates session configuration based on config type
     * @param {StardustConfigType|OpenaiConfigType} [sessionConfig]
     * @param {'stardust'|'openai'} [configType='stardust']
     */
    updateSession(sessionConfig?: StardustConfigType | OpenaiConfigType, configType?: 'stardust' | 'openai'): boolean;

    /**
     * Updates stardust session configuration
     * @param {StardustConfigType} [sessionConfig]
     */
    updateStardustSession(sessionConfig?: StardustConfigType): boolean;

    /**
     * Updates openai session configuration
     * @param {OpenaiConfigType} [sessionConfig]
     */
    updateOpenaiSession(sessionConfig?: OpenaiConfigType): boolean;
    /**
     * Sends user message content and generates a response
     * @param {Array<InputTextContentType|InputAudioContentType>} content
     * @returns {true}
     */
    sendUserMessageContent(content?: Array<InputTextContentType | InputAudioContentType>): true;
    /**
     * Appends user audio to the existing audio buffer
     * @param {Int16Array|ArrayBuffer} arrayBuffer
     * @returns {true}
     */
    appendInputAudio(arrayBuffer: Int16Array | ArrayBuffer): true;
    /**
     * Forces a model response generation
     * @returns {true}
     */
    createResponse(): true;
    /**
     * Cancels the ongoing server generation and truncates ongoing generation, if applicable
     * If no id provided, will simply call `cancel_generation` command
     * @param {string} id The id of the message to cancel
     * @param {number} [sampleCount] The number of samples to truncate past for the ongoing generation
     * @returns {{item: (AssistantItemType | null)}}
     */
    cancelResponse(id: string, sampleCount?: number): {
        item: (AssistantItemType | null);
    };
    /**
     * Utility for waiting for the next `conversation.item.appended` event to be triggered by the server
     * @returns {Promise<{item: ItemType}>}
     */
    waitForNextItem(): Promise<{
        item: ItemType;
    }>;
    /**
     * Utility for waiting for the next `conversation.item.completed` event to be triggered by the server
     * @returns {Promise<{item: ItemType}>}
     */
    waitForNextCompletedItem(): Promise<{
        item: ItemType;
    }>;
}
/**
 * Valid audio formats
 */
export type AudioFormatType = "pcm16" | "g711_ulaw" | "g711_alaw";
export type AudioTranscriptionType = {
    model: "whisper-1";
};
export type TurnDetectionServerVadType = {
    type: "server_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
};

export type ToolParameterType = {
    type: string;
    description: string;
};

/**
 * Tool definitions
 */
export type ToolDefinitionType = {
    type: "function";
    id?: string;
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, ToolParameterType>;
    };
    required: string[];
    operation_mode: "client_mode" | "server_mode";
    execution_type: "synchronous" | "asynchronous";
    result_handling: "process_in_llm" | "process_in_client" | "ignore_result";
    code: string;
    language: "python" | "shell";
    platform: "linux" | "macos" | "windows";
};

export type SessionResourceType = {
    model?: string;
    modalities?: string[];
    instructions?: string;
    voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";

    input_audio_format?: AudioFormatType;
    output_audio_format?: AudioFormatType;
    input_audio_transcription?: AudioTranscriptionType | null;
    turn_detection?: TurnDetectionServerVadType | null;
    tools?: ToolDefinitionType[];
    tool_choice?: "auto" | "none" | "required" | {
        type: "function";
        name: string;
    };
    temperature?: number;
    max_response_output_tokens?: number | "inf";
};
export type ItemStatusType = "in_progress" | "completed" | "incomplete";
export type InputTextContentType = {
    type: "input_text";
    text: string;
};
export type InputAudioContentType = {
    type: "input_audio";
    /**
     * base64-encoded audio data
     */
    audio?: string;
    transcript?: string | null;
};
export type TextContentType = {
    type: "text";
    text: string;
};
export type AudioContentType = {
    type: "audio";
    /**
     * base64-encoded audio data
     */
    audio?: string;
    transcript?: string | null;
};
export type SystemItemType = {
    previous_item_id?: string | null;
    type: "message";
    status: ItemStatusType;
    role: "system";
    content: Array<InputTextContentType>;
};
export type UserItemType = {
    previous_item_id?: string | null;
    type: "message";
    status: ItemStatusType;
    role: "user";
    content: Array<InputTextContentType | InputAudioContentType>;
};
export type AssistantItemType = {
    previous_item_id?: string | null;
    type: "message";
    status: ItemStatusType;
    role: "assistant";
    content: Array<TextContentType | AudioContentType>;
};
export type FunctionCallItemType = {
    previous_item_id?: string | null;
    type: "function_call";
    status: ItemStatusType;
    call_id: string;
    name: string;
    arguments: string;
};
export type FunctionCallOutputItemType = {
    previous_item_id?: string | null;
    type: "function_call_output";
    call_id: string;
    output: string;
};
export type FormattedToolType = {
    type: "function";
    name: string;
    call_id: string;
    arguments: string;
};
export type FormattedPropertyType = {
    audio?: Int16Array;
    text?: string;
    transcript?: string;
    tool?: FormattedToolType;
    output?: string;
    file?: any;
};
export type FormattedItemType = {
    id: string;
    object: string;
    role?: "user" | "assistant" | "system";
    formatted: FormattedPropertyType;
};
export type BaseItemType = SystemItemType | UserItemType | AssistantItemType | FunctionCallItemType | FunctionCallOutputItemType;
export type ItemType = FormattedItemType & BaseItemType;
export type IncompleteResponseStatusType = {
    type: "incomplete";
    reason: "interruption" | "max_output_tokens" | "content_filter";
};
export type FailedResponseStatusType = {
    type: "failed";
    error: {
        code: string;
        message: string;
    } | null;
};
export type UsageType = {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
};
export type ResponseResourceType = {
    status: "in_progress" | "completed" | "incomplete" | "cancelled" | "failed";
    status_details: IncompleteResponseStatusType | FailedResponseStatusType | null;
    output: ItemType[];
    usage: UsageType | null;
};

export type StardustModelType = {
    provider?: string;
    name?: string;
    modalities?: string[];
    instructions?: string;
    tools?: ToolDefinitionType[];
    tool_choice?: "auto" | "none" | "required" | {
        type: "function";
        name: string;
    };
    temperature?: number;
    max_response_output_tokens?: number | "inf";
    api_key?: string;
};

export type StardustSpeechType = {
    voice?: string;
    output_audio_format?: string;
    speed_ratio?: number;
    volume_ratio?: number;
    pitch_ratio?: number;
};

export type StardustHearingType = {
    input_audio_format?: string;
    input_audio_transcription?: AudioTranscriptionType | null;
    turn_detection?: TurnDetectionServerVadType | null;
};

export type StardustVisionType = {
    enable_face_detection?: boolean;
    enable_object_detection?: boolean;
    enable_face_identification?: boolean;
    object_detection_target_classes?: string[];
};

export type MessageResponse = {
    id: string;
    type: 'message';
    message: string; // The response content, either texts or predefined actions
};

export type FunctionResponse = {
    id: string;
    type: 'function';
    function: string;
};

export type DialogueResponse = MessageResponse | FunctionResponse;

/**
 * Represents a mapping between a human's input and the robot's possible responses.
 * When a human's question matches the prompt (using vector similarity),
 * the robot will use one of the responses as its guided answer.
 */
export type Dialogue = {
    id: string;
    prompts: string[]; // The human's input/question that prompts this response
    responses: DialogueResponse[]; // Array of possible response sequences. Each sequence contains one or more sentences.
};

/**
 * A script is a collection of predefined dialogues that guide
 * how the robot should respond to specific human inputs.
 */
export type Script = {
    id: string;
    name: string;
    description: string;
    priority?: number; // Higher priority scripts take precedence when multiple matches are found
    tags: string[]; // Tags help categorize scripts by topics or scenarios
    dialogues: Dialogue[]; // The dialogues in this script
};

export type StardustKnowledgeType = {
    scripts?: Script[];
};

export type StardustConfigType = {
    model: StardustModelType;
    speech?: StardustSpeechType;
    hearing?: StardustHearingType;
    vision?: StardustVisionType;
    knowledge?: StardustKnowledgeType;
};

export type OpenaiConfigType = {
    modalities?: string[];
    instructions?: string;
    voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";
    input_audio_format?: AudioFormatType;
    output_audio_format?: AudioFormatType;
    input_audio_transcription?: AudioTranscriptionType | null;
    turn_detection?: TurnDetectionServerVadType | null;
    tools?: {
        type: "function";
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, ToolParameterType>;
        };
    }[];
    tool_choice?: "auto" | "none" | "required" | {
        type: "function";
        name: string;
    };
    temperature?: number;
    max_response_output_tokens?: number | "inf";
};

import { RealtimeEventHandler } from './event_handler.js';
import { RealtimeAPI } from './api.js';
import { RealtimeConversation } from './conversation.js';
//# sourceMappingURL=client.d.ts.map
