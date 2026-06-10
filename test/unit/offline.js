import assert from 'node:assert/strict';

import { RealtimeAPI, RealtimeClient, RealtimeUtils } from '../../index.js';

function decodeBase64(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function testBrowserCustomUrlConnection() {
  const originalWebSocket = globalThis.WebSocket;
  const originalDocument = globalThis.document;
  const calls = [];

  class FakeWebSocket {
    constructor(url, protocols) {
      this.url = url;
      this.protocols = protocols;
      this.listeners = {};
      calls.push({ url, protocols });
      queueMicrotask(() => this.listeners.open?.forEach((handler) => handler()));
    }

    addEventListener(eventName, handler) {
      this.listeners[eventName] ||= [];
      this.listeners[eventName].push(handler);
    }

    removeEventListener(eventName, handler) {
      this.listeners[eventName] = (this.listeners[eventName] || []).filter(
        (current) => current !== handler,
      );
    }

    close() {}

    send() {}
  }

  globalThis.WebSocket = FakeWebSocket;
  globalThis.document = {};
  try {
    const realtime = new RealtimeAPI({
      url: 'wss://stardust.example.com/realtime?terminal_secret=test',
    });
    await realtime.connect();

    assert.equal(
      calls[0].url,
      'wss://stardust.example.com/realtime?terminal_secret=test',
    );
    assert.deepEqual(calls[0].protocols, ['realtime']);
    realtime.disconnect();
  } finally {
    globalThis.WebSocket = originalWebSocket;
    globalThis.document = originalDocument;
  }
}

function testOpenAIConnectionHelpers() {
  const realtime = new RealtimeAPI({ apiKey: 'test-key' });

  assert.equal(
    realtime._buildConnectionUrl({
      model: 'gpt-4o-realtime-preview-2024-10-01',
    }),
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
  );
  assert.deepEqual(realtime._buildBrowserProtocols(), [
    'realtime',
    'openai-insecure-api-key.test-key',
    'openai-beta.realtime-v1',
  ]);
  assert.deepEqual(realtime._buildNodeOptions(), {
    headers: {
      Authorization: 'Bearer test-key',
      'OpenAI-Beta': 'realtime=v1',
    },
  });
}

function testStardustToolSync() {
  const client = new RealtimeClient({
    url: 'wss://stardust.example.com/realtime?terminal_secret=test',
  });
  const sent = [];
  client.realtime.isConnected = () => true;
  client.realtime.send = (type, data) => sent.push({ type, data });

  client.addTool(
    {
      name: 'get_weather',
      description: 'Gets weather',
      parameters: { type: 'object', properties: {} },
    },
    () => ({ ok: true }),
  );

  assert.equal(sent.at(-1).type, 'session.update');
  assert.deepEqual(sent.at(-1).data.session.model.tools, [
    {
      type: 'function',
      name: 'get_weather',
      description: 'Gets weather',
      parameters: { type: 'object', properties: {} },
    },
  ]);

  client.removeTool('get_weather');

  assert.equal(sent.at(-1).type, 'session.update');
  assert.deepEqual(sent.at(-1).data.session.model.tools, []);
}

function testStardustNullClearsConfig() {
  const client = new RealtimeClient({
    url: 'wss://stardust.example.com/realtime?terminal_secret=test',
  });
  const sent = [];
  client.realtime.isConnected = () => true;
  client.realtime.send = (type, data) => sent.push({ type, data });

  client.updateSession(
    {
      agent_id: null,
      knowledge: null,
      speech: null,
      hearing: { turn_detection: null },
    },
    'stardust',
  );

  const session = sent.at(-1).data.session;
  assert.equal(session.agent_id, null);
  assert.equal(session.knowledge, null);
  assert.equal(session.speech, null);
  assert.equal(session.hearing.turn_detection, null);
}

function testTypedArrayViewBase64() {
  const source = new Int16Array([1000, 2000, 3000, 4000]);
  const view = new Int16Array(source.buffer, 2, 2);
  const bytes = decodeBase64(RealtimeUtils.arrayBufferToBase64(view));
  const decoded = new Int16Array(bytes.buffer);

  assert.deepEqual(Array.from(decoded), [2000, 3000]);
}

await testBrowserCustomUrlConnection();
testOpenAIConnectionHelpers();
testStardustToolSync();
testStardustNullClearsConfig();
testTypedArrayViewBase64();

console.log('offline unit tests passed');
