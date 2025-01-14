import type { ItemType } from './types';

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
export class RealtimeConversation {
  /** Array of conversation items */
  private items: ItemType[] = [];
  /** ID of the currently active item */
  private currentItemId: string | null;
  /** Queued audio data for processing */
  private queuedAudio: Int16Array | null;
  /** Default audio sampling frequency in Hz */
  public readonly defaultFrequency: number = 24000;

  /**
   * Creates a new RealtimeConversation instance.
   * Initializes empty conversation state.
   */
  constructor() {
    this.items = [];
    this.currentItemId = null;
    this.queuedAudio = null;
  }

  /**
   * Adds a new item to the conversation.
   * Sets it as the current item.
   * 
   * @param {ItemType} item - The item to add to the conversation
   */
  public addItem(item: ItemType): void {
    this.items.push(item);
    this.currentItemId = item.id;
  }

  /**
   * Gets the currently active conversation item.
   * 
   * @returns {ItemType | null} The current item or null if none is active
   */
  public getCurrentItem(): ItemType | null {
    return this.currentItemId 
      ? this.items.find(item => item.id === this.currentItemId) || null 
      : null;
  }

  /**
   * Gets all items in the conversation.
   * Returns a copy of the items array to prevent direct modification.
   * 
   * @returns {ItemType[]} Array of all conversation items
   */
  public getItems(): ItemType[] {
    return [...this.items];
  }

  /**
   * Clears the conversation state.
   * Removes all items and resets audio queue.
   */
  public clear(): void {
    this.items = [];
    this.currentItemId = null;
    this.queuedAudio = null;
  }

  /**
   * Updates an existing conversation item.
   * 
   * @param {string} itemId - ID of the item to update
   * @param {Partial<ItemType>} updates - Partial item data to merge with existing item
   */
  public updateItem(itemId: string, updates: Partial<ItemType>): void {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.items[itemIndex] = { ...this.items[itemIndex], ...updates };
    }
  }

  /**
   * Queues audio data for processing.
   * 
   * @param {Int16Array} audio - Audio data to queue
   */
  public queueInputAudio(audio: Int16Array): void {
    this.queuedAudio = audio;
  }

  /**
   * Gets the currently queued audio data.
   * 
   * @returns {Int16Array | null} Queued audio data or null if none is queued
   */
  public getQueuedAudio(): Int16Array | null {
    return this.queuedAudio;
  }

  /**
   * Clears the queued audio data.
   */
  public clearQueuedAudio(): void {
    this.queuedAudio = null;
  }

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
  public processEvent(event: string, ...args: any[]): { item: ItemType | null; delta: any } {
    switch (event) {
      case 'item.created': {
        const item = args[0];
        this.addItem(item);
        return { item, delta: null };
      }

      case 'item.updated': {
        const { id, ...updates } = args[0];
        this.updateItem(id, updates);
        const item = this.items.find(i => i.id === id) || null;
        return { item, delta: updates };
      }

      case 'item.deleted': {
        const { id } = args[0];
        const item = this.items.find(i => i.id === id) || null;
        this.items = this.items.filter(i => i.id !== id);
        return { item, delta: null };
      }

      case 'item.delta': {
        const { id, delta } = args[0];
        const item = this.items.find(i => i.id === id) || null;
        if (item) {
          this.updateItem(id, delta);
        }
        return { item, delta };
      }

      case 'response.created': {
        const { response } = args[0];
        if (response?.output?.length) {
          response.output.forEach((item: ItemType) => this.addItem(item));
        }
        return { item: null, delta: null };
      }

      case 'response.output_item.added': {
        const { item } = args[0];
        this.addItem(item);
        return { item, delta: null };
      }

      case 'response.content_part.added': {
        const { item_id, content } = args[0];
        const item = this.items.find(i => i.id === item_id);
        if (item) {
          item.content = [...(item.content || []), content];
          return { item, delta: { content } };
        }
        return { item: null, delta: null };
      }

      case 'input_audio_buffer.speech_started': {
        const { item } = args[0];
        this.addItem(item);
        return { item, delta: null };
      }

      case 'input_audio_buffer.speech_stopped': {
        const [event, audio] = args;
        const { item_id } = event;
        const item = this.items.find(i => i.id === item_id);
        if (item) {
          const content = item.content?.[0];
          if (content && 'audio' === content.type) {
            content.audio = this.encodeAudioToBase64(audio);
          }
          item.status = 'completed';
          return { item, delta: { status: 'completed' } };
        }
        return { item: null, delta: null };
      }

      case 'conversation.item.input_audio_transcription.completed': {
        const { item_id, transcript } = args[0];
        const item = this.items.find(i => i.id === item_id);
        if (item) {
          const content = item.content?.[0];
          if (content && 'audio' === content.type) {
            content.transcript = transcript;
          }
          return { item, delta: { transcript } };
        }
        return { item: null, delta: null };
      }

      case 'response.audio_transcript.delta':
      case 'response.audio.delta':
      case 'response.text.delta':
      case 'response.function_call_arguments.delta': {
        const { item_id, content } = args[0];
        const item = this.items.find(i => i.id === item_id);
        if (item) {
          item.content = [...(item.content || []), content];
          return { item, delta: { content } };
        }
        return { item: null, delta: null };
      }

      default:
        return { item: null, delta: null };
    }
  }

  /**
   * Converts audio data to base64 string format.
   * 
   * @private
   * @param {Int16Array} audio - Audio data to encode
   * @returns {string} Base64 encoded audio data
   */
  private encodeAudioToBase64(audio: Int16Array): string {
    return btoa(String.fromCharCode(...new Uint8Array(audio.buffer)));
  }
} 