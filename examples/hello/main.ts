import { RealtimeClient, TicosConfig } from '../../src';
import Speaker from 'speaker';
import { Readable } from 'stream';

async function main() {
  const config = new TicosConfig({
    model: {
      modalities: ['text', 'audio'],

      provider: 'tiwater',
      name: 'stardust-2.5-pro'
    },
    speech: {
      voice: 'verse'
    },
    hearing: {
      turn_detection: 'auto'
    }
  });
  const client = new RealtimeClient({
    url: 'wss://stardust.ticos.cn/realtime',
    apiKey: 'your-api-key' // Replace with your API key
  }, config);

  // Connect to server
  await client.connect();
  console.log('Connected to server');

  client.updateConfig({
    model: {
      provider: 'tiwater',
      name: 'stardust-2.5-pro'
    },
    hearing: {
      turn_detection: 'auto'
    }
  });

  // Send a text message
  client.sendUserMessageContent([{
    type: 'text',
    text: 'hello'
  }]);
  console.log('Sent message: hello');

  // Set up speaker for audio playback
  let speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 24000,
  });

  // Handle incoming audio messages
  client.on('conversation.item.completed', ({ item }) => {
    if (item.type === 'message' && item.role === 'assistant' && item.formatted && item.formatted.audio) {
      console.log('Playing audio response...');
      
      // Convert audio data to buffer and play
      const buffer = Buffer.from(item.formatted.audio.buffer);
      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });

      readableStream.pipe(speaker);
      console.log('Audio sent to speaker');

      speaker.on('close', () => {
        console.log('Speaker closed. Recreating for next playback.');
        speaker = new Speaker({
          channels: 1,
          bitDepth: 16,
          sampleRate: 24000,
        });
      });
    }
  });

  client.on('realtime.event', (event) => {
    console.log('Received event:', event);
  });
}

main().catch(console.error); 