import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { JINGLE_BELLS_MELODY, NOTE_FREQ } from '../data/calendarData';

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const melodyIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  const TEMPO = 0.28;

  const playSynthNote = (freq: number, duration: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.95);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio context cleanup if interrupted
    }
  };

  const scheduleNext = () => {
    if (!isPlayingRef.current) return;
    const [note, beats] = JINGLE_BELLS_MELODY[melodyIndexRef.current];
    const dur = beats * TEMPO;

    if (NOTE_FREQ[note]) {
      playSynthNote(NOTE_FREQ[note], dur);
    }

    melodyIndexRef.current =
      (melodyIndexRef.current + 1) % JINGLE_BELLS_MELODY.length;
    timeoutRef.current = window.setTimeout(scheduleNext, dur * 1000);
  };

  const toggleMusic = () => {
    if (!isPlaying) {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      isPlayingRef.current = true;
      setIsPlaying(true);
      scheduleNext();
    } else {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMusic}
        title={
          isPlaying
            ? 'Pausar música navideña'
            : 'Reproducir melodía navideña (Jingle Bells)'
        }
        aria-label="Control de música navideña"
        className={`group relative flex items-center justify-center w-13 h-13 rounded-full text-white shadow-xl transition-all duration-300 transform active:scale-95 ${
          isPlaying
            ? 'bg-gradient-to-br from-[#8B1A1A] via-[#B22222] to-[#D97706] animate-music-pulse ring-4 ring-amber-300/60'
            : 'bg-gradient-to-br from-stone-800 to-stone-900 hover:from-[#8B1A1A] hover:to-[#B22222] ring-2 ring-white/60'
        }`}
      >
        {isPlaying ? (
          <>
            <Volume2 className="w-6 h-6 animate-pulse text-amber-200" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </>
        ) : (
          <VolumeX className="w-6 h-6 text-stone-300 group-hover:text-white" />
        )}

        {/* Hover label tooltip */}
        <span className="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-stone-900/90 text-white text-[11px] font-semibold tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          {isPlaying ? 'Silenciar villancico' : 'Música navideña 🎵'}
        </span>
      </button>
    </div>
  );
};
