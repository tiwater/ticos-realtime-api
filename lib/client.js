import { RealtimeEventHandler } from './event_handler.js';
import { RealtimeAPI } from './api.js';
import { RealtimeConversation } from './conversation.js';
import { RealtimeUtils } from './utils.js';

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
 * OpenAI Tool parameter definition
 * @typedef {Object} OpenaiToolParameterType
 * @property {string} type
 * @property {string} description
 */

/**
 * OpenAI Tool definitions - simplified version of ToolDefinitionType for OpenAI compatibility
 * @typedef {Object} OpenaiToolDefinitionType
 * @property {"function"} type
 * @property {string} name
 * @property {string} description
 * @property {{
*   type: "object",
*   properties: Record<string, OpenaiToolParameterType>
*   required?: string[]
* }} parameters
*/
/**
 * @typedef {Object} OpenaiConfigType
 * @property {string[]} [modalities]
 * @property {string} [instructions]
 * @property {"alloy"|"ash"|"ballad"|"coral"|"echo"|"sage"|"shimmer"|"verse"} [voice]
 * @property {AudioFormatType} [input_audio_format]
 * @property {AudioFormatType} [output_audio_format]
 * @property {AudioTranscriptionType|null} [input_audio_transcription]
 * @property {TurnDetectionServerVadType|null} [turn_detection]
 * @property {OpenaiToolDefinitionType[]} [tools]
 * @property {"auto"|"none"|"required"|{type:"function",name:string}} [tool_choice]
 * @property {number} [temperature]
 * @property {number|"inf"} [max_response_output_tokens]
 */

/**
 * @typedef {Object} StardustModelType
 * @property {string} [provider]
 * @property {string} [name]
 * @property {string[]} [modalities]
 * @property {string} [instructions]
 * @property {ToolDefinitionType[]} [tools]
 * @property {"auto"|"none"|"required"|{type:"function",name:string}} [tool_choice]
 * @property {number} [temperature]
 * @property {number|"inf"} [max_response_output_tokens]
 */

/**
 * @typedef {Object} StardustSpeechType
 * @property {"alloy"|"ash"|"ballad"|"coral"|"echo"|"sage"|"shimmer"|"verse"} [voice]
 * @property {AudioFormatType} [output_audio_format]
 */

/**
 * @typedef {Object} StardustHearingType
 * @property {AudioFormatType} [input_audio_format]
 * @property {AudioTranscriptionType|null} [input_audio_transcription]
 * @property {TurnDetectionServerVadType|null} [turn_detection]
 */

/**
 * @typedef {Object} StardustVisionType
 * @property {boolean} [enable_face_detection]
 * @property {boolean} [enable_object_detection]
 * @property {boolean} [enable_face_identification]
 * @property {string[]} [object_detection_target_classes]
 */

