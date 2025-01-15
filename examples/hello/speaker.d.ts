declare module 'speaker' {
  import { Writable } from 'stream';
  
  interface SpeakerOptions {
    channels?: number;
    bitDepth?: number;
    sampleRate?: number;
    signed?: boolean;
    float?: boolean;
    device?: string;
  }

  class Speaker extends Writable {
    constructor(opts?: SpeakerOptions);
  }

  export = Speaker;
} 