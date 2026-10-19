import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export const ChristmasScene: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<
    Array<{
      id: number;
      char: string;
      left: number;
      duration: number;
      delay: number;
      size: number;
      opacity: number;
    }>
  >([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      char: ['❄', '❆', '✦', '•'][Math.floor(Math.random() * 4)],
      left: Math.random() * 100,
      duration: 3.5 + Math.random() * 4.5,
      delay: Math.random() * 5,
      size: 9 + Math.random() * 14,
      opacity: 0.45 + Math.random() * 0.5,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border border-stone-800 bg-[#070e24] group">
      {/* 3D Cartoon Christmas Scene Artwork */}
      {!imageError && (
        <img
          src="/src/assets/images/christmas_scene_3d_1792011707760.jpg"
          alt="Escena navideña 3D con cabaña, chimenea con humo, árbol iluminado, Santa Claus, muñeco de nieve y Rodolfo el reno"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        />
      )}

      {/* Styled CSS/SVG Fallback in case of image load failure */}
      {imageError && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1430] via-[#162850] to-[#1a4a2d] text-white text-center">
          <span className="text-5xl mb-2 animate-bounce">🎅 ⛄ 🦌</span>
          <h4 className="text-base font-bold text-amber-300">
            🎄 ¡Feliz Navidad y Feliz Regreso a Casa! 🎄
          </h4>
          <p className="text-xs text-stone-300 mt-1">
            Celebrando juntos en familia en Caracas
          </p>
        </div>
      )}

      {/* Subtle cinematic gradient overlays for atmospheric depth & text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45 pointer-events-none" />

      {/* Animated snowfall overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {snowflakes.map((s) => (
          <div
            key={s.id}
            className="absolute -top-6 text-white animate-snow pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
            style={{
              left: `${s.left}%`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
              fontSize: `${s.size}px`,
              opacity: s.opacity,
            }}
          >
            {s.char}
          </div>
        ))}
      </div>

      {/* Glowing Star and Tree Accent Animation */}
      <div className="absolute top-[16%] left-[18%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden sm:block">
        <span className="relative flex h-8 w-8">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-amber-300/30 blur-xs"></span>
        </span>
      </div>

      {/* Rudolph's Glowing Red Nose Accent */}
      <div className="absolute bottom-[28%] left-[19.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden sm:block">
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500/50 blur-xs"></span>
        </span>
      </div>

      {/* Chimney Smoke Particle Accents */}
      <div className="absolute top-[8%] right-[22%] pointer-events-none z-10 hidden sm:flex flex-col items-center gap-1 opacity-75">
        <div className="w-2 h-2 rounded-full bg-white/40 blur-xs animate-float" />
        <div
          className="w-3 h-3 rounded-full bg-white/30 blur-xs animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Festive Greeting banner */}
      <div className="absolute top-3 left-0 right-0 text-center z-20 px-4 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          <p className="text-amber-200 font-extrabold text-xs sm:text-sm tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            🎄 ¡Feliz Navidad y Feliz Regreso a Casa! 🎅
          </p>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
        </div>
      </div>

      {/* Bottom festive caption */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-white/90 pointer-events-none">
        <span className="text-[11px] font-semibold text-amber-100/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          ✨ Santa, Muñeco de Nieve & Rodolfo
        </span>
        <span className="text-[11px] font-bold text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Caracas 2026 ❤️
        </span>
      </div>
    </div>
  );
};