/**
 * @typedef {Object} StardustConfigType
 * @property {StardustModelType} [model]
 * @property {StardustSpeechType} [speech]
 * @property {StardustVisionType} [vision]
 * @property {StardustHearingType} [hearing]
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
  constructor({ url, apiKey, dangerouslyAllowAPIKeyInBrowser, debug } = {}) {
    super();
    this.defaultOpenaiConfig = {
      modalities: ['text', 'audio'],
      instructions: '',
      voice: 'verse',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: null,
      turn_detection: null,
      tools: [],
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096,
    };

    this.defaultStardustConfig = {
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
    };

    this.openaiConfig = {};
    this.stardustConfig = {};
    this.activeConfigType = 'stardust'; // 'openai' or 'stardust'

    this.transcriptionModels = [
      {
        model: 'whisper-1',
      },
    ];
    this.defaultServerVadConfig = {
      type: 'server_vad',
      threshold: 0.5, // 0.0 to 1.0,
      prefix_padding_ms: 300, // How much audio to include in the audio stream before the speech starts.
      silence_duration_ms: 200, // How long to wait to mark the speech as stopped.
    };
    this.realtime = new RealtimeAPI({
      url,
      apiKey,
      dangerouslyAllowAPIKeyInBrowser,
      debug,
    });
    this.conversation = new RealtimeConversation();
    this._resetConfig();
    this._addAPIEventHandlers();
  }

  /**
   * Resets sessionConfig and conversationConfig to default
   * @private
   * @returns {true}
   */
  _resetConfig() {
    this.sessionCreated = false;
    this.tools = {};
    this.openaiConfig = JSON.parse(JSON.stringify(this.defaultOpenaiConfig));
    this.stardustConfig = JSON.parse(JSON.stringify(this.defaultStardustConfig));
    this.activeConfigType = 'stardust';
    this.inputAudioBuffer = new Int16Array(0);
    return true;
  }

  /**
   * Sets up event handlers for a fully-functional application control flow
   * @private
   * @returns {true}
   */
  _addAPIEventHandlers() {
    // Event Logging handlers
    this.realtime.on('client.*', (event) => {
      const realtimeEvent = {
        time: new Date().toISOString(),
        source: 'client',
        event: event,
      };
      this.dispatch('realtime.event', realtimeEvent);
    });
    this.realtime.on('server.*', (event) => {
      const realtimeEvent = {
        time: new Date().toISOString(),
        source: 'server',
        event: event,
      };
      this.dispatch('realtime.event', realtimeEvent);
    });

    // Handles session created event, can optionally wait for it
    this.realtime.on(
      'server.session.created',
      () => (this.sessionCreated = true),
    );

    // Setup for application control flow
    const handler = (event, ...args) => {
      try {
        const { item, delta } = this.conversation.processEvent(event, ...args);
        return { item, delta };
      } catch (e) {
        console.warn(`Error handling event:`, e);
      }
      return { item: null, delta: null };
    };
    const handlerWithDispatch = (event, ...args) => {
      const { item, delta } = handler(event, ...args);
      if (item) {
        // FIXME: If statement is only here because item.input_audio_transcription.completed
        //        can fire before `item.created`, resulting in empty item.
        //        This happens in VAD mode with empty audio
        this.dispatch('conversation.updated', { item, delta });
      }
      return { item, delta };
    };
    const callTool = async (tool) => {
      try {
        const jsonArguments = JSON.parse(tool.arguments);
        const toolConfig = this.tools[tool.name];
        if (!toolConfig) {
          throw new Error(`Tool "${tool.name}" has not been defined`);
        }
        const result = await toolConfig.handler(jsonArguments);
        this.realtime.send('conversation.item.create', {
          item: {
            type: 'function_call_output',
            call_id: tool.call_id,
            output: JSON.stringify(result),
          },
        });
      } catch (e) {
        this.realtime.send('conversation.item.create', {
          item: {
            type: 'function_call_output',
            call_id: tool.call_id,
            output: JSON.stringify({ error: e.message }),
          },
        });
      }
      this.createResponse();
    };

    // Handlers to update internal conversation state
    this.realtime.on('server.response.created', handler);
    this.realtime.on('server.response.output_item.added', handler);
    this.realtime.on('server.response.content_part.added', handler);
    this.realtime.on('server.input_audio_buffer.speech_started', (event) => {
      handler(event);
      this.dispatch('conversation.interrupted');
    });
    this.realtime.on('server.input_audio_buffer.speech_stopped', (event) =>
      handler(event, this.inputAudioBuffer),
    );

    // Handlers to update application state
    this.realtime.on('server.conversation.item.created', (event) => {
      const { item } = handlerWithDispatch(event);
      this.dispatch('conversation.item.appended', { item });
      if (item.status === 'completed') {
        this.dispatch('conversation.item.completed', { item });
      }
    });
    this.realtime.on('server.conversation.item.truncated', handlerWithDispatch);
    this.realtime.on('server.conversation.item.deleted', handlerWithDispatch);
    this.realtime.on(
      'server.conversation.item.input_audio_transcription.completed',
      handlerWithDispatch,
    );
    this.realtime.on(
      'server.response.audio_transcript.delta',
      handlerWithDispatch,
    );
    this.realtime.on('server.response.audio.delta', handlerWithDispatch);
    this.realtime.on('server.response.text.delta', handlerWithDispatch);
    this.realtime.on(
      'server.response.function_call_arguments.delta',
      handlerWithDispatch,
    );
    this.realtime.on('server.response.output_item.done', async (event) => {
      const { item } = handlerWithDispatch(event);
      if (item?.status === 'completed') {
        this.dispatch('conversation.item.completed', { item });
      }
      if (item?.formatted?.tool) {
        callTool(item.formatted.tool);
      }
    });

    return true;
  }

  /**
   * Tells us whether the realtime socket is connected and the session has started
   * @returns {boolean}
   */
  isConnected() {
    return this.realtime.isConnected();
  }

  /**
   * Resets the client instance entirely: disconnects and clears active config
   * @returns {true}
   */
  reset() {
    this.disconnect();
    this.clearEventHandlers();
    this.realtime.clearEventHandlers();
    this._resetConfig();
    this._addAPIEventHandlers();
    return true;
  }

  /**
   * Connects to the Realtime WebSocket API
   * Updates session config and conversation config
   * @returns {Promise<true>}
   */
  async connect() {
    if (this.isConnected()) {
      throw new Error(`Already connected, use .disconnect() first`);
    }
    await this.realtime.connect();
    this.updateSession();
    return true;
  }

  /**
   * Waits for a session.created event to be executed before proceeding
   * @returns {Promise<true>}
   */
  async waitForSessionCreated() {
    if (!this.isConnected()) {
      throw new Error(`Not connected, use .connect() first`);
    }
    while (!this.sessionCreated) {
      await new Promise((r) => setTimeout(() => r(), 1));
    }
    return true;
  }

  /**
   * Disconnects from the Realtime API and clears the conversation history
   */
  disconnect() {
    this.sessionCreated = false;
    this.realtime.isConnected() && this.realtime.disconnect();
    this.conversation.clear();
  }

  /**
   * Gets the active turn detection mode
   * @returns {"server_vad"|null}
   */
  getTurnDetectionType() {
    if (this.activeConfigType === 'openai') {
      return this.openaiConfig.turn_detection?.type || null;
    } else if (this.activeConfigType === 'stardust') {
      return this.stardustConfig.hearing?.turn_detection?.type || null;
    } else {
      return null;
    }
  }

  /**
   * Add a tool and handler
   * @param {ToolDefinitionType} definition
   * @param {function} handler
   * @returns {{definition: ToolDefinitionType, handler: function}}
   */
  addTool(definition, handler) {
    if (!definition?.name) {
      throw new Error(`Missing tool name in definition`);
    }
    const name = definition?.name;
    if (this.tools[name]) {
      throw new Error(
        `Tool "${name}" already added. Please use .removeTool("${name}") before trying to add again.`,
      );
    }
    if (typeof handler !== 'function') {
      throw new Error(`Tool "${name}" handler must be a function`);
    }
    this.tools[name] = { definition, handler };
    this.updateSession();
    return this.tools[name];
  }

  /**
   * Removes a tool
   * @param {string} name
   * @returns {true}
   */
  removeTool(name) {
    if (!this.tools[name]) {
      throw new Error(`Tool "${name}" does not exist, can not be removed.`);
    }
    delete this.tools[name];
    return true;
  }

  /**
   * Deletes an item
   * @param {string} id
   * @returns {true}
   */
  deleteItem(id) {
    this.realtime.send('conversation.item.delete', { item_id: id });
    return true;
  }

  /**
   * Updates session configuration based on config type
   * @param {StardustConfigType|OpenaiConfigType} [sessionConfig]
   * @param {'stardust'|'openai'} [configType='stardust']
   */
  updateSession(sessionConfig, configType) {
    console.log(`Updating session with config:`, sessionConfig, configType);
    if (configType) {
      this.activeConfigType = configType;
    }

    // If no sessionConfig provided, use current config
    if (!sessionConfig) {
      if (this.activeConfigType === 'stardust') {
        if (this.realtime.isConnected()) {
          this.realtime.send('session.update', { session: this.stardustConfig });
        }
        return;
      } else {
        if (this.realtime.isConnected()) {
          const session = { ...this.openaiConfig };
          session.tools = this.openaiConfig.tools || [];
          this.realtime.send('session.update', { session });
        }
        return;
      }
    }

    if (this.activeConfigType === 'stardust') {
      this.updateStardustSession(sessionConfig);
    } else {
      this.updateOpenaiSession(sessionConfig);
    }
  }

  /**
   * Updates stardust session configuration
   * @param {StardustConfigType} [sessionConfig]
   */
  updateStardustSession(sessionConfig) {
    if (!sessionConfig) {
      return;
    }

    // Update model configurations
    if (sessionConfig.model) {
      const { model } = sessionConfig;
      if (!this.stardustConfig.model) this.stardustConfig.model = {};

      model.provider !== void 0 && (this.stardustConfig.model.provider = model.provider);
      model.name !== void 0 && (this.stardustConfig.model.name = model.name);
      model.modalities !== void 0 && (this.stardustConfig.model.modalities = model.modalities);
      model.instructions !== void 0 && (this.stardustConfig.model.instructions = model.instructions);
      model.tools !== void 0 && (this.stardustConfig.model.tools = model.tools);
      model.tool_choice !== void 0 && (this.stardustConfig.model.tool_choice = model.tool_choice);
      model.temperature !== void 0 && (this.stardustConfig.model.temperature = model.temperature);
      model.max_response_output_tokens !== void 0 && (this.stardustConfig.model.max_response_output_tokens = model.max_response_output_tokens);
    }

    // Update speech configurations
    if (sessionConfig.speech) {
      const { speech } = sessionConfig;
      if (!this.stardustConfig.speech) this.stardustConfig.speech = {};

      speech.voice !== void 0 && (this.stardustConfig.speech.voice = speech.voice);
      speech.output_audio_format !== void 0 && (this.stardustConfig.speech.output_audio_format = speech.output_audio_format);
      speech.speed_ratio !== void 0 && (this.stardustConfig.speech.speed_ratio = speech.speed_ratio);
      speech.pitch_ratio !== void 0 && (this.stardustConfig.speech.pitch_ratio = speech.pitch_ratio);
      speech.volume_ratio !== void 0 && (this.stardustConfig.speech.volume_ratio = speech.volume_ratio);
    }

    // Update hearing configurations
    if (sessionConfig.hearing) {
      const { hearing } = sessionConfig;
      if (!this.stardustConfig.hearing) this.stardustConfig.hearing = {};

      hearing.input_audio_format !== void 0 && (this.stardustConfig.hearing.input_audio_format = hearing.input_audio_format);
      hearing.input_audio_transcription !== void 0 && (this.stardustConfig.hearing.input_audio_transcription = hearing.input_audio_transcription);
      hearing.turn_detection !== void 0 && (this.stardustConfig.hearing.turn_detection = hearing.turn_detection);
    }

    // Update vision configurations
    if (sessionConfig.vision) {
      const { vision } = sessionConfig;
      if (!this.stardustConfig.vision) this.stardustConfig.vision = {};

      vision.enable_face_detection !== void 0 && (this.stardustConfig.vision.enable_face_detection = vision.enable_face_detection);
      vision.enable_object_detection !== void 0 && (this.stardustConfig.vision.enable_object_detection = vision.enable_object_detection);
      vision.enable_face_identification !== void 0 && (this.stardustConfig.vision.enable_face_identification = vision.enable_face_identification);
      vision.object_detection_target_classes !== void 0 && (this.stardustConfig.vision.object_detection_target_classes = vision.object_detection_target_classes);
    }

    // Update knowledge
    if (sessionConfig.knowledge) {
      this.stardustConfig.knowledge = sessionConfig.knowledge;
    }

    // Handle tools
    if (sessionConfig.model?.tools) {
      const useTools = [].concat(
        sessionConfig.model.tools.map((toolDefinition) => {
          const definition = {
            type: 'function',
            ...toolDefinition,
          };
          if (this.tools[definition?.name]) {
            throw new Error(`Tool "${definition?.name}" has already been defined`);
          }
          return definition;
        }),
        Object.keys(this.tools).map((key) => {
          return {
            type: 'function',
            ...this.tools[key].definition,
          };
        })
      );
      this.stardustConfig.model.tools = useTools;
    }

    if (this.realtime.isConnected()) {
      this.realtime.send('session.update', { session: this.stardustConfig });
    }
  }

  /**
   * Updates session configuration
   * If the client is not yet connected, will save details and instantiate upon connection
   * @param {OpenaiConfigType} [sessionConfig]
   */
  updateOpenaiSession({
    modalities = void 0,
    instructions = void 0,
    voice = void 0,
    input_audio_format = void 0,
    output_audio_format = void 0,
    input_audio_transcription = void 0,
    turn_detection = void 0,
    tools = void 0,
    tool_choice = void 0,
    temperature = void 0,
    max_response_output_tokens = void 0,
  } = {}) {
    modalities !== void 0 && (this.openaiConfig.modalities = modalities);
    instructions !== void 0 && (this.openaiConfig.instructions = instructions);
    voice !== void 0 && (this.openaiConfig.voice = voice);
    input_audio_format !== void 0 && (this.openaiConfig.input_audio_format = input_audio_format);
    output_audio_format !== void 0 && (this.openaiConfig.output_audio_format = output_audio_format);
    input_audio_transcription !== void 0 && (this.openaiConfig.input_audio_transcription = input_audio_transcription);
    turn_detection !== void 0 && (this.openaiConfig.turn_detection = turn_detection);
    tools !== void 0 && (this.openaiConfig.tools = tools);
    tool_choice !== void 0 && (this.openaiConfig.tool_choice = tool_choice);
    temperature !== void 0 && (this.openaiConfig.temperature = temperature);
    max_response_output_tokens !== void 0 && (this.openaiConfig.max_response_output_tokens = max_response_output_tokens);

    // Load tools from tool definitions + already loaded tools
    const useTools = [].concat(
      (tools || []).map((toolDefinition) => {
        const definition = {
          type: 'function',
          ...toolDefinition,
        };
        if (this.tools[definition?.name]) {
          throw new Error(
            `Tool "${definition?.name}" has already been defined`,
          );
        }
        return definition;
      }),
      Object.keys(this.tools).map((key) => {
        return {
          type: 'function',
          ...this.tools[key].definition,
        };
      }),
    );
    const session = { ...this.openaiConfig };
    session.tools = useTools;
    if (this.realtime.isConnected()) {
      this.realtime.send('session.update', { session });
    }
    return true;
  }

  /**
   * Sends user message content and generates a response
   * @param {Array<InputTextContentType|InputAudioContentType>} content
   * @returns {true}
   */
  sendUserMessageContent(content = []) {
    if (content.length) {
      for (const c of content) {
        if (c.type === 'input_audio') {
          if (c.audio instanceof ArrayBuffer || c.audio instanceof Int16Array) {
            c.audio = RealtimeUtils.arrayBufferToBase64(c.audio);
          }
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
   * @param {Int16Array|ArrayBuffer} arrayBuffer
   * @returns {true}
   */
  appendInputAudio(arrayBuffer) {
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
   * @returns {true}
   */
  createResponse() {
    if (
      this.getTurnDetectionType() === null &&
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
   * @param {string} id The id of the message to cancel
   * @param {number} [sampleCount] The number of samples to truncate past for the ongoing generation
   * @returns {{item: (AssistantItemType | null)}}
   */
  cancelResponse(id, sampleCount = 0) {
    if (!id) {
      this.realtime.send('response.cancel');
      return { item: null };
    } else if (id) {
      const item = this.conversation.getItem(id);
      if (!item) {
        throw new Error(`Could not find item "${id}"`);
      }
      if (item.type !== 'message') {
        throw new Error(`Can only cancelResponse messages with type "message"`);
      } else if (item.role !== 'assistant') {
        throw new Error(
          `Can only cancelResponse messages with role "assistant"`,
        );
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
   * Utility for waiting for the next `conversation.item.appended` event to be triggered by the server
   * @returns {Promise<{item: ItemType}>}
   */
  async waitForNextItem() {
    const event = await this.waitForNext('conversation.item.appended');
    const { item } = event;
    return { item };
  }

  /**
   * Utility for waiting for the next `conversation.item.completed` event to be triggered by the server
   * @returns {Promise<{item: ItemType}>}
   */
  async waitForNextCompletedItem() {
    const event = await this.waitForNext('conversation.item.completed');
    const { item } = event;
    return { item };
  }
}
