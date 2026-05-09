// Quick alert beep using Web Audio API — no external assets needed
let audioCtx: AudioContext | null = null;

export const playAlertSound = (direction: 'above' | 'below' = "above") => {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    const ctx = audioCtx!;
    const now = ctx.currentTime;

    // Two-tone arpeggio: rising for "above", falling for "below"
    const tones = direction === "above" ? [880, 1320] : [880, 660];

    tones.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + index * 0.14;
      const end = start + 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });
  } catch (error) {
    console.error("Failed to play alert sound", error);
  }
};
