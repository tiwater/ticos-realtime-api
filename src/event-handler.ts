/** Callback function type for event handlers */
type EventHandlerCallbackType = (event: Record<string, any>) => void;

/** Utility function to create a promise that resolves after a specified time */
const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

/**
 * Base class for handling real-time events with support for persistent and one-time event listeners.
 * Provides methods for subscribing to events, handling them once, and waiting for specific events.
 */
export class RealtimeEventHandler {
  /** Map of event names to arrays of persistent event handlers */
  private eventHandlers: Record<string, EventHandlerCallbackType[]> = {};
  /** Map of event names to arrays of one-time event handlers */
  private nextEventHandlers: Record<string, EventHandlerCallbackType[]> = {};

  /**
   * Removes all event handlers, both persistent and one-time.
   * @returns {true} Always returns true
   */
  public clearEventHandlers(): true {
    this.eventHandlers = {};
    this.nextEventHandlers = {};
    return true;
  }

  /**
   * Registers a persistent event handler for a specific event.
   * The handler will be called every time the event occurs until explicitly removed.
   * 
   * @param {string} eventName - Name of the event to listen for
   * @param {EventHandlerCallbackType} callback - Function to call when the event occurs
   * @returns {EventHandlerCallbackType} The registered callback function
   */
  public on(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    this.eventHandlers[eventName].push(callback);
    return callback;
  }

  /**
   * Registers a one-time event handler for a specific event.
   * The handler will be called only once when the event next occurs, then automatically removed.
   * 
   * @param {string} eventName - Name of the event to listen for
   * @param {EventHandlerCallbackType} callback - Function to call when the event occurs
   * @returns {EventHandlerCallbackType} The registered callback function
   */
  public onNext(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType {
    this.nextEventHandlers[eventName] = this.nextEventHandlers[eventName] || [];
    this.nextEventHandlers[eventName].push(callback);
    return callback;
  }

  /**
   * Removes a persistent event handler for a specific event.
   * If no callback is provided, removes all handlers for the event.
   * 
   * @param {string} eventName - Name of the event to stop listening for
   * @param {EventHandlerCallbackType} [callback] - Specific handler to remove
   * @returns {true} Always returns true
   * @throws {Error} If the specified callback is not found as a listener
   */
  public off(eventName: string, callback?: EventHandlerCallbackType): true {
    const handlers = this.eventHandlers[eventName] || [];
    if (callback) {
      const index = handlers.indexOf(callback);
      if (index === -1) {
        throw new Error(`Could not turn off specified event listener for "${eventName}": not found as a listener`);
      }
      handlers.splice(index, 1);
    } else {
      delete this.eventHandlers[eventName];
    }
    return true;
  }

  /**
   * Removes a one-time event handler for a specific event.
   * If no callback is provided, removes all one-time handlers for the event.
   * 
   * @param {string} eventName - Name of the event to stop listening for
   * @param {EventHandlerCallbackType} [callback] - Specific handler to remove
   * @returns {true} Always returns true
   * @throws {Error} If the specified callback is not found as a listener
   */
  public offNext(eventName: string, callback?: EventHandlerCallbackType): true {
    const nextHandlers = this.nextEventHandlers[eventName] || [];
    if (callback) {
      const index = nextHandlers.indexOf(callback);
      if (index === -1) {
        throw new Error(`Could not turn off specified next event listener for "${eventName}": not found as a listener`);
      }
      nextHandlers.splice(index, 1);
    } else {
      delete this.nextEventHandlers[eventName];
    }
    return true;
  }

  /**
   * Waits for the next occurrence of a specific event.
   * Returns a promise that resolves with the event data when the event occurs.
   * 
   * @param {string} eventName - Name of the event to wait for
   * @param {number | null} [timeout=null] - Optional timeout in milliseconds
   * @returns {Promise<Record<string, any> | null>} Promise resolving to event data or null if timed out
   */
  public async waitForNext(eventName: string, timeout: number | null = null): Promise<Record<string, any> | null> {
    const t0 = Date.now();
    let nextEvent: Record<string, any> | undefined;
    this.onNext(eventName, (event) => (nextEvent = event));
    
    while (!nextEvent) {
      if (timeout) {
        const t1 = Date.now();
        if (t1 - t0 > timeout) {
          return null;
        }
      }
      await sleep(1);
    }
    return nextEvent;
  }

  /**
   * Protected method to emit events to all registered handlers.
   * Calls both persistent and one-time handlers, then removes the one-time handlers.
   * 
   * @protected
   * @param {string} eventName - Name of the event to emit
   * @param {any} event - Event data to pass to handlers
   * @returns {true} Always returns true
   */
  protected emit(eventName: string, event: any): true {
    const handlers = [...(this.eventHandlers[eventName] || [])];
    for (const handler of handlers) {
      handler(event);
    }
    const nextHandlers = [...(this.nextEventHandlers[eventName] || [])];
    for (const nextHandler of nextHandlers) {
      nextHandler(event);
    }
    delete this.nextEventHandlers[eventName];
    return true;
  }
} 