import type { ItemType, Content } from '../types/conversation';
import { RealtimeUtils } from '../utils';

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
export class RealtimeConversation {
  /** Default audio sampling frequency in Hz */
  public readonly defaultFrequency: number = 24000;

  /** Lookup for items by ID */
  private itemLookup: Record<string, ItemType> = {};
  /** Array of conversation items */
  private items: ItemType[] = [];
  /** Lookup for responses by ID */
  private responseLookup: Record<string, any> = {};
  /** Array of responses */
  private responses: any[] = [];
  /** Queued speech items by ID */
  private queuedSpeechItems: Record<string, any> = {};
  /** Queued transcript items by ID */
  private queuedTranscriptItems: Record<string, any> = {};
  /** Queued audio data for processing */
  private queuedInputAudio: Int16Array | null = null;

  /**
   * Creates a new RealtimeConversation instance.
   * Initializes empty conversation state.
   */
  constructor() {
    this.clear();
  }

  /**
   * Clears the conversation history and resets to default
   * @returns {boolean} Always returns true
   */
  public clear(): boolean {
    this.itemLookup = {};
    this.items = [];
    this.responseLookup = {};
    this.responses = [];
    this.queuedSpeechItems = {};
    this.queuedTranscriptItems = {};
    this.queuedInputAudio = null;
    return true;
  }

  /**
   * Queues audio data for processing.
   *
   * @param {Int16Array} audio - Audio data to queue
   * @returns {Int16Array} The queued audio data
   */
  public queueInputAudio(audio: Int16Array): Int16Array {
    this.queuedInputAudio = audio;
    return audio;
  }

  /**
   * Process an event from the WebSocket server and compose items
   * @param {any} event - The event to process
   * @param {...any} args - Additional arguments
   * @returns {{ item: ItemType | null, delta: ItemContentDelta | null }} Processed item and delta
   */
  public processEvent(
    event: any,
    ...args: any[]
  ): { item: ItemType | null; delta: ItemContentDelta | null } {
    // Support alternative event formats
    if (!event.event_id && !event.type) {
      // Event might be passed as type + payload separately
      if (typeof args[0] === 'string' && typeof args[1] === 'object') {
        const eventType = args[0];
        const eventPayload = args[1];
        eventPayload.type = eventType;

        // Generate event_id if needed
        eventPayload.event_id = eventPayload.event_id || RealtimeUtils.generateId('evt_');

        // Process using the normalized event
        return this.processEvent(eventPayload);
      }
    }

    if (!event.event_id) {
      console.error(event);
      throw new Error('Missing "event_id" on event');
    }
    if (!event.type) {
      console.error(event);
      throw new Error('Missing "type" on event');
    }

    const eventProcessor = this.EventProcessors[event.type];
    if (!eventProcessor) {
      throw new Error(`Missing conversation event processor for "${event.type}"`);
    }

    return eventProcessor.call(this, event, ...args);
  }

  /**
   * Retrieves a item by id
   * @param {string} id - Item ID
   * @returns {ItemType | null} The item or null if not found
   */
  public getItem(id: string): ItemType | null {
    return this.itemLookup[id] || null;
  }

  /**
   * Gets all items in the conversation.
   *
   * @returns {ItemType[]} Array of all conversation items
   */
  public getItems(): ItemType[] {
    return this.items.slice();
  }

  /**
   * Event processors for different event types
   * @private
   */
  private EventProcessors: Record<
    string,
    (event: any, ...args: any[]) => { item: ItemType | null; delta: ItemContentDelta | null }
  > = {
    'conversation.item.created': (event) => {
      const { item } = event;
      // deep copy values
      const newItem = JSON.parse(JSON.stringify(item));
      if (!this.itemLookup[newItem.id]) {
        this.itemLookup[newItem.id] = newItem;
        this.items.push(newItem);
      }

      // Initialize formatted property if it doesn't exist
      if (!newItem.formatted) {
        newItem.formatted = {};
      }

      newItem.formatted.audio = new Int16Array(0);
      newItem.formatted.text = '';
      newItem.formatted.transcript = '';

      // If we have a speech item, can populate audio
      if (this.queuedSpeechItems[newItem.id]) {
        newItem.formatted.audio = this.queuedSpeechItems[newItem.id].audio;
        delete this.queuedSpeechItems[newItem.id]; // free up some memory
      }

      // Populate formatted text if it comes out on creation
      if (newItem.content) {
        const textContent = newItem.content.filter((c: Content) =>
          ['text', 'input_text'].includes(c.type)
        );
        for (const content of textContent) {
          if (content.type === 'text' || content.type === 'input_text') {
            newItem.formatted.text += content.text;
          }
        }
      }

      if (newItem.type === 'message') {
        if (newItem.role === 'user') {
          newItem.status = 'completed';
          if (this.queuedInputAudio) {
            newItem.formatted.audio = this.queuedInputAudio;
            this.queuedInputAudio = null;
          }
        } else {
          newItem.status = 'in_progress';
        }
      } else if (newItem.type === 'function_call') {
        newItem.formatted.tool = {
          type: 'function',
          name: newItem.name,
          call_id: newItem.call_id,
          arguments: '',
        };
        newItem.status = 'in_progress';
      } else if (newItem.type === 'function_call_output') {
        newItem.status = 'completed';
        newItem.formatted.output = newItem.output;
      }

      return { item: newItem, delta: null };
    },

    'conversation.item.input_audio_transcription.completed': (event) => {
      const { item_id, content_index, transcript } = event;
      const item = this.itemLookup[item_id];
      // We use a single space to represent an empty transcript for .formatted values
      // Otherwise it looks like no transcript provided
      const formattedTranscript = transcript || ' ';

      if (!item) {
        // We can receive transcripts in VAD mode before item.created
        // This happens specifically when audio is empty
        this.queuedTranscriptItems[item_id] = {
          transcript: formattedTranscript,
        };
        return { item: null, delta: null };
      } else {
        try {
          if (content_index !== undefined && item.content[content_index]) {
            // Only set transcript on audio content types
            const contentItem = item.content[content_index];
            if (contentItem.type === 'audio' || contentItem.type === 'input_audio') {
              // Type assertion to inform TypeScript this is an audio content type
              (contentItem as any).transcript = transcript;
            }
          }
          if (!item.formatted) {
            item.formatted = {};
          }
          item.formatted.transcript = formattedTranscript;
          return { item, delta: { transcript } };
        } catch (error) {
          console.error(`Error processing input audio transcription:`, error);
          return { item, delta: null };
        }
      }
    },

    'response.audio_transcript.delta': (event) => {
      const { item_id, content_index, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        console.warn(`response.audio_transcript.delta: Item "${item_id}" not found, skipping`);
        return { item: null, delta: null };
      }

      try {
        if (!item.formatted) {
          item.formatted = {};
        }

        if (typeof item.formatted.transcript !== 'string') {
          item.formatted.transcript = '';
        }

        item.formatted.transcript += delta;
        return { item, delta: { transcript: delta } };
      } catch (error) {
        console.error(`Error processing audio transcript delta:`, error);
        return { item, delta: null };
      }
    },

    'response.audio.delta': (event) => {
      const { item_id, content_index, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        console.warn(`response.audio.delta: Item "${item_id}" not found, skipping`);
        return { item: null, delta: null };
      }

      try {
        // Initialize formatted property if it doesn't exist
        if (!item.formatted) {
          item.formatted = {};
        }

        // Initialize audio property if it doesn't exist
        if (!item.formatted.audio) {
          item.formatted.audio = new Int16Array(0);
        }

        const arrayBuffer = RealtimeUtils.base64ToArrayBuffer(delta);
        const appendValues = new Int16Array(arrayBuffer);
        item.formatted.audio = RealtimeUtils.mergeInt16Arrays(item.formatted.audio, appendValues);
        return { item, delta: { audio: appendValues } };
      } catch (error) {
        console.error(`Failed to process audio delta for item ${item_id}:`, error);
        return { item, delta: null };
      }
    },

    'response.text.delta': (event) => {
      const { item_id, content_index, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(`response.text.delta: Item "${item_id}" not found`);
      }

      try {
        // Initialize formatted property if it doesn't exist
        if (!item.formatted) {
          item.formatted = {};
        }

        // Initialize text property if it doesn't exist
        if (!item.formatted.text) {
          item.formatted.text = '';
        }

        if (item.content[content_index]) {
          const contentItem = item.content[content_index];
          if (contentItem.type === 'text') {
            contentItem.text += delta;
          }
        }

        item.formatted.text += delta;
        return { item, delta: { text: delta } };
      } catch (error) {
        console.error(`Error processing text delta:`, error);
        return { item, delta: null };
      }
    },

    'input_audio_buffer.speech_started': (event) => {
      const { item_id, audio_start_ms } = event;
      // Initialize speech item if it doesn't exist
      if (!this.queuedSpeechItems[item_id]) {
        this.queuedSpeechItems[item_id] = { audio_start_ms };
      } else {
        // Update the existing speech item with the start time
        this.queuedSpeechItems[item_id].audio_start_ms = audio_start_ms;
      }

      return { item: null, delta: null };
    },

    'input_audio_buffer.speech_stopped': (event, inputAudioBuffer) => {
      const { item_id, audio_end_ms } = event;
      if (!this.queuedSpeechItems[item_id]) {
        this.queuedSpeechItems[item_id] = { audio_start_ms: audio_end_ms };
      }
      const speech = this.queuedSpeechItems[item_id];
      speech.audio_end_ms = audio_end_ms;
      if (inputAudioBuffer && inputAudioBuffer instanceof Int16Array) {
        const startIndex = Math.floor((speech.audio_start_ms * this.defaultFrequency) / 1000);
        const endIndex = Math.floor((speech.audio_end_ms * this.defaultFrequency) / 1000);
        // Ensure indices are valid before slicing
        if (startIndex >= 0 && endIndex >= startIndex && endIndex <= inputAudioBuffer.length) {
          speech.audio = inputAudioBuffer.slice(startIndex, endIndex);
        } else {
          console.warn(
            `Invalid audio slice indices: start=${startIndex}, end=${endIndex}, length=${inputAudioBuffer.length}`
          );
          speech.audio = new Int16Array(0);
        }
      }
      return { item: null, delta: null };
    },

    'response.function_call_arguments.delta': (event) => {
      const { item_id, delta } = event;
      const item = this.itemLookup[item_id];
      if (!item) {
        throw new Error(`response.function_call_arguments.delta: Item "${item_id}" not found`);
      }

      try {
        // Handle arguments property
        if (item.arguments !== undefined) {
          item.arguments += delta;
        } else {
          console.warn(`Item ${item_id} doesn't have 'arguments' property`);
        }

        // Update formatted tool arguments if they exist
        if (item.formatted?.tool) {
          item.formatted.tool.arguments += delta;
        }

        return { item, delta: { arguments: delta } };
      } catch (error) {
        console.error(`Error processing function call arguments delta:`, error);
        return { item, delta: null };
      }
    },

    'response.output_item.done': (event) => {
      const { item } = event;
      if (!item) {
        throw new Error(`response.output_item.done: Missing "item"`);
      }
      const foundItem = this.itemLookup[item.id];
      if (!foundItem) {
        throw new Error(`response.output_item.done: Item "${item.id}" not found`);
      }

      try {
        foundItem.status = item.status;
        return { item: foundItem, delta: null };
      } catch (error) {
        console.error(`Error processing output item done:`, error);
        return { item: foundItem, delta: null };
      }
    },
  };
}
