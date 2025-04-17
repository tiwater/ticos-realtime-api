import {
  AudioAnalysis,
  AudioAnalysisOutputType,
} from './analysis/audio_analysis';
import { StreamProcessorSrc } from './worklets/stream_processor';

export class WavStreamPlayer {
  private scriptSrc: string;
  private sampleRate: number;
  private context: AudioContext | null;
  private stream: AudioWorkletNode | null;
  private analyser: AnalyserNode | null;
  private trackSampleOffsets: {
    [key: string]: {
      trackId: string | null;
      offset: number;
      currentTime: number;
    };
  };
  private interruptedTrackIds: { [key: string]: boolean };

  constructor({ sampleRate = 44100 }: { sampleRate?: number } = {}) {
    this.scriptSrc = StreamProcessorSrc;
    this.sampleRate = sampleRate;
    this.context = null;
    this.stream = null;
    this.analyser = null;
    this.trackSampleOffsets = {};
    this.interruptedTrackIds = {};
  }

  async connect(): Promise<true> {
    this.context = new AudioContext({ sampleRate: this.sampleRate });
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    try {
      await this.context.audioWorklet.addModule(this.scriptSrc);
    } catch (e) {
      console.error(e);
      throw new Error(`Could not add audioWorklet module: ${this.scriptSrc}`);
    }
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.1;
    this.analyser = analyser;
    return true;
  }

  getFrequencies(
    analysisType: 'frequency' | 'music' | 'voice' = 'frequency',
    minDecibels: number = -100,
    maxDecibels: number = -30
  ): AudioAnalysisOutputType {
    if (!this.analyser) {
      throw new Error('Not connected, please call .connect() first');
    }
    return AudioAnalysis.getFrequencies(
      this.analyser,
      this.sampleRate,
      undefined,
      analysisType,
      minDecibels,
      maxDecibels
    );
  }

  private _start(): true {
    const streamNode = new AudioWorkletNode(this.context!, 'stream_processor');
    streamNode.connect(this.context!.destination);
    streamNode.port.onmessage = (e) => {
      const { event } = e.data;
      if (event === 'stop') {
        streamNode.disconnect();
        this.stream = null;
      } else if (event === 'offset') {
        const { requestId, trackId, offset } = e.data;
        const currentTime = offset / this.sampleRate;
        this.trackSampleOffsets[requestId] = { trackId, offset, currentTime };
      }
    };
    this.analyser!.disconnect();
    streamNode.connect(this.analyser!);
    this.stream = streamNode;
    return true;
  }

  add16BitPCM(
    arrayBuffer: ArrayBuffer | Int16Array,
    trackId: string = 'default'
  ): Int16Array | undefined {
    if (typeof trackId !== 'string') {
      throw new Error(`trackId must be a string`);
    } else if (this.interruptedTrackIds[trackId]) {
      return;
    }
    if (!this.stream) {
      this._start();
    }
    let buffer: Int16Array;
    if (arrayBuffer instanceof Int16Array) {
      buffer = arrayBuffer;
    } else if (arrayBuffer instanceof ArrayBuffer) {
      buffer = new Int16Array(arrayBuffer);
    } else {
      throw new Error(`argument must be Int16Array or ArrayBuffer`);
    }
    this.stream!.port.postMessage({ event: 'write', buffer, trackId });
    return buffer;
  }

  async getTrackSampleOffset(interrupt: boolean = false): Promise<{
    trackId: string | null;
    offset: number;
    currentTime: number;
  } | null> {
    if (!this.stream) {
      return null;
    }
    const requestId = crypto.randomUUID();
    this.stream.port.postMessage({
      event: interrupt ? 'interrupt' : 'offset',
      requestId,
    });
    let trackSampleOffset;
    while (!trackSampleOffset) {
      trackSampleOffset = this.trackSampleOffsets[requestId];
      await new Promise<void>((r) => setTimeout(() => r(), 1));
    }
    const { trackId } = trackSampleOffset;
    if (interrupt && trackId) {
      this.interruptedTrackIds[trackId] = true;
    }
    return trackSampleOffset;
  }

  async interrupt(): Promise<{
    trackId: string | null;
    offset: number;
    currentTime: number;
  } | null> {
    return this.getTrackSampleOffset(true);
  }
}
