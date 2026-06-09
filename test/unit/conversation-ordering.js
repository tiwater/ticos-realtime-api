import * as chai from 'chai';

import { RealtimeConversation } from '../../lib/conversation.js';

const expect = chai.expect;

function messageItem(id, role, content = []) {
  return {
    id,
    type: 'message',
    role,
    content,
  };
}

describe('RealtimeConversation item ordering', () => {
  it('keeps a user transcription before an assistant item that arrived first', () => {
    const conversation = new RealtimeConversation();

    conversation.processEvent({
      event_id: 'evt_assistant_created',
      type: 'conversation.item.created',
      previous_item_id: 'item_user',
      item: messageItem('item_assistant', 'assistant', [
        { type: 'audio', transcript: '' },
      ]),
    });

    conversation.processEvent({
      event_id: 'evt_transcript_done',
      type: 'conversation.item.input_audio_transcription.completed',
      item_id: 'item_user',
      content_index: 0,
      transcript: '你好',
    });

    conversation.processEvent({
      event_id: 'evt_user_created',
      type: 'conversation.item.created',
      previous_item_id: null,
      item: messageItem('item_user', 'user', [
        { type: 'input_audio', transcript: null },
      ]),
    });

    const items = conversation.getItems();
    expect(items.map((item) => item.id)).to.deep.equal([
      'item_user',
      'item_assistant',
    ]);
    expect(items[0].formatted.transcript).to.equal('你好');
  });
});
