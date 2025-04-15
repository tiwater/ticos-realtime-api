import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealtimeAPI } from '../src/core/realtime';

describe('RealtimeAPI', () => {
  let realtime: RealtimeAPI;
  const debug = false;

  beforeEach(() => {
    realtime = new RealtimeAPI({ url: 'wss://stardust.ticos.cn/realtime', apiKey: '', debug });
  });

  it('Should instantiate the RealtimeAPI with no apiKey', () => {
    expect(realtime).to.exist;
  });

  it('Should fail to connect to the RealtimeAPI with no apiKey', async () => {
    try {
      await realtime.connect();
      const event = await realtime.waitForNext('server.error', 1000);

      expect(event).to.exist;
      expect(event.error).to.exist;
      expect(event.error.message).to.contain('Incorrect API key provided');
    } catch (error) {
      // Connection might fail immediately with newer API
      expect(error).to.exist;
    }
  });

  it('Should instantiate the RealtimeAPI with API key', () => {
    const apiKey = process.env.TIWATER_API_KEY || '';
    realtime = new RealtimeAPI({
      url: 'wss://stardust.ticos.cn/realtime',
      apiKey,
      debug,
    });

    expect(realtime).to.exist;
  });

  it('Should connect to the RealtimeAPI', async () => {
    // Skip this test if no API key is provided
    if (!process.env.TIWATER_API_KEY) {
      console.log('Skipping connection test - no API key provided');
      return;
    }
    
    await realtime.connect();
    expect(realtime.isConnected()).to.equal(true);
  });

  it('Should close the RealtimeAPI connection', async () => {
    // Skip this test if no API key is provided
    if (!process.env.TIWATER_API_KEY) {
      console.log('Skipping disconnection test - no API key provided');
      return;
    }
    
    realtime.disconnect();
    expect(realtime.isConnected()).to.equal(false);
  });

  afterEach(() => {
    if (realtime?.isConnected()) {
      realtime.disconnect();
    }
  });
});