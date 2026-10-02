/**
 * Reusable Singleton Audio Alert Service
 * Reuses AudioContext safely to prevent audio device leaks and browser throttles.
 */

let sharedAudioCtx = null;

const getAudioContext = () => {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  return sharedAudioCtx;
};

export const playEmergencySiren = (priority = "High") => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sawtooth";

    const now = ctx.currentTime;
    const baseFreq = priority === "Critical" ? 950 : priority === "High" ? 800 : 650;

    oscillator.frequency.setValueAtTime(baseFreq, now);
    gainNode.gain.setValueAtTime(0.06, now);

    oscillator.start(now);
    oscillator.frequency.linearRampToValueAtTime(baseFreq + 250, now + 0.15);
    oscillator.frequency.linearRampToValueAtTime(baseFreq, now + 0.3);
    gainNode.gain.setValueAtTime(0.01, now + 0.3);
    oscillator.stop(now + 0.35);

    // Clean up node references after sound finishes
    setTimeout(() => {
      try {
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    }, 450);
  } catch (error) {
    // Non-blocking fallback for autoplay policies
  }
};
