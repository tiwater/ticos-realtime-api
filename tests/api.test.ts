import { describe, it, after } from 'mocha';
import { expect } from 'chai';
import { RealtimeAPI } from '../src/api';

describe('RealtimeAPI', () => {
  let realtime: RealtimeAPI;
  const debug = false;

  it('Should instantiate the RealtimeAPI with no apiKey', () => {
    realtime = new RealtimeAPI({ debug });
    expect(realtime).to.exist;
    expect(realtime.apiKey).to.not.exist;
  });

  it('Should fail to connect to the RealtimeAPI with no apiKey', async () => {
    await realtime.connect();
    const event = await realtime.waitForNext('server.error', 1000);

    expect(event).to.exist;
    expect(event.error).to.exist;
    expect(event.error.message).to.contain('Incorrect API key provided');
  });

  it('Should instantiate the RealtimeAPI', () => {
    realtime = new RealtimeAPI({
      apiKey: process.env.OPENAI_API_KEY,
      debug,
    });

    expect(realtime).to.exist;
    expect(realtime.apiKey).to.equal(process.env.OPENAI_API_KEY);
  });

  it('Should connect to the RealtimeAPI', async () => {
    const isConnected = await realtime.connect();

    expect(isConnected).to.equal(true);
    expect(realtime.isConnected()).to.equal(true);
  });

  it('Should close the RealtimeAPI connection', async () => {
    realtime.disconnect();
    expect(realtime.isConnected()).to.equal(false);
  });

  after(() => {
    realtime?.isConnected() && realtime.disconnect();
  });
}); 