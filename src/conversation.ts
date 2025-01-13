import type { ItemType } from './types';

export class RealtimeConversation {
  private items: ItemType[] = [];
  private currentItemId: string | null;
  private queuedAudio: Int16Array | null;
  public readonly defaultFrequency: number = 24000;

  constructor() {
    this.items = [];
    this.currentItemId = null;
    this.queuedAudio = null;
  }

  public addItem(item: ItemType): void {
    this.items.push(item);
    this.currentItemId = item.id;
  }

  public getCurrentItem(): ItemType | null {
    return this.currentItemId 
      ? this.items.find(item => item.id === this.currentItemId) || null 
      : null;
  }

  public getItems(): ItemType[] {
    return [...this.items];
  }

  public clear(): void {
    this.items = [];
    this.currentItemId = null;
    this.queuedAudio = null;
  }

  public updateItem(itemId: string, updates: Partial<ItemType>): void {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.items[itemIndex] = { ...this.items[itemIndex], ...updates };
    }
  }

  public queueInputAudio(audio: Int16Array): void {
    this.queuedAudio = audio;
  }

  public getQueuedAudio(): Int16Array | null {
    return this.queuedAudio;
  }

  public clearQueuedAudio(): void {
    this.queuedAudio = null;
  }

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

  private encodeAudioToBase64(audio: Int16Array): string {
    return btoa(String.fromCharCode(...new Uint8Array(audio.buffer)));
  }
} 