const OCTAVE_8_FREQUENCIES = [
  4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93,
  6644.88, 7040.0, 7458.62, 7902.13,
];

const OCTAVE_8_FREQUENCY_LABELS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const noteFrequencies: number[] = [];
export const noteFrequencyLabels: string[] = [];

for (let octave = 1; octave <= 8; octave++) {
  OCTAVE_8_FREQUENCIES.forEach((frequency, index) => {
    const label = OCTAVE_8_FREQUENCY_LABELS[index];
    noteFrequencies.push(frequency / Math.pow(2, 8 - octave));
    noteFrequencyLabels.push(`${label}${octave}`);
  });
}

const VOICE_FREQUENCY_RANGE: [number, number] = [32.0, 2000.0];

export const voiceFrequencies = noteFrequencies.filter(
  (frequency) =>
    frequency > VOICE_FREQUENCY_RANGE[0] && frequency < VOICE_FREQUENCY_RANGE[1]
);

export const voiceFrequencyLabels = noteFrequencyLabels.filter(
  (_, index) =>
    noteFrequencies[index] !== undefined &&
    noteFrequencies[index] > VOICE_FREQUENCY_RANGE[0] &&
    noteFrequencies[index] < VOICE_FREQUENCY_RANGE[1]
);
