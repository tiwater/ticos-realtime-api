import { describe, it } from 'mocha';
import { expect } from 'chai';
import fs from 'fs';
import decodeAudio from 'audio-decode';
import { RealtimeClient, RealtimeUtils } from '../src';

interface AudioSample {
  filename: string;
  base64?: string;
}

const samples: Record<string, string | AudioSample> = {
  'toronto-mp3': './test/samples/toronto.mp3',
};

describe('Audio samples tests', () => {
  let client: RealtimeClient;
  let realtimeEvents: any[] = [];

  it('Should load all audio samples', async () => {
    let err: Error | undefined;

    try {
      for (const key in samples) {
        const filename = samples[key] as string;
        const audioFile = fs.readFileSync(filename);
        const audioBuffer = await decodeAudio(audioFile);
        const channelData = audioBuffer.getChannelData(0); // only accepts mono
        const base64 = RealtimeUtils.arrayBufferToBase64(channelData);
        samples[key] = { filename, base64 };
      }
    } catch (e) {
      err = e as Error;
    }

    expect(err).to.not.exist;
  });

  // ... rest of the tests remain similar with added types
}); 