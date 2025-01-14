import { RealtimeEventHandler } from './event-handler';
import type { WebSocket as WSType } from 'ws';

/** Type alias for WebSocket instances that works in both Node.js and browser environments */
type WebSocketType = WSType | WebSocket;

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
export class RealtimeAPI extends RealtimeEventHandler {
  /** Default WebSocket endpoint URL */
  private defaultUrl: string = 'wss://api.openai.com/v1/realtime';
  /** Current WebSocket endpoint URL */
  private url: string;
  /** API key for authentication */
  public readonly apiKey: string | null;
  /** Debug mode flag */
  private debug: boolean;
  /** Active WebSocket connection */
  private ws: WebSocketType | null = null;

  /**
   * Creates a new RealtimeAPI instance.
   * 
   * @param {RealtimeAPISettings} settings - Configuration settings for the client
   * @throws {Error} If API key is provided in browser without explicit permission
   */
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

  /**
   * Checks if the client is currently connected to the WebSocket server.
   * 
   * @returns {boolean} True if connected, false otherwise
   */
  public isConnected(): boolean {
    return !!this.ws;
  }

  /**
   * Internal logging function for debug messages.
   * Only logs when debug mode is enabled.
   * 
   * @private
   * @param {...any[]} args - Arguments to log
   * @returns {true} Always returns true
   */
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
  public disconnect(ws?: WebSocketType): true {
    if (!ws || this.ws === ws) {
      this.ws?.close();
      this.ws = null;
    }
    return true;
  }

  /**
   * Internal method to handle incoming WebSocket messages.
   * Emits events for the received message type.
   * 
   * @private
   * @param {string} eventName - Type of the received event
   * @param {Record<string, any>} event - Event data
   * @returns {true} Always returns true
   */
  private receive(eventName: string, event: Record<string, any>): true {
    this.log('received:', eventName, event);
    this.emit(`server.${eventName}`, event);
    this.emit('server.*', event);
    return true;
  }

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

  /**
   * Generates a unique ID for events.
   * 
   * @private
   * @param {string} [prefix=''] - Optional prefix for the generated ID
   * @returns {string} Generated unique ID
   */
  private generateId(prefix: string = ''): string {
    return prefix + Math.random().toString(36).substring(2, 15);
  }

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
  public waitForNext(eventName: string, timeout?: number): Promise<any> {
    return super.waitForNext(eventName, timeout || null);
  }
} 