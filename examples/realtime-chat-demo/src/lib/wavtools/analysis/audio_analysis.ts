import {
  noteFrequencies,
  noteFrequencyLabels,
  voiceFrequencies,
  voiceFrequencyLabels,
} from './constants';

export interface AudioAnalysisOutputType {
  values: Float32Array;
  frequencies: number[];
  labels: string[];
}

export class AudioAnalysis {
  static getFrequencies(
    analyser: AnalyserNode,
    sampleRate: number,
    fftResult?: Float32Array,
    analysisType: 'frequency' | 'music' | 'voice' = 'frequency',
    minDecibels: number = -100,
    maxDecibels: number = -30
  ): AudioAnalysisOutputType {
    if (!fftResult) {
      fftResult = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(fftResult);
    }
    const nyquistFrequency = sampleRate / 2;
    const frequencyStep = (1 / fftResult.length) * nyquistFrequency;
    let outputValues: number[];
    let frequencies: number[];
    let labels: string[];
    if (analysisType === 'music' || analysisType === 'voice') {
      const useFrequencies =
        analysisType === 'voice' ? voiceFrequencies : noteFrequencies;
      const aggregateOutput = Array(useFrequencies.length).fill(minDecibels);
      for (let i = 0; i < fftResult.length; i++) {
        const frequency = i * frequencyStep;
        const amplitude = fftResult[i];
        for (let n = useFrequencies.length - 1; n >= 0; n--) {
          if (frequency > useFrequencies[n]!) {
            aggregateOutput[n] = Math.max(aggregateOutput[n], amplitude ?? 0);
            break;
          }
        }
      }
      outputValues = aggregateOutput;
      frequencies =
        analysisType === 'voice' ? voiceFrequencies : noteFrequencies;
      labels =
        analysisType === 'voice' ? voiceFrequencyLabels : noteFrequencyLabels;
    } else {
      outputValues = Array.from(fftResult);
      frequencies = outputValues.map((_, i) => frequencyStep * i);
      labels = frequencies.map((f) => `${f.toFixed(2)} Hz`);
    }
    const normalizedOutput = outputValues.map((v) => {
      return Math.max(
        0,
        Math.min((v - minDecibels) / (maxDecibels - minDecibels), 1)
      );
    });
    const values = new Float32Array(normalizedOutput);
    return {
      values,
      frequencies,
      labels,
    };
  }

  private fftResults: Float32Array[];
  private audio: HTMLAudioElement;
  private context: AudioContext | OfflineAudioContext;
  private analyser: AnalyserNode;
  private sampleRate: number;
  private audioBuffer: AudioBuffer | null;

  constructor(
    audioElement: HTMLAudioElement,
    audioBuffer: AudioBuffer | null = null
  ) {
    this.fftResults = [];
    if (audioBuffer) {
      const { length, sampleRate } = audioBuffer;
      const offlineAudioContext = new OfflineAudioContext({
        length,
        sampleRate,
      });
      const source = offlineAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      const analyser = offlineAudioContext.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.1;
      source.connect(analyser);
      const renderQuantumInSeconds = 1 / 60;
      const durationInSeconds = length / sampleRate;
      const analyze = (index: number) => {
        const suspendTime = renderQuantumInSeconds * index;
        if (suspendTime < durationInSeconds) {
          offlineAudioContext.suspend(suspendTime).then(() => {
            const fftResult = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(fftResult);
            this.fftResults.push(fftResult);
            analyze(index + 1);
          });
        }
        if (index === 1) {
          offlineAudioContext.startRendering();
        } else {
          offlineAudioContext.resume();
        }
      };
      source.start(0);
      analyze(1);
      this.audio = audioElement;
      this.context = offlineAudioContext;
      this.analyser = analyser;
      this.sampleRate = sampleRate;
      this.audioBuffer = audioBuffer;
    } else {
      const audioContext = new AudioContext();
      const track = audioContext.createMediaElementSource(audioElement);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.1;
      track.connect(analyser);
      analyser.connect(audioContext.destination);
      this.audio = audioElement;
      this.context = audioContext;
      this.analyser = analyser;
      this.sampleRate = this.context.sampleRate;
      this.audioBuffer = null;
    }
  }

  getFrequencies(
    analysisType: 'frequency' | 'music' | 'voice' = 'frequency',
    minDecibels: number = -100,
    maxDecibels: number = -30
  ): AudioAnalysisOutputType {
    let fftResult: Float32Array | undefined = undefined;
    if (this.audioBuffer && this.fftResults.length) {
      const pct = this.audio.currentTime / this.audio.duration;
      const index = Math.min(
        (pct * this.fftResults.length) | 0,
        this.fftResults.length - 1
      );
      fftResult = this.fftResults[index];
    }
    return AudioAnalysis.getFrequencies(
      this.analyser,
      this.sampleRate,
      fftResult,
      analysisType,
      minDecibels,
      maxDecibels
    );
  }

  async resumeIfSuspended(): Promise<true> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return true;
  }
}
