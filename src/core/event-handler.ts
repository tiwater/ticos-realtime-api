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
   * @param {string} eventName The name of the event to listen to
   * @param {EventHandlerCallbackType<T>} callback Code to execute on event
   * @returns {EventHandlerCallbackType<T>} The callback function
   */
  public on<T extends Event = Event>(eventName: string, callback: EventHandlerCallbackType<T>): EventHandlerCallbackType<T> {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    // Type assertion needed because we're storing callbacks for different event types in the same array
    this.eventHandlers[eventName].push(callback as EventHandlerCallbackType);
    return callback;
  }

  /**
   * Listen for the next event of a specified type
   * @param {string} eventName The name of the event to listen to
   * @param {EventHandlerCallbackType<T>} callback Code to execute on event
   * @returns {EventHandlerCallbackType<T>} The callback function
   */
  public onNext<T extends Event = Event>(eventName: string, callback: EventHandlerCallbackType<T>): EventHandlerCallbackType<T> {
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
  public off<T extends Event = Event>(eventName: string, callback?: EventHandlerCallbackType<T>): boolean {
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
  public offNext<T extends Event = Event>(eventName: string, callback?: EventHandlerCallbackType<T>): boolean {
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
  public async waitForNext<T extends Event = Event>(eventName: string, timeout: number | null = null): Promise<T | null> {
    const t0 = Date.now();
    let nextEvent: T | undefined;
    this.onNext<T>(eventName, (event) => (nextEvent = event));
    
    while (!nextEvent) {
      if (timeout !== null) {
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
   * Executes all events in the order they were added, with .on() event handlers executing before .onNext() handlers
   * @param {string} eventName Event name to dispatch
   * @param {T} event Event data to pass to handlers
   * @returns {boolean} Always returns true
   */
  public dispatch<T extends Event>(eventName: string, event: T): boolean {
    const handlers = Array.isArray(this.eventHandlers[eventName]) 
      ? [...this.eventHandlers[eventName]] 
      : [];
      
    for (const handler of handlers) {
      handler(event);
    }
    
    const nextHandlers = Array.isArray(this.nextEventHandlers[eventName]) 
      ? [...this.nextEventHandlers[eventName]] 
      : [];
      
    for (const nextHandler of nextHandlers) {
      nextHandler(event);
    }
    
    delete this.nextEventHandlers[eventName];
    return true;
  }
}
