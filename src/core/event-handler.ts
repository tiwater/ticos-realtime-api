/** Callback function type for event handlers */
type EventHandlerCallbackType = (event: Record<string, any>) => void;

/** Utility function to create a promise that resolves after a specified time */
const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

/**
 * Base class for handling real-time events with support for persistent and one-time event listeners.
 * Provides methods for subscribing to events, handling them once, and waiting for specific events.
 */
export class RealtimeEventHandler {
  /** Map of event types to arrays of callback functions */
  private handlers: Map<string, EventHandlerCallbackType[]> = new Map();
  /** Map of event types to arrays of one-time callback functions */
  private onceHandlers: Map<string, EventHandlerCallbackType[]> = new Map();
  /** Map of event types to promises that resolve when the event occurs */
  private waiters: Map<string, Array<(event: any) => void>> = new Map();

  /**
   * Adds an event listener for the specified event type.
   * Supports wildcard event types using "*" (e.g., "conversation.*").
   * 
   * @param {string} type - Event type to listen for
   * @param {EventHandlerCallbackType} callback - Function to call when the event occurs
   * @returns {this} The event handler instance for chaining
   * 
   * @example
   * ```typescript
   * eventHandler.on('message.received', (event) => {
   *   console.log('Message received:', event);
   * });
   * 
   * // Using wildcards
   * eventHandler.on('conversation.*', (event) => {
   *   console.log('Conversation event:', event);
   * });
   * ```
   */
  public on(type: string, callback: EventHandlerCallbackType): this {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(callback);
    return this;
  }

  /**
   * Adds a one-time event listener for the specified event type.
   * The listener will be automatically removed after it is called once.
   * 
   * @param {string} type - Event type to listen for
   * @param {EventHandlerCallbackType} callback - Function to call when the event occurs
   * @returns {this} The event handler instance for chaining
   * 
   * @example
   * ```typescript
   * eventHandler.once('connection.established', (event) => {
   *   console.log('Connected!');
   * });
   * ```
   */
  public once(type: string, callback: EventHandlerCallbackType): this {
    if (!this.onceHandlers.has(type)) {
      this.onceHandlers.set(type, []);
    }
    this.onceHandlers.get(type)!.push(callback);
    return this;
  }

  /**
   * Removes an event listener for the specified event type.
   * 
   * @param {string} type - Event type to remove listener from
   * @param {EventHandlerCallbackType} callback - Function to remove
   * @returns {this} The event handler instance for chaining
   * 
   * @example
   * ```typescript
   * const handleMessage = (event) => console.log('Message:', event);
   * eventHandler.on('message', handleMessage);
   * // Later...
   * eventHandler.off('message', handleMessage);
   * ```
   */
  public off(type: string, callback: EventHandlerCallbackType): this {
    if (this.handlers.has(type)) {
      const handlers = this.handlers.get(type)!;
      const index = handlers.indexOf(callback);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Emits an event of the specified type with the provided data.
   * Calls all registered listeners for the event type.
   * 
   * @param {string} type - Event type to emit
   * @param {Record<string, any>} event - Event data to pass to listeners
   * @returns {boolean} True if the event had listeners, false otherwise
   * 
   * @example
   * ```typescript
   * eventHandler.emit('message.sent', { text: 'Hello!' });
   * ```
   */
  public emit(type: string, event: Record<string, any> = {}): boolean {
    let hasListeners = false;

    // Process regular handlers
    if (this.handlers.has(type)) {
      hasListeners = true;
      for (const handler of this.handlers.get(type)!) {
        handler(event);
      }
    }

    // Process wildcard handlers
    if (type.includes('.')) {
      const parts = type.split('.');
      const wildcardType = `${parts[0]}.*`;
      if (this.handlers.has(wildcardType)) {
        hasListeners = true;
        for (const handler of this.handlers.get(wildcardType)!) {
          handler({ ...event, type });
        }
      }
    }

    // Process once handlers
    if (this.onceHandlers.has(type)) {
      hasListeners = true;
      const handlers = this.onceHandlers.get(type)!;
      this.onceHandlers.delete(type);
      for (const handler of handlers) {
        handler(event);
      }
    }

    // Process waiters
    if (this.waiters.has(type)) {
      hasListeners = true;
      const resolvers = this.waiters.get(type)!;
      this.waiters.delete(type);
      for (const resolve of resolvers) {
        resolve(event);
      }
    }

    return hasListeners;
  }

  /**
   * Returns a promise that resolves when an event of the specified type occurs.
   * 
   * @param {string} type - Event type to wait for
   * @param {number} [timeout=30000] - Maximum time to wait in milliseconds
   * @returns {Promise<any>} Promise that resolves with the event data
   * 
   * @example
   * ```typescript
   * const event = await eventHandler.waitForNext('message.received');
   * console.log('Message received:', event);
   * ```
   */
  public waitForNext(type: string, timeout: number = 30000): Promise<any> {
    return new Promise((resolve) => {
      if (!this.waiters.has(type)) {
        this.waiters.set(type, []);
      }
      this.waiters.get(type)!.push(resolve);

      if (timeout > 0) {
        sleep(timeout).then(() => {
          if (this.waiters.has(type)) {
            const resolvers = this.waiters.get(type)!;
            const index = resolvers.indexOf(resolve);
            if (index !== -1) {
              resolvers.splice(index, 1);
              if (resolvers.length === 0) {
                this.waiters.delete(type);
              }
              resolve(null);
            }
          }
        });
      }
    });
  }
}
