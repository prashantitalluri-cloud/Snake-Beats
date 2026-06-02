/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from './types';

// Scale frequencies in E minor
// index: 0=E, 1=G, 2=A, 3=B, 4=C, 5=D, 6=E5, 7=G5, 8=A5, 9=B5
const BASS_FREQS = [82.41, 98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 196.00]; // Low Octave
const LEAD_FREQS = [329.63, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77]; // High Octave

export const DUMMY_SONGS: Song[] = [
  {
    id: 'cyberpunk-neon-run',
    title: 'Cyberpunk Neon Run',
    artist: 'AI Gen SynthCore',
    genre: 'Synthwave / Retro',
    bpm: 124,
    neonColor: 'cyan',
    glowColor: '#00f0ff',
    description: 'A speeding, driving track with powerful pulsing basslines and soaring high-tech leads.',
    pattern: {
      tempo: 124,
      // 16 steps of bass offsets (index of BASS_FREQS)
      bass: [0, 0, 1, 1, 3, 3, 2, 2, 0, 0, 5, 5, 3, 3, 6, 6],
      // 16 steps of melody offsets (index of LEAD_FREQS)
      melody: [0, -1, 3, 2, 5, -1, 7, 6, 0, -1, 3, 5, 8, -1, 7, 9],
      leadOctave: 1,
      drumPattern: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
    }
  },
  {
    id: 'neon-dreams-drift',
    title: 'Neon Dreams (Drift)',
    artist: 'AI Gen VibeEngine',
    genre: 'Vaporwave / Chill',
    bpm: 92,
    neonColor: 'fuchsia',
    glowColor: '#ff00ff',
    description: 'A cozy, slow-tempo drift through holographic clouds and purple midnight neon highways.',
    pattern: {
      tempo: 92,
      bass: [4, 4, 0, 0, 2, 2, 3, 3, 4, 4, 0, 0, 5, 5, 6, 6],
      melody: [4, 6, 4, -1, 7, 5, 7, -1, 8, 9, 8, -1, 6, 4, 3, -1],
      leadOctave: 0,
      drumPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
    }
  },
  {
    id: 'gridlock-8bit-mayhem',
    title: 'Gridlock Arcade Mayhem',
    artist: '8-Bit NeuroChip',
    genre: 'Chiptune / HyperGame',
    bpm: 148,
    neonColor: 'emerald',
    glowColor: '#39ff14',
    description: 'High-energy, fast-paced game music loaded with bubbly square waves and punchy retro noise.',
    pattern: {
      tempo: 148,
      bass: [0, 3, 5, 2, 0, 3, 6, 5, 0, 3, 5, 2, 7, 6, 5, 4],
      melody: [0, 2, 3, 5, 3, 5, 6, 7, 8, 7, 6, 5, 6, 5, 3, 2],
      leadOctave: 2,
      drumPattern: [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true]
    }
  }
];

class NeonSynthEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mainGain: GainNode | null = null;
  private currentSong: Song = DUMMY_SONGS[0];
  private isPlaying: boolean = false;
  private stepIndex: number = 0;
  private timerId: any = null;
  private volume: number = 0.5;
  private listeners: Set<(step: number, freqData: Uint8Array) => void> = new Set();
  private lastBeatTime: number = 0;

  constructor() {
    // Lazy initialisation to support standard user safety policies
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64; // Small fft for super crisp neon visualizer bars
      
      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser.connect(this.mainGain);
      this.mainGain.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initCtx();
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    this.initCtx();
    return this.analyser;
  }

  public play() {
    this.initCtx();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.stepIndex = 0;
    this.scheduleNextStep();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSong(): Song {
    return this.currentSong;
  }

  public setSong(song: Song) {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentSong = song;
    this.stepIndex = 0;
    if (wasPlaying) {
      this.play();
    }
  }

  public addStepListener(cb: (step: number, freqData: Uint8Array) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private triggerStep() {
    if (!this.ctx || !this.analyser) return;

    const time = this.ctx.currentTime;
    const song = this.currentSong;
    const { bass, melody, leadOctave, drumPattern } = song.pattern;

    const currentBassNote = bass[this.stepIndex % bass.length];
    const currentMelodyNote = melody[this.stepIndex % melody.length];
    const isKick = drumPattern[this.stepIndex % drumPattern.length];

    // Synced visuals callback
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqData);
    this.listeners.forEach((listener) => listener(this.stepIndex, freqData));

    // Synth Bass
    if (currentBassNote !== -1) {
      const freq = BASS_FREQS[currentBassNote % BASS_FREQS.length];
      this.triggerSynthBase(freq, time);
    }

    // Synth Lead Melody (Only trigger if note index is not -1)
    if (currentMelodyNote !== -1) {
      // Modify octave multiplier based on current song structure
      const leadFreq = LEAD_FREQS[currentMelodyNote % LEAD_FREQS.length] * (leadOctave === 2 ? 1.5 : leadOctave === 1 ? 1 : 0.75);
      this.triggerSynthLead(leadFreq, time);
    }

    // Synth Drum (Kick)
    if (isKick) {
      this.triggerKick(time);
    }

    // Loop steps
    this.stepIndex = (this.stepIndex + 1) % 16;
  }

  private scheduleNextStep() {
    if (!this.isPlaying || !this.ctx) return;

    this.triggerStep();

    // calculate step duration from BPM
    const stepDurationMs = (60 / this.currentSong.bpm / 4) * 1000; // 16th notes
    this.timerId = setTimeout(() => this.scheduleNextStep(), stepDurationMs);
  }

  // SOUND SYNTH GENERATORS

  private triggerSynthBase(freq: number, startTime: number) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Cyberpunk uses Saw for heavy pulse, Chiptune uses Triangle/Square for vintage retro, Dreamy uses Sine
    if (this.currentSong.id === 'cyberpunk-neon-run') {
      osc.type = 'sawtooth';
    } else if (this.currentSong.id === 'gridlock-8bit-mayhem') {
      osc.type = 'square';
    } else {
      osc.type = 'triangle';
    }

    osc.frequency.setValueAtTime(freq, startTime);
    
    // Quick decay filter for synth sub bass feel
    gain.gain.setValueAtTime(0.22, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }

  private triggerSynthLead(freq: number, startTime: number) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Wave type
    if (this.currentSong.id === 'cyberpunk-neon-run') {
      osc.type = 'triangle';
    } else if (this.currentSong.id === 'gridlock-8bit-mayhem') {
      osc.type = 'square';
    } else {
      osc.type = 'sine';
    }

    osc.frequency.setValueAtTime(freq, startTime);
    
    // Dreamy delayed release or quick arcade plucks
    const peakVolume = this.currentSong.id === 'neon-dreams-drift' ? 0.08 : 0.12;
    const decayDuration = this.currentSong.id === 'neon-dreams-drift' ? 0.6 : 0.15;

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayDuration);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(startTime);
    osc.stop(startTime + decayDuration + 0.05);
  }

  private triggerKick(startTime: number) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.1);

    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(startTime);
    osc.stop(startTime + 0.13);
  }

  // SFX FOR SNAKE GAME INTERACTION
  public triggerSfxEat() {
    this.initCtx();
    if (!this.ctx) return;
    
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Quick retro arcade happy chime sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(523.25, time); // C5
    osc.frequency.setValueAtTime(659.25, time + 0.05); // E5
    osc.frequency.setValueAtTime(783.99, time + 0.1); // G5
    osc.frequency.setValueAtTime(1046.50, time + 0.15); // C6

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    // Connect directly to master output bypassing master volume slightly or keeping it relative
    if (this.mainGain) {
      gain.connect(this.mainGain);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(time);
    osc.stop(time + 0.3);
  }

  public triggerSfxGameOver() {
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Descending heavy classic game-over sweep
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, time); // A3
    osc.frequency.linearRampToValueAtTime(80, time + 0.5);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.55);

    osc.connect(gain);
    if (this.mainGain) {
      gain.connect(this.mainGain);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(time);
    osc.stop(time + 0.6);
  }

  public triggerSfxTap() {
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Minimal clicky soft sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.03);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    if (this.mainGain) {
      gain.connect(this.mainGain);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

export const neonSynth = new NeonSynthEngine();
