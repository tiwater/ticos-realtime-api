import { describe, it, expect } from 'vitest';
import fs from 'fs';
import decodeAudio from 'audio-decode';
import { RealtimeClient } from '../src/core/client';
import { RealtimeUtils } from '../src/utils';

interface AudioSample {
  filename: string;
  base64?: string;
}

const samples: Record<string, string | AudioSample> = {
  'toronto-mp3': './tests/data/toronto.mp3',
};

describe('Audio samples tests', () => {
  let client: RealtimeClient;
  let realtimeEvents: any[] = [];

  it('Should load all audio samples', async () => {
    let err: Error | undefined;

    try {
      for (const key in samples) {
        const sample = samples[key];
        if (typeof sample === 'string') {
          const filename = sample;
          try {
            const audioFile = fs.readFileSync(filename);
            const audioBuffer = await decodeAudio(audioFile);
            const channelData = audioBuffer.getChannelData(0); // only accepts mono
            const base64 = RealtimeUtils.arrayBufferToBase64(channelData);
            samples[key] = { filename, base64 };
          } catch (e) {
            console.warn(`Could not load audio sample ${filename}: ${e}`);
          }
        }
      }
    } catch (e) {
      err = e as Error;
    }

    expect(err).to.not.exist;
  });

  // ... rest of the tests remain similar with added types
});