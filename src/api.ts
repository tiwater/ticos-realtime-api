import { RealtimeEventHandler } from './event-handler';
import type { WebSocket as WSType } from 'ws';

type WebSocketType = WSType | WebSocket;

interface RealtimeAPISettings {
  url?: string;
  apiKey?: string;
  dangerouslyAllowAPIKeyInBrowser?: boolean;
  debug?: boolean;
}

export class RealtimeAPI extends RealtimeEventHandler {
  private defaultUrl: string = 'wss://api.openai.com/v1/realtime';
  private url: string;
  public readonly apiKey: string | null;
  private debug: boolean;
  private ws: WebSocketType | null = null;

  constructor(settings: RealtimeAPISettings = {}) {
    super();
    this.url = settings.url || this.defaultUrl;
    this.apiKey = settings.apiKey || null;
    this.debug = !!settings.debug;

    if (globalThis.document && this.apiKey) {
      if (!settings.dangerouslyAllowAPIKeyInBrowser) {
        throw new Error(
          'Can not provide API key in the browser without "dangerouslyAllowAPIKeyInBrowser" set to true'
        );
      }
    }
  }

  public isConnected(): boolean {
    return !!this.ws;
  }

  private log(...args: any[]): true {
    const date = new Date().toISOString();
    const logs = [`[Websocket/${date}]`].concat(args).map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(arg, null, 2);
      }
      return arg;
    });
    
    if (this.debug) {
      console.log(...logs);
    }
    return true;
  }

  public async connect(settings: { model?: string } = { model: 'gpt-4o-realtime-preview-2024-10-01' }): Promise<true> {
    if (!this.apiKey && this.url === this.defaultUrl) {
      console.warn(`No apiKey provided for connection to "${this.url}"`);
    }
    if (this.isConnected()) {
      throw new Error('Already connected');
    }

    if (globalThis.WebSocket) {
      // Web browser
      if (globalThis.document && this.apiKey) {
        console.warn(
          'Warning: Connecting using API key in the browser, this is not recommended'
        );
      }

      const url = new URL(this.url);
      if (settings.model) {
        url.searchParams.set('model', settings.model);
      }

      const ws = new WebSocket(url.toString(), [
        'realtime',
        `openai-insecure-api-key.${this.apiKey}`,
        'openai-beta.realtime-v1',
      ]);

      ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        this.receive(message.type, message);
      });

      return new Promise((resolve, reject) => {
        const connectionErrorHandler = () => {
          this.disconnect(ws);
          reject(new Error(`Could not connect to "${this.url}"`));
        };

        ws.addEventListener('error', connectionErrorHandler);
        ws.addEventListener('open', () => {
          this.log(`Connected to "${this.url}"`);
          ws.removeEventListener('error', connectionErrorHandler);
          
          ws.addEventListener('error', () => {
            this.disconnect(ws);
            this.log(`Error, disconnected from "${this.url}"`);
            this.emit('close', { error: true });
          });

          ws.addEventListener('close', () => {
            this.disconnect(ws);
            this.log(`Disconnected from "${this.url}"`);
            this.emit('close', { error: false });
          });

          this.ws = ws;
          resolve(true);
        });
      });
    } else {
      // Node.js
      const { default: WebSocket } = await import('ws');
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
        [],
        {
          finishRequest: (request: any) => {
            request.setHeader('Authorization', `Bearer ${this.apiKey}`);
            request.setHeader('OpenAI-Beta', 'realtime=v1');
            request.end();
          },
        }
      );

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.receive(message.type, message);
      });

      return new Promise((resolve, reject) => {
        const connectionErrorHandler = () => {
          this.disconnect(ws);
          reject(new Error(`Could not connect to "${this.url}"`));
        };

        ws.on('error', connectionErrorHandler);
        ws.on('open', () => {
          this.log(`Connected to "${this.url}"`);
          ws.removeListener('error', connectionErrorHandler);
          
          ws.on('error', () => {
            this.disconnect(ws);
            this.log(`Error, disconnected from "${this.url}"`);
            this.emit('close', { error: true });
          });

          ws.on('close', () => {
            this.disconnect(ws);
            this.log(`Disconnected from "${this.url}"`);
            this.emit('close', { error: false });
          });

          this.ws = ws;
          resolve(true);
        });
      });
    }
  }

  public disconnect(ws?: WebSocketType): true {
    if (!ws || this.ws === ws) {
      this.ws?.close();
      this.ws = null;
    }
    return true;
  }

  private receive(eventName: string, event: Record<string, any>): true {
    this.log('received:', eventName, event);
    this.emit(`server.${eventName}`, event);
    this.emit('server.*', event);
    return true;
  }

  public send(eventName: string, data: Record<string, any> = {}): true {
    if (!this.isConnected()) {
      throw new Error('RealtimeAPI is not connected');
    }

    if (typeof data !== 'object') {
      throw new Error('data must be an object');
    }

    const event = {
      event_id: this.generateId('evt_'),
      type: eventName,
      ...data,
    };

    this.emit(`client.${eventName}`, event);
    this.emit(`client.*`, event);
    this.log('sent:', eventName, event);
    this.ws?.send(JSON.stringify(event));
    return true;
  }

  private generateId(prefix: string = ''): string {
    return prefix + Math.random().toString(36).substring(2, 15);
  }

  public waitForNext(eventName: string, timeout?: number): Promise<any> {
    return super.waitForNext(eventName, timeout || null);
  }
} 