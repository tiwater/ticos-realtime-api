import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealtimeClient } from '../src/core/client';
import type { w3cwebsocket as WebSocketType } from 'websocket';

describe('RealtimeClient (Browser)', () => {
  let client: RealtimeClient;
  let realtimeEvents: any[] = [];

  beforeEach(async () => {
    const WebSocket = (await import('websocket')).default.w3cwebsocket;
    (globalThis as any).WebSocket = WebSocket;
    (globalThis as any).document = {};
  });

  afterEach(async () => {
    (globalThis as any).WebSocket = undefined;
    (globalThis as any).document = undefined;
  });

  it('Should fail to instantiate the RealtimeClient when "dangerouslyAllowAPIKeyInBrowser" is not set', () => {
    let err: Error | undefined;

    try {
      client = new RealtimeClient({
        url: 'wss://stardust.ticos.cn/realtime',
        apiKey: 'test-api-key',
        debug: false,
      });
    } catch (e) {
      err = e as Error;
    }

    expect(err).to.exist;
    expect(err!.message).to.contain('Can not provide API key in the browser');
  });

  it('Should instantiate the RealtimeClient when "dangerouslyAllowAPIKeyInBrowser" is set', () => {
    let err: Error | undefined;

    try {
      client = new RealtimeClient({
        url: 'wss://stardust.ticos.cn/realtime',
        apiKey: 'test-api-key',
        dangerouslyAllowAPIKeyInBrowser: true,
        debug: false,
      });
    } catch (e) {
      err = e as Error;
    }

    expect(err).to.not.exist;
    expect(client).to.exist;
  });
});