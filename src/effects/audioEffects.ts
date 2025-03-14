/**
 * Audio effects utilities for use with the useAudioRecorder hook
 */

/**
 * Available effects that can be applied to audio
 */
export enum AudioEffectType {
  None = 'none',
  Reverb = 'reverb',
  Echo = 'echo',
  Distortion = 'distortion',
  LowPass = 'lowpass',
  HighPass = 'highpass',
  Telephone = 'telephone',
}

/**
 * Audio effect configuration options
 */
export interface AudioEffectOptions {
  type: AudioEffectType;
  /**
   * Wet/dry mix (0-1), where 0 is completely dry (no effect) and 1 is completely wet (full effect)
   */
  mix?: number;
  /**
   * Specific parameters for different effect types
   */
  params?: Record<string, number>;
}

/**
 * Connect audio source to destination with effects
 */
export function applyAudioEffect(
  audioContext: AudioContext,
  sourceNode: MediaStreamAudioSourceNode,
  destinationNode: AudioNode,
  effect: AudioEffectOptions
): void {
  // Default to direct connection if no effect is selected
  if (effect.type === AudioEffectType.None) {
    sourceNode.connect(destinationNode);
    return;
  }

  // Set default mix if not provided
  const mix = effect.mix ?? 0.5;
  const params = effect.params ?? {};

  // Create effect chain based on the selected effect type
  switch (effect.type) {
    case AudioEffectType.Reverb:
      createReverbEffect(audioContext, sourceNode, destinationNode, mix, params);
      break;
    case AudioEffectType.Echo:
      createEchoEffect(audioContext, sourceNode, destinationNode, mix, params);
      break;
    case AudioEffectType.Distortion:
      createDistortionEffect(audioContext, sourceNode, destinationNode, mix, params);
      break;
    case AudioEffectType.LowPass:
      createLowPassFilter(audioContext, sourceNode, destinationNode, mix, params);
      break;
    case AudioEffectType.HighPass:
      createHighPassFilter(audioContext, sourceNode, destinationNode, mix, params);
      break;
    case AudioEffectType.Telephone:
      createTelephoneEffect(audioContext, sourceNode, destinationNode, mix, params);
      break;
    default:
      // Fallback to direct connection
      sourceNode.connect(destinationNode);
  }
}

// Private implementations of each effect type

function createReverbEffect(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  mix: number,
  params: Record<string, number>
): void {
  // Create convolver node for reverb
  const convolver = context.createConvolver();

  // Create impulse response (simplified version)
  const impulseLength = params.decay ?? 2;
  const sampleRate = context.sampleRate;
  const impulse = context.createBuffer(2, sampleRate * impulseLength, sampleRate);

  // Fill the buffer with an impulse response
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const impulseData = impulse.getChannelData(channel);
    for (let i = 0; i < impulseData.length; i++) {
      // Simple exponential decay
      impulseData[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - i / impulseData.length, impulseLength);
    }
  }

  convolver.buffer = impulse;

  // Create dry/wet mixer
  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Connect the nodes
  source.connect(dryGain);
  dryGain.connect(destination);

  source.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(destination);
}

function createEchoEffect(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  mix: number,
  params: Record<string, number>
): void {
  // Create delay node
  const delay = context.createDelay();
  delay.delayTime.value = params.delayTime ?? 0.3;

  // Create feedback gain node
  const feedback = context.createGain();
  feedback.gain.value = params.feedback ?? 0.4;

  // Create dry/wet mixer
  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Connect the nodes
  source.connect(dryGain);
  dryGain.connect(destination);

  source.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(destination);

  // Create feedback loop
  delay.connect(feedback);
  feedback.connect(delay);
}

function createDistortionEffect(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  mix: number,
  params: Record<string, number>
): void {
  // Create waveshaper node for distortion
  const distortion = context.createWaveShaper();

  // Set curve amount
  const amount = params.amount ?? 20;

  // Create the curve
  const curve = new Float32Array(context.sampleRate);
  const deg = Math.PI / 180;

  for (let i = 0; i < curve.length; i++) {
    const x = (i * 2) / curve.length - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }

  distortion.curve = curve;
  distortion.oversample = '4x';

  // Create dry/wet mixer
  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Connect the nodes
  source.connect(dryGain);
  dryGain.connect(destination);

  source.connect(distortion);
  distortion.connect(wetGain);
  wetGain.connect(destination);
}

function createLowPassFilter(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  mix: number,
  params: Record<string, number>
): void {
  // Create filter node
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = params.frequency ?? 800;
  filter.Q.value = params.Q ?? 1;

  // Create dry/wet mixer
  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Connect the nodes
  source.connect(dryGain);
  dryGain.connect(destination);

  source.connect(filter);
  filter.connect(wetGain);
  wetGain.connect(destination);
}

function createHighPassFilter(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  mix: number,
  params: Record<string, number>
): void {
  // Create filter node
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = params.frequency ?? 1500;
  filter.Q.value = params.Q ?? 1;

  // Create dry/wet mixer
  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Connect the nodes
  source.connect(dryGain);
  dryGain.connect(destination);

  source.connect(filter);
  filter.connect(wetGain);
  wetGain.connect(destination);
}

function createTelephoneEffect(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  mix: number,
  params: Record<string, number>
): void {
  // Telephone effect: combine highpass and lowpass filters
  // Create filters
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = params.highpassFreq ?? 700;

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = params.lowpassFreq ?? 2500;

  // Create distortion for telephone effect
  const distortion = context.createWaveShaper();
  const curve = new Float32Array(context.sampleRate);
  for (let i = 0; i < curve.length; i++) {
    const x = (i * 2) / curve.length - 1;
    curve[i] = (1.5 * x) / (1 + Math.abs(x));
  }
  distortion.curve = curve;

  // Create dry/wet mixer
  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.value = 1 - mix;
  wetGain.gain.value = mix;

  // Connect the nodes
  source.connect(dryGain);
  dryGain.connect(destination);

  // Connect the effect chain
  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(distortion);
  distortion.connect(wetGain);
  wetGain.connect(destination);
}
