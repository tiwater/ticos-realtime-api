import { AudioAnalysis } from './analysis/audio_analysis';
import { WavPacker, WavPackerAudioType } from './wav_packer';

export interface DecodedAudioType {
  blob: Blob;
  url: string;
  values: Float32Array;
  audioBuffer: AudioBuffer;
}

export class WavRecorder {
  private scriptSrc: string;
  private sampleRate: number;
  private outputToSpeakers: boolean;
  private debug: boolean;
  private _deviceChangeCallback: (() => void) | null;
  private _devices: MediaDeviceInfo[];
  private stream: MediaStream | null;
  private processor: AudioWorkletNode | null;
  private source: MediaStreamAudioSourceNode | null;
  private node: AudioNode | null;
  private recording: boolean;
  private _lastEventId: number;
  private eventReceipts: { [key: number]: any };
  private eventTimeout: number;
  private _chunkProcessor: (data: { mono: Int16Array; raw: Int16Array }) => any;
  private _chunkProcessorSize: number | undefined;
  private _chunkProcessorBuffer: { raw: ArrayBuffer; mono: ArrayBuffer };
  private analyser: AnalyserNode | null;
  constructor({
    sampleRate = 44100,
    outputToSpeakers = false,
    debug = false,
  }: {
    sampleRate?: number;
    outputToSpeakers?: boolean;
    debug?: boolean;
  } = {}) {
    this.scriptSrc = '/audio-processor.js';
    this.sampleRate = sampleRate;
    this.outputToSpeakers = outputToSpeakers;
    this.debug = !!debug;
    this._deviceChangeCallback = null;
    this._devices = [];
    this.stream = null;
    this.processor = null;
    this.source = null;
    this.node = null;
    this.analyser = null;
    this.recording = false;
    this._lastEventId = 0;
    this.eventReceipts = {};
    this.eventTimeout = 5000;
    this._chunkProcessor = () => {};
    this._chunkProcessorSize = undefined;
    this._chunkProcessorBuffer = {
      raw: new ArrayBuffer(0),
      mono: new ArrayBuffer(0),
    };
  }

