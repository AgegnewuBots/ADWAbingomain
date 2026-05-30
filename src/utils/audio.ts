/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Amharic spelling for bingo numbers (1-75)
export const AM_NUMBERS: Record<number, string> = {
  1: 'አንድ', 2: 'ሁለት', 3: 'ሶስት', 4: 'አራት', 5: 'አምስት', 6: 'ስድስት', 7: 'ሰባት', 8: 'ስምንት', 9: 'ዘጠኝ', 10: 'አስር',
  11: 'አስራ አንድ', 12: 'አስራ ሁለት', 13: 'አስራ ሶስት', 14: 'አስራ አራት', 15: 'አስራ አምስት', 16: 'አስራ ስድስት', 17: 'አስራ ሰባት', 18: 'አስራ ስምንት', 19: 'አስራ ዘጠኝ', 20: 'ሃያ',
  21: 'ሃያ አንድ', 22: 'ሃያ ሁለት', 23: 'ሃያ ሶስት', 24: 'ሃያ አራት', 25: 'ሃያ አምስት', 26: 'ሃያ ስድስት', 27: 'ሃያ ሰባት', 28: 'ሃያ ስምንት', 29: 'ሃያ ዘጠኝ', 30: 'ሰላሳ',
  31: 'ሰላሳ አንድ', 32: 'ሰላሳ ሁለት', 33: 'ሰላሳ ሶስት', 34: 'ሰላሳ አራት', 35: 'ሰላሳ አምስት', 36: 'ሰላሳ ስድስት', 37: 'ሰላሳ ሰባት', 38: 'ሰላሳ ስምንት', 39: 'ሰላሳ ዘጠኝ', 40: 'አርባ',
  41: 'አርባ አንድ', 42: 'አርባ ሁለት', 43: 'አርባ ሶስት', 44: 'አርባ አራት', 45: 'አርባ አምስት', 46: 'አርባ ስድስት', 47: 'አርባ ሰባት', 48: 'አርባ ስምንት', 49: 'አርባ ዘጠኝ', 50: 'ሃምሳ',
  51: 'ሃምሳ አንድ', 52: 'ሃምሳ ሁለት', 53: 'ሃምሳ ሶስት', 54: 'ሃምሳ አራት', 55: 'ሃምሳ አምስት', 56: 'ሃምሳ ስድስት', 57: 'ሃምሳ ሰባት', 58: 'ሃምሳ ስምንት', 59: 'ሃምሳ ዘጠኝ', 60: 'ስልሳ',
  61: 'ስልሳ አንድ', 62: 'ስልሳ ሁለት', 63: 'ስልሳ ሶስት', 64: 'ስልሳ አራት', 65: 'ስልሳ አምስት', 66: 'ስልሳ ስድስት', 67: 'ስልሳ ሰባት', 68: 'ስልሳ ስምንት', 69: 'ስልሳ ዘጠኝ', 70: 'ሰባ',
  71: 'ሰባ አንድ', 72: 'ሰባ ሁለት', 73: 'ሰባ ሶስት', 74: 'ሰባ አራት', 75: 'ሰባ አምስት'
};

const COLS = ['B', 'I', 'N', 'G', 'O'];

// Get column letter based on number 1-75
export function getLetterForNumber(num: number): string {
  const colIndex = Math.floor((num - 1) / 15);
  return COLS[colIndex] || 'B';
}

// Custom Caller Audio Announcement from designated online repository
export function announceBall(num: number, soundEnabled: boolean) {
  if (!soundEnabled || num < 1 || num > 75) return;

  try {
    const colIndex = Math.floor((num - 1) / 15);
    const letter = ['b', 'i', 'n', 'g', 'o'][colIndex] || 'b';
    const soundUrl = `https://bingo-server-1.onrender.com/sounds/${letter}-${num}.mp3`;
    
    const audio = new Audio(soundUrl);
    audio.play().catch(err => {
      console.warn("Audio announcement play failure/blocked:", err);
    });
  } catch (e) {
    console.warn("Caller sound initialization failure:", e);
  }
}

// Custom audio synthesizer using standard Web Audio API
export class SoundEffects {
  private static ctx: AudioContext | null = null;

  private static init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
  }

  // Coin clinking sound for balances and betting
  public static playCoin(enabled: boolean) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High frequency double chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1500, now + 0.08);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);

      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } catch {
      // Ignored if browser policy blocks Audio Context until user interaction
    }
  }

  // Click / Select Sound (Tactile Mechanical Mouse Click Sound)
  public static playClick(enabled: boolean) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp mouse click transient setup
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.setValueAtTime(400, now + 0.003);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch {}
  }

  // Laser swoop when a new bingo number is called
  public static playBallSwoop(enabled: boolean) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  // Winning triumphant trumpet sound
  public static playVictory(enabled: boolean) {
    if (!enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const frequencies = [330, 440, 554, 660, 880];

      frequencies.forEach((freq, idx) => {
        const startOffset = idx * 0.15;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        // High brass style saw wave
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + startOffset);

        gain.gain.setValueAtTime(0.05, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + 0.4);

        // Simple lowpass filter to make it sound brassy instead of piercing
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + 0.5);
      });
    } catch {}
  }

  // Word BINGO sound when win
  public static playBingoWin(enabled: boolean) {
    if (!enabled) return;
    try {
      const audio = new Audio("https://bingo-server-1.onrender.com/sounds/bingo.mp3");
      audio.play().catch(err => {
        console.warn("Bingo sound play failed:", err);
      });
    } catch (e) {
      console.warn("Bingo sound error:", e);
    }
  }
}
