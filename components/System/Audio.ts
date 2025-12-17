/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export class AudioController {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  
  // Music State
  musicGain: GainNode | null = null;
  musicNodes: AudioScheduledSourceNode[] = [];
  isMusicPlaying: boolean = false;
  schedulerTimer: number | null = null;
  nextNoteTime: number = 0;
  beatCount: number = 0;

  constructor() {
    // Lazy initialization
  }

  init() {
    if (!this.ctx) {
      // Support for standard and webkit prefixed AudioContext
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  startMusic() {
      if (this.isMusicPlaying) return;
      if (!this.ctx || !this.masterGain) this.init();
      if (!this.ctx || !this.masterGain) return;

      this.isMusicPlaying = true;
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.4; // Music volume relative to master
      this.musicGain.connect(this.masterGain);

      // 1. Start Drone (Atmosphere)
      this.playDrone();

      // 2. Start Rhythm Scheduler
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.beatCount = 0;
      this.scheduler();
  }

  stopMusic() {
      this.isMusicPlaying = false;
      if (this.schedulerTimer) {
          window.clearTimeout(this.schedulerTimer);
          this.schedulerTimer = null;
      }
      
      // Fade out
      if (this.musicGain && this.ctx) {
          const t = this.ctx.currentTime;
          this.musicGain.gain.cancelScheduledValues(t);
          this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
          this.musicGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

          // Stop all tracked nodes after fade
          setTimeout(() => {
              this.musicNodes.forEach(node => {
                  try { node.stop(); node.disconnect(); } catch(e){}
              });
              this.musicNodes = [];
              if (this.musicGain) {
                  this.musicGain.disconnect();
                  this.musicGain = null;
              }
          }, 1000);
      }
  }

  playDrone() {
      if (!this.ctx || !this.musicGain) return;
      
      // Deep D2 Drone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = 73.42; // D2
      
      // Lowpass filter to make it dark and ominous
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      
      // LFO for movement
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.1; // Slow pulse
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 50;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      gain.gain.value = 0.3;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start();
      lfo.start();
      
      this.musicNodes.push(osc, lfo);
  }

  scheduler() {
      if (!this.isMusicPlaying || !this.ctx) return;

      // Schedule ahead (Lookahead 100ms)
      while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
          this.scheduleBeat(this.nextNoteTime, this.beatCount);
          this.nextNoteTime += 0.25; // 8th notes at ~120 BPM
          this.beatCount++;
      }
      
      this.schedulerTimer = window.setTimeout(() => this.scheduler(), 25);
  }

  scheduleBeat(time: number, beat: number) {
      if (!this.ctx || !this.musicGain) return;

      const measure = beat % 16; // 2 bars of 8th notes

      // --- War Drums (Kick/Tom) ---
      // Beat: 1, 3, and syncopated hits
      // 0, 3, 6, 10, 12 (Classic cinematic rhythm)
      if (measure === 0 || measure === 3 || measure === 6 || measure === 10 || measure === 12) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.frequency.setValueAtTime(100, time);
          osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
          
          const vol = (measure === 0 || measure === 12) ? 0.7 : 0.4;
          gain.gain.setValueAtTime(vol, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
          
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(time);
          osc.stop(time + 0.2);
      }

      // --- Lyre / Harp Arpeggio ---
      // D Dorian Scale: D, E, F, G, A, B, C
      const scale = [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33]; 
      
      // Play random notes on 8th notes, more likely on downbeats
      if (Math.random() > 0.4) {
          const noteIdx = Math.floor(Math.random() * scale.length);
          const freq = scale[noteIdx];
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.15, time + 0.02); // Soft attack
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6); // Long decay
          
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(time);
          osc.stop(time + 0.6);
      }
  }

  playGemCollect() {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // High pitch "ding" with slight upward inflection
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);

    gain.gain.setValueAtTime(0.3, t); // Lower SFX vol slightly
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playLetterCollect() {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // Play a major chord (C Majorish: C5, E5, G5) for a rewarding sound
    const freqs = [523.25, 659.25, 783.99]; 
    
    freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = f;
        
        // Stagger start times slightly for an arpeggio feel
        const start = t + (i * 0.04);
        const dur = 0.3;

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(start);
        osc.stop(start + dur);
    });
  }

  playJump(isDouble = false) {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sine wave for a smooth "whoop" sound
    osc.type = 'sine';
    
    // Pitch shift up for double jump
    const startFreq = isDouble ? 400 : 200;
    const endFreq = isDouble ? 800 : 450;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.15);

    // Lower volume for jump as it is a frequent action
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playDamage() {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // 1. Noise buffer for "crunch/static"
    const bufferSize = this.ctx.sampleRate * 0.3; // 0.3 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // 2. Low oscillator for "thud/impact"
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
    noise.start(t);
    noise.stop(t + 0.3);
  }
}

export const audio = new AudioController();