type EventHandlerCallbackType = (event: Record<string, any>) => void;

const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

export class RealtimeEventHandler {
  private eventHandlers: Record<string, EventHandlerCallbackType[]> = {};
  private nextEventHandlers: Record<string, EventHandlerCallbackType[]> = {};

  public clearEventHandlers(): true {
    this.eventHandlers = {};
    this.nextEventHandlers = {};
    return true;
  }

  public on(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    this.eventHandlers[eventName].push(callback);
    return callback;
  }

  public onNext(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType {
    this.nextEventHandlers[eventName] = this.nextEventHandlers[eventName] || [];
    this.nextEventHandlers[eventName].push(callback);
    return callback;
  }

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