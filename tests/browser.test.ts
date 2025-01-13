import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { RealtimeClient } from '../src';
import type { w3cwebsocket as WebSocketType } from 'websocket';

describe('RealtimeClient (Browser)', () => {
  let client: RealtimeClient;
  let realtimeEvents: any[] = [];

  before(async () => {
    const WebSocket = (await import('websocket')).default.w3cwebsocket;
    (globalThis as any).WebSocket = WebSocket;
    (globalThis as any).document = {};
  });

  after(async () => {
    (globalThis as any).WebSocket = undefined;
    (globalThis as any).document = undefined;
  });

  it('Should fail to instantiate the RealtimeClient when "dangerouslyAllowAPIKeyInBrowser" is not set', () => {
    let err: Error | undefined;

    try {
      client = new RealtimeClient({
        apiKey: process.env.OPENAI_API_KEY,
        debug: false,
      });
    } catch (e) {
      err = e as Error;
    }

    expect(err).to.exist;
    expect(err!.message).to.contain('Can not provide API key in the browser');
  });

  // ... rest of the tests remain similar with added types
}); 