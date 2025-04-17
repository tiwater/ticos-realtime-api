import { RealtimeEventHandler } from './event-handler';
import type { WebSocket as WSType } from 'ws';
import type { ClientOptions } from '../types/client';
import { RealtimeUtils } from '../utils';
import type { Event as RealtimeEvent } from '../types/events';

/** Type alias for WebSocket instances that works in both Node.js and browser environments */
type WebSocketType = WSType | WebSocket;

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
export class RealtimeAPI extends RealtimeEventHandler {
  /** WebSocket endpoint URL */
  private url: string;
  /** Default WebSocket endpoint URL */
  private defaultUrl = 'wss://stardust.ticos.cn/realtime';
  /** API key for authentication */
  private apiKey: string | null;
  /** WebSocket connection */
  private ws: WebSocketType | null = null;
  /** Debug mode flag */
  private debug: boolean = false;
  /** Connection status */
  private connected: boolean = false;

  /**
   * Creates a new RealtimeAPI instance.
   *
   * @param {ClientOptions} settings - Configuration settings for the client
   * @throws {Error} If API key is provided in browser without explicit permission
   */
  constructor(settings: ClientOptions = { url: 'wss://stardust.ticos.cn/realtime', apiKey: '' }) {
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
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      // Create URL with API key if provided
      const url = new URL(this.url);
      if (this.apiKey) {
        url.searchParams.set('api_key', this.apiKey);
      }

      // Create WebSocket connection
      const ws = new WebSocket(url.toString(), [
        'realtime',
        `api-key.${this.apiKey}`,
        'realtime-v1',
      ]);

      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data as string);
          // Only log if debug mode is enabled
          if (this.debug) {
            // Don't log sensitive data in debug messages
            const sanitizedData = { ...data };
            if (sanitizedData.api_key) sanitizedData.api_key = '[REDACTED]';
            console.log('Received:', sanitizedData);
          }
          if (data.type) {
            this.receive(data.type, data);
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      });

      ws.addEventListener('open', () => {
        this.connected = true;
        this.ws = ws;
        // Only dispatch prefixed events to match JS SDK
        this.dispatch('client.connected', {
          type: 'client.connected',
        });
        resolve();
      });

      ws.addEventListener('error', (error) => {
        // Only dispatch prefixed events to match JS SDK
        this.dispatch('client.error', {
          type: 'client.error',
          error,
        });
        reject(error);
      });

      ws.addEventListener('close', () => {
        this.connected = false;
        this.ws = null;
        // Only dispatch prefixed events to match JS SDK
        this.dispatch('client.disconnected', {
          type: 'client.disconnected',
        });
      });

      // Handle Node.js specific WebSocket options
      if (typeof process !== 'undefined' && !globalThis.document) {
        (ws as any).on('upgrade', (response: any, socket: any, head: any) => {
          if (this.debug) {
            console.log('Upgrade headers:', response.headers);
          }
        });

        (ws as any).on('unexpected-response', (request: any, response: any) => {
          if (this.debug) {
            console.log('Unexpected response:', response.statusCode);
          }
          reject(new Error(`Unexpected response: ${response.statusCode}`));
        });
      }
    });
  }

  /**
   * Closes the WebSocket connection.
   *
   * @example
   * ```typescript
   * api.disconnect();
   * console.log('Disconnected from Realtime API');
   * ```
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

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
  public isConnected(): boolean {
    return this.connected && this.ws !== null;
  }

  /**
   * Receives an event from WebSocket and dispatches the raw event
   *
   * @param {string} eventName - Event name
   * @param {Record<string, any>} event - Event data
   * @returns {boolean} Always returns true
   * @private
   */
  private receive(eventName: string, event: Record<string, any>): boolean {
    if (this.debug) {
      console.log(`Received: ${eventName}`, event);
    }

    // Make a copy to avoid mutations and ensure type property is present
    const rawEvent = { ...event };

    // If the event doesn't have a type field (it should), add it
    if (!rawEvent.type) {
      rawEvent.type = eventName;
    }

    // In JS SDK, only the prefixed events are dispatched
    // Dispatch with server. prefix only - no server.* to avoid duplicates
    this.dispatch(`server.${eventName}`, {
      type: `server.${eventName}`,
      ...event,
    } as RealtimeEvent);

    return true;
  }

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
  public send(type: string, payload: Record<string, any> = {}): boolean {
    if (!this.isConnected()) {
      // Instead of queuing, just fail if not connected
      if (this.debug) {
        console.warn(`Not connected, cannot send message of type: ${type}`);
      }
      return false;
    }

    try {
      const event_id = RealtimeUtils.generateId('evt_');

      // Create the event to send to the server
      const event = {
        event_id,
        type,
        ...payload,
      };

      if (this.debug) {
        // Sanitize sensitive data for logging
        const sanitizedEvent = { ...event };
        // Use a type assertion to handle potential dynamic properties
        const sanitized = sanitizedEvent as Record<string, any>;

        if (sanitized.api_key) sanitized.api_key = '[REDACTED]';
        if (type === 'session.update' && sanitized.session?.apiKey) {
          sanitized.session.apiKey = '[REDACTED]';
        }
        console.log('Sending:', sanitizedEvent);
      }

      this.ws!.send(JSON.stringify(event));

      // Dispatch with client. prefix only - no client.* to avoid duplicates
      this.dispatch(`client.${type}`, {
        type: `client.${type}`,
        event_id,
        ...payload,
      } as RealtimeEvent);

      return true;
    } catch (error) {
      console.error(`Error sending message of type ${type}:`, error);
      return false;
    }
  }

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
  public registerTool(name: string, definition: object): boolean {
    return this.send('tool.register', {
      tool_name: name,
      definition,
    });
  }

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
  public sendToolResponse(toolCallId: string, response: any): boolean {
    return this.send('tool.response', {
      tool_call_id: toolCallId,
      response,
    });
  }

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
  public sendToolError(toolCallId: string, error: string): boolean {
    return this.send('tool.error', {
      tool_call_id: toolCallId,
      error,
    });
  }
}
