import type { ItemType, Content } from '../types/conversation';

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
   * 
   * @returns {ItemType[]} Array of all conversation items
   */
  public getItems(): ItemType[] {
    return [...this.items];
  }

  /**
   * Clears all items from the conversation.
   */
  public clearItems(): void {
    this.items = [];
    this.currentItemId = null;
  }

  /**
   * Updates an existing item in the conversation.
   * 
   * @param {string} id - ID of the item to update
   * @param {Partial<ItemType>} updates - Partial item data to apply
   * @returns {boolean} True if the item was found and updated, false otherwise
   */
  public updateItem(id: string, updates: Partial<ItemType>): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    
    this.items[index] = { ...this.items[index], ...updates };
    return true;
  }

  /**
   * Removes an item from the conversation.
   * 
   * @param {string} id - ID of the item to remove
   * @returns {boolean} True if the item was found and removed, false otherwise
   */
  public removeItem(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    
    this.items.splice(index, 1);
    if (this.currentItemId === id) {
      this.currentItemId = this.items.length > 0 ? this.items[this.items.length - 1].id : null;
    }
    
    return true;
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
   * Gets and clears the queued audio data.
   * 
   * @returns {Int16Array | null} The queued audio data or null if none is queued
   */
  public getAndClearQueuedAudio(): Int16Array | null {
    const audio = this.queuedAudio;
    this.queuedAudio = null;
    return audio;
  }

  /**
   * Checks if there is queued audio data.
   * 
   * @returns {boolean} True if there is queued audio, false otherwise
   */
  public hasQueuedAudio(): boolean {
    return this.queuedAudio !== null;
  }
}
