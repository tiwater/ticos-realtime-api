import { Event } from '../types/events';

/**
 * EventHandler callback type definition
 */
type EventHandlerCallbackType<T extends Event = Event> = (event: T) => void;

/**
 * Utility function to create a promise that resolves after a specified time
 */
const sleep = (t: number): Promise<void> => new Promise<void>((r) => setTimeout(() => r(), t));

/**
 * Checks if an event name matches a pattern
 * Supports '*' as a wildcard at the end of the pattern
 *
 * @param {string} pattern The pattern to match against
 * @param {string} eventName The event name to check
 * @returns {boolean} True if the event name matches the pattern
 */
const matchesPattern = (pattern: string, eventName: string): boolean => {
  if (pattern === '*') {
    return true; // Global wildcard matches everything
  }

  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return eventName.startsWith(prefix + '.');
  }

  return pattern === eventName;
};

/**
 * Base class for handling real-time events
 * Provides methods for subscribing to events, handling them once, and waiting for specific events.
 * Used by RealtimeAPI and RealtimeClient classes.
 */
export class RealtimeEventHandler {
  /** Event handlers for persistent event listeners */
  private eventHandlers: Record<string, EventHandlerCallbackType[]> = {};
  /** Event handlers for one-time event listeners */
  private nextEventHandlers: Record<string, EventHandlerCallbackType[]> = {};

  /**
   * Creates a new RealtimeEventHandler instance
   */
  constructor() {
    this.eventHandlers = {};
    this.nextEventHandlers = {};
  }

  /**
   * Clears all event handlers
   * @returns {boolean} Always returns true
   */
  public clearEventHandlers(): boolean {
    this.eventHandlers = {};
    this.nextEventHandlers = {};
    return true;
  }

  /**
   * Listen to specific events
   * @param {string} eventName The name of the event to listen to (supports wildcards with '*')
   * @param {EventHandlerCallbackType<T>} callback Code to execute on event
   * @returns {EventHandlerCallbackType<T>} The callback function
   */
  public on<T extends Event = Event>(
    eventName: string,
    callback: EventHandlerCallbackType<T>
  ): EventHandlerCallbackType<T> {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    // Type assertion needed because we're storing callbacks for different event types in the same array
    this.eventHandlers[eventName].push(callback as EventHandlerCallbackType);
    return callback;
  }

  /**
   * Listen for the next event of a specified type
   * @param {string} eventName The name of the event to listen to (supports wildcards with '*')
   * @param {EventHandlerCallbackType<T>} callback Code to execute on event
   * @returns {EventHandlerCallbackType<T>} The callback function
   */
  public onNext<T extends Event = Event>(
    eventName: string,
    callback: EventHandlerCallbackType<T>
  ): EventHandlerCallbackType<T> {
    this.nextEventHandlers[eventName] = this.nextEventHandlers[eventName] || [];
    // Type assertion needed because we're storing callbacks for different event types in the same array
    this.nextEventHandlers[eventName].push(callback as EventHandlerCallbackType);
    return callback;
  }

  /**
   * Turns off event listening for specific events
   * Calling without a callback will remove all listeners for the event
   * @param {string} eventName Event name to stop listening to
   * @param {EventHandlerCallbackType<T>} [callback] Optional specific callback to remove
   * @returns {boolean} Always returns true
   */
  public off<T extends Event = Event>(
    eventName: string,
    callback?: EventHandlerCallbackType<T>
  ): boolean {
    const handlers = this.eventHandlers[eventName] || [];
    if (callback) {
      const index = handlers.indexOf(callback as EventHandlerCallbackType);
      if (index === -1) {
        throw new Error(
          `Could not turn off specified event listener for "${eventName}": not found as a listener`
        );
      }
      handlers.splice(index, 1);
    } else {
      delete this.eventHandlers[eventName];
    }
    return true;
  }

  /**
   * Turns off event listening for the next event of a specific type
   * Calling without a callback will remove all listeners for the next event
   * @param {string} eventName Event name to stop listening to
   * @param {EventHandlerCallbackType<T>} [callback] Optional specific callback to remove
   * @returns {boolean} Always returns true
   */
  public offNext<T extends Event = Event>(
    eventName: string,
    callback?: EventHandlerCallbackType<T>
  ): boolean {
    const nextHandlers = this.nextEventHandlers[eventName] || [];
    if (callback) {
      const index = nextHandlers.indexOf(callback as EventHandlerCallbackType);
      if (index === -1) {
        throw new Error(
          `Could not turn off specified next event listener for "${eventName}": not found as a listener`
        );
      }
      nextHandlers.splice(index, 1);
    } else {
      delete this.nextEventHandlers[eventName];
    }
    return true;
  }

  /**
   * Waits for next event of a specific type and returns the payload
   * @param {string} eventName Event name to wait for
   * @param {number|null} [timeout=null] Optional timeout in milliseconds
   * @returns {Promise<T|null>} Promise that resolves with the event data or null if timed out
   */
  public async waitForNext<T extends Event = Event>(
    eventName: string,
    timeout: number | null = null
  ): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null;

      // Setup timeout if provided
      if (timeout !== null && timeout > 0) {
        timeoutId = setTimeout(() => {
          resolve(null);
        }, timeout);
      }

      // Register the event handler
      this.onNext<T>(eventName, (event) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(event);
      });
    });
  }

  /**
   * Executes all events in the order they were added, with .on() event handlers executing before .onNext() handlers
   * Supports wildcard patterns for event names using '*'
   *
   * @param {string} eventName Event name to dispatch
   * @param {T} event Event data to pass to handlers
   * @returns {boolean} Always returns true
   */
  public dispatch<T extends Event>(eventName: string, event: T): boolean {
    // Helper function to safely execute handlers
    const safeExecute = (handler: EventHandlerCallbackType, event: T) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for '${eventName}':`, error);
      }
    };

    // Process exact matches first
    if (this.eventHandlers[eventName]) {
      const handlers = [...this.eventHandlers[eventName]];
      for (const handler of handlers) {
        safeExecute(handler, event);
      }
    }

    if (this.nextEventHandlers[eventName]) {
      const nextHandlers = [...this.nextEventHandlers[eventName]];
      for (const nextHandler of nextHandlers) {
        safeExecute(nextHandler, event);
      }
      delete this.nextEventHandlers[eventName];
    }

    // Then process wildcard patterns
    for (const pattern in this.eventHandlers) {
      if (pattern !== eventName && matchesPattern(pattern, eventName)) {
        const handlers = [...this.eventHandlers[pattern]];
        for (const handler of handlers) {
          safeExecute(handler, event);
        }
      }
    }

    for (const pattern in this.nextEventHandlers) {
      if (pattern !== eventName && matchesPattern(pattern, eventName)) {
        const nextHandlers = [...this.nextEventHandlers[pattern]];
        for (const nextHandler of nextHandlers) {
          safeExecute(nextHandler, event);
        }
        delete this.nextEventHandlers[pattern];
      }
    }

    return true;
  }
}