  static async decode(
    audioData: Blob | Float32Array | Int16Array | ArrayBuffer | number[],
    sampleRate: number = 44100,
    fromSampleRate: number = -1
  ): Promise<DecodedAudioType> {
    const context = new AudioContext({ sampleRate });
    let arrayBuffer: ArrayBuffer;
    let blob: Blob;

    if (audioData instanceof Blob) {
      if (fromSampleRate !== -1) {
        throw new Error(
          `Can not specify "fromSampleRate" when reading from Blob`
        );
      }
      blob = audioData;
      arrayBuffer = await blob.arrayBuffer();
    } else if (audioData instanceof ArrayBuffer) {
      if (fromSampleRate !== -1) {
        throw new Error(
          `Can not specify "fromSampleRate" when reading from ArrayBuffer`
        );
      }
      arrayBuffer = audioData;
      blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    } else {
      let float32Array: Float32Array;
      let data: Int16Array | undefined;

      if (audioData instanceof Int16Array) {
        data = audioData;
        float32Array = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          float32Array[i] = (audioData[i] ?? 0) / 0x8000;
        }
      } else if (audioData instanceof Float32Array) {
        float32Array = audioData;
      } else if (Array.isArray(audioData)) {
        float32Array = new Float32Array(audioData);
      } else {
        throw new Error(
          `"audioData" must be one of: Blob, Float32Array, Int16Array, ArrayBuffer, Array<number>`
        );
      }

      if (fromSampleRate === -1) {
        throw new Error(
          `Must specify "fromSampleRate" when reading from Float32Array, Int16Array or Array`
        );
      } else if (fromSampleRate < 3000) {
        throw new Error(`Minimum "fromSampleRate" is 3000 (3kHz)`);
      }

      if (!data) {
        data = new Int16Array(WavPacker.floatTo16BitPCM(float32Array));
      }

      const audio = {
        bitsPerSample: 16,
        channels: [float32Array],
        data,
      };

      const packer = new WavPacker();
      const result = packer.pack(fromSampleRate, audio);
      blob = result.blob;
      arrayBuffer = await blob.arrayBuffer();
    }

    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const values = audioBuffer.getChannelData(0);
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      values,
      audioBuffer,
    };
  }

  log(...args: any[]): true {
    if (this.debug) {
      console.log(...args);
    }
    return true;
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  getStatus(): 'ended' | 'paused' | 'recording' {
    if (!this.processor) {
      return 'ended';
    } else if (!this.recording) {
      return 'paused';
    } else {
      return 'recording';
    }
  }

  async _event(
    name: string,
    data: { [key: string]: any } = {},
    _processor: AudioWorkletNode | null = null
  ): Promise<{ [key: string]: any }> {
    _processor = _processor || this.processor;
    if (!_processor) {
      throw new Error('Cannot send events without recording first');
    }
    const message = {
      event: name,
      id: this._lastEventId++,
      data,
    };
    _processor.port.postMessage(message);
    const t0 = new Date().valueOf();
    while (!this.eventReceipts[message.id]) {
      if (new Date().valueOf() - t0 > this.eventTimeout) {
        throw new Error(`Timeout waiting for "${name}" event`);
      }
      await new Promise((res) => setTimeout(() => res(true), 1));
    }
    const payload = this.eventReceipts[message.id];
    delete this.eventReceipts[message.id];
    return payload;
  }

  listenForDeviceChange(
    callback: ((devices: MediaDeviceInfo[]) => void) | null
  ): true {
    if (callback === null && this._deviceChangeCallback) {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        this._deviceChangeCallback
      );
      this._deviceChangeCallback = null;
    } else if (callback !== null) {
      let lastId = 0;
      let lastDevices: MediaDeviceInfo[] = [];
      const serializeDevices = (devices: MediaDeviceInfo[]) =>
        devices
          .map((d) => d.deviceId)
          .sort()
          .join(',');
      const cb = async () => {
        let id = ++lastId;
        const devices = await this.listDevices();
        if (id === lastId) {
          if (serializeDevices(lastDevices) !== serializeDevices(devices)) {
            lastDevices = devices;
            callback(devices.slice());
          }
        }
      };
      navigator.mediaDevices.addEventListener('devicechange', cb);
      cb();
      this._deviceChangeCallback = cb;
    }
    return true;
  }

  async listDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'audioinput');
  }

  async requestPermission(deviceId?: string): Promise<true> {
    try {
      const config: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };
      if (deviceId) {
        (config.audio as MediaTrackConstraints).deviceId = { exact: deviceId };
      }
      this.stream = await navigator.mediaDevices.getUserMedia(config);
    } catch (err) {
      throw new Error('Could not start media stream');
    }

    const context = new AudioContext({ sampleRate: this.sampleRate });
    const source = context.createMediaStreamSource(this.stream);
    try {
      await context.audioWorklet.addModule(this.scriptSrc);
    } catch (e) {
      console.error(e);
      throw new Error(`Could not add audioWorklet module: ${this.scriptSrc}`);
    }
    const processor = new AudioWorkletNode(context, 'audio_processor');
    processor.port.onmessage = (e) => {
      const { event, id, data } = e.data;
      if (event === 'receipt') {
        this.eventReceipts[id] = data;
      } else if (event === 'chunk') {
        if (this._chunkProcessorSize) {
          const buffer = this._chunkProcessorBuffer;
          this._chunkProcessorBuffer = {
            raw: WavPacker.mergeBuffers(buffer.raw, data.raw),
            mono: WavPacker.mergeBuffers(buffer.mono, data.mono),
          };
          if (
            this._chunkProcessorBuffer.mono.byteLength >=
            this._chunkProcessorSize
          ) {
            this._chunkProcessor({
              mono: new Int16Array(this._chunkProcessorBuffer.mono),
              raw: new Int16Array(this._chunkProcessorBuffer.raw),
            });
            this._chunkProcessorBuffer = {
              raw: new ArrayBuffer(0),
              mono: new ArrayBuffer(0),
            };
          }
        } else {
          this._chunkProcessor(data);
        }
      }
    };

    const node = source.connect(processor);
    const analyser = context.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.1;
    node.connect(analyser);
    if (this.outputToSpeakers) {
      console.warn(
        'Warning: Output to speakers may affect sound quality,\n' +
          'especially due to system audio feedback preventative measures.\n' +
          'use only for debugging'
      );
      analyser.connect(context.destination);
    }

    this.source = source;
    this.node = node;
    this.analyser = analyser;
    this.processor = processor;
    return true;
  }

  async begin(deviceId?: string): Promise<true> {
    if (this.processor) {
      throw new Error(
        `Already connected: please call .end() to start a new session`
      );
    }

    if (
      !navigator.mediaDevices ||
      !('getUserMedia' in navigator.mediaDevices)
    ) {
      throw new Error('Could not request user media');
    }
    try {
      const config: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };
      if (deviceId) {
        (config.audio as MediaTrackConstraints).deviceId = { exact: deviceId };
      }
      this.stream = await navigator.mediaDevices.getUserMedia(config);
    } catch (err) {
      throw new Error('Could not start media stream');
    }

    const context = new AudioContext({ sampleRate: this.sampleRate });
    const source = context.createMediaStreamSource(this.stream);
    // Load and execute the module script.
    try {
      await context.audioWorklet.addModule(this.scriptSrc);
    } catch (e) {
      console.error(e);
      throw new Error(`Could not add audioWorklet module: ${this.scriptSrc}`);
    }
    const processor = new AudioWorkletNode(context, 'audio_processor');
    processor.port.onmessage = (e: MessageEvent) => {
      const { event, id, data } = e.data;
      if (event === 'receipt') {
        this.eventReceipts[id] = data;
      } else if (event === 'chunk') {
        if (this._chunkProcessorSize) {
          const buffer = this._chunkProcessorBuffer;
          this._chunkProcessorBuffer = {
            raw: WavPacker.mergeBuffers(buffer.raw, data.raw),
            mono: WavPacker.mergeBuffers(buffer.mono, data.mono),
          };
          if (
            this._chunkProcessorBuffer.mono.byteLength >=
            this._chunkProcessorSize
          ) {
            this._chunkProcessor({
              mono: new Int16Array(this._chunkProcessorBuffer.mono),
              raw: new Int16Array(this._chunkProcessorBuffer.raw),
            });
            this._chunkProcessorBuffer = {
              raw: new ArrayBuffer(0),
              mono: new ArrayBuffer(0),
            };
          }
        } else {
          this._chunkProcessor(data);
        }
      }
    };

    const node = source.connect(processor);
    const analyser = context.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.1;
    node.connect(analyser);
    if (this.outputToSpeakers) {
      console.warn(
        'Warning: Output to speakers may affect sound quality,\n' +
          'especially due to system audio feedback preventative measures.\n' +
          'use only for debugging'
      );
      analyser.connect(context.destination);
    }

    this.source = source;
    this.node = node;
    this.analyser = analyser;
    this.processor = processor;
    return true;
  }

  getFrequencies(
    analysisType: 'frequency' | 'music' | 'voice' = 'frequency',
    minDecibels: number = -100,
    maxDecibels: number = -30
  ) {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    }
    return AudioAnalysis.getFrequencies(
      this.analyser!,
      this.sampleRate,
      undefined,
      analysisType,
      minDecibels,
      maxDecibels
    );
  }

  async pause(): Promise<true> {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    } else if (!this.recording) {
      throw new Error('Already paused: please call .record() first');
    }
    if (this._chunkProcessorBuffer.raw.byteLength) {
      this._chunkProcessor({
        mono: new Int16Array(this._chunkProcessorBuffer.mono),
        raw: new Int16Array(this._chunkProcessorBuffer.raw),
      });
    }
    this.log('Pausing ...');
    await this._event('stop');
    this.recording = false;
    return true;
  }

  async record(
    chunkProcessor: (data: {
      mono: Int16Array;
      raw: Int16Array;
    }) => any = () => {},
    chunkSize: number = 8192
  ): Promise<true> {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    } else if (this.recording) {
      throw new Error('Already recording: please call .pause() first');
    } else if (typeof chunkProcessor !== 'function') {
      throw new Error(`chunkProcessor must be a function`);
    }
    this._chunkProcessor = chunkProcessor;
    this._chunkProcessorSize = chunkSize;
    this._chunkProcessorBuffer = {
      raw: new ArrayBuffer(0),
      mono: new ArrayBuffer(0),
    };
    this.log('Recording ...');
    await this._event('start');
    this.recording = true;
    return true;
  }

  async clear(): Promise<true> {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    }
    await this._event('clear');
    return true;
  }

  async read(): Promise<{
    meanValues: Float32Array;
    channels: Float32Array[];
  }> {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    }
    this.log('Reading ...');
    const result = await this._event('read');
    if (!result.meanValues || !result.channels) {
      throw new Error('Invalid data received from read event');
    }
    return result as { meanValues: Float32Array; channels: Float32Array[] };
  }

  async save(force: boolean = false): Promise<WavPackerAudioType> {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    }
    if (!force && this.recording) {
      throw new Error(
        'Currently recording: please call .pause() first, or call .save(true) to force'
      );
    }
    this.log('Exporting ...');
    const exportData = await this._event('export');
    const packer = new WavPacker();
    const result = packer.pack(this.sampleRate, exportData.audio);
    return result;
  }

  async end(): Promise<WavPackerAudioType> {
    if (!this.processor) {
      throw new Error('Session ended: please call .begin() first');
    }

    const _processor = this.processor;

    this.log('Stopping ...');
    await this._event('stop');
    this.recording = false;
    const tracks = this.stream?.getTracks();
    tracks?.forEach((track) => track.stop());

    this.log('Exporting ...');
    const exportData = await this._event('export', {}, _processor);

    this.processor?.disconnect();
    this.source?.disconnect();
    this.node?.disconnect();
    this.analyser?.disconnect();
    this.stream = null;
    this.processor = null;
    this.source = null;
    this.node = null;

    const packer = new WavPacker();
    const result = packer.pack(this.sampleRate, exportData.audio);
    return result;
  }

  async quit(): Promise<true> {
    this.listenForDeviceChange(null);
    if (this.processor) {
      await this.end();
    }
    return true;
  }
}
