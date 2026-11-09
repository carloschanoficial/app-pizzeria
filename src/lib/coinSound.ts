export function playCoinSound() {
  const AudioCtor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;

  const ctx = new AudioCtor();
  const start = ctx.currentTime;
  [
    { at: 0, freq: 1318 },
    { at: 0.11, freq: 1760 },
  ].forEach(({ at, freq }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start + at);
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(0.25, start + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + at);
    osc.stop(start + at + 0.35);
  });
  setTimeout(() => void ctx.close(), 700);
}
