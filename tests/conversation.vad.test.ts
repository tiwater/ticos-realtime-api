import { describe, it, expect } from 'vitest';
import { RealtimeConversation } from '../src/core/conversation';

describe('RealtimeConversation (server_vad)', () => {
  it('clamps speech_stopped slice bounds to available audio', () => {
    const conversation = new RealtimeConversation();
    const inputAudioBuffer = new Int16Array(2400); // 100ms @ 24kHz

    conversation.processEvent({
      event_id: 'evt_1',
      type: 'input_audio_buffer.speech_started',
      item_id: 'item_1',
      audio_start_ms: 0,
    });

    // End time extends beyond local buffer length (150ms -> 3600 samples)
    conversation.processEvent(
      {
        event_id: 'evt_2',
        type: 'input_audio_buffer.speech_stopped',
        item_id: 'item_1',
        audio_end_ms: 150,
      },
      inputAudioBuffer,
    );

    const speech = (conversation as any).queuedSpeechItems['item_1'];
    expect(speech).to.exist;
    expect(speech.audio).to.exist;
    expect(speech.audio).to.be.instanceOf(Int16Array);
    expect(speech.audio.length).to.equal(inputAudioBuffer.length);
  });
});

