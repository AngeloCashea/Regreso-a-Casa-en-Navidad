import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import sceneImage from '../assets/images/christmas_scene_3d_1792011707760.jpg';

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
  const [currentSrc, setCurrentSrc] = useState(sceneImage);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  useEffect(() => {
    const flakes = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      char: ['❄', '❆', '✦', '•'][Math.floor(Math.random() * 4)],
      left: Math.random() * 100,
      duration: 3.5 + Math.random() * 4.5,
      delay: Math.random() * 5,
      size: 8 + Math.random() * 12,
      opacity: 0.45 + Math.random() * 0.45,
    }));
    setSnowflakes(flakes);
  }, []);

  const handleImageError = () => {
    // If the imported module fails, fallback to public static asset
    if (currentSrc !== '/assets/images/christmas_scene_3d.jpg') {
      setCurrentSrc('/assets/images/christmas_scene_3d.jpg');
    } else {
      setHasFailedAll(true);
    }
  };

  return (
    <div className="relative w-full aspect-[16/9] min-h-[220px] sm:min-h-[280px] rounded-2xl overflow-hidden shadow-xl border border-stone-800 bg-[#070e24] select-none">
      {/* 3D Cartoon Christmas Scene Artwork */}
      {!hasFailedAll ? (
        <img
          src={currentSrc}
          alt="Escena navideña 3D con cabaña, chimenea con humo, árbol iluminado, Santa Claus, muñeco de nieve y Rodolfo el reno"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover object-center transition-all duration-700 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-80 scale-102'
          }`}
        />
      ) : (
        /* Clean fallback only if all image paths fail */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1430] via-[#162850] to-[#1a4a2d] text-white text-center">
          <span className="text-4xl mb-2">🎅 ⛄ 🦌 🎄</span>
          <h4 className="text-sm sm:text-base font-bold text-amber-300">
            🎄 ¡Feliz Navidad y Feliz Regreso a Casa! 🎅
          </h4>
          <p className="text-xs text-stone-300 mt-1">
            Celebrando juntos en familia en Caracas ❤️
          </p>
        </div>
      )}

      {/* Cinematic subtle contrast gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent via-60% to-black/45 pointer-events-none" />

      {/* Animated snowfall overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {snowflakes.map((s) => (
          <div
            key={s.id}
            className="absolute -top-6 text-white animate-snow pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
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

      {/* Glowing Star and Tree Accent Animation (desktop/tablet) */}
      <div className="absolute top-[16%] left-[18%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden sm:block">
        <span className="relative flex h-8 w-8">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-amber-300/30 blur-xs"></span>
        </span>
      </div>

      {/* Rudolph's Glowing Red Nose Accent (desktop/tablet) */}
      <div className="absolute bottom-[28%] left-[19.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden sm:block">
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500/50 blur-xs"></span>
        </span>
      </div>

      {/* Chimney Smoke Particle Accents (desktop/tablet) */}
      <div className="absolute top-[8%] right-[22%] pointer-events-none z-10 hidden sm:flex flex-col items-center gap-1 opacity-75">
        <div className="w-2 h-2 rounded-full bg-white/40 blur-xs animate-float" />
        <div
          className="w-3 h-3 rounded-full bg-white/30 blur-xs animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Festive Greeting Header Banner - shown nicely above the image */}
      {!hasFailedAll && (
        <div className="absolute top-2.5 sm:top-3 left-0 right-0 text-center z-20 px-3 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 shadow-md">
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
            <p className="text-amber-200 font-extrabold text-[11px] sm:text-xs tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">
              🎄 ¡Feliz Navidad y Feliz Regreso a Casa! 🎅
            </p>
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
          </div>
        </div>
      )}

      {/* Bottom festive caption */}
      {!hasFailedAll && (
        <div className="absolute bottom-2.5 sm:bottom-3 left-3.5 right-3.5 z-20 flex items-center justify-between text-white/90 pointer-events-none text-[10px] sm:text-[11px]">
          <span className="font-semibold text-amber-100/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            ✨ Santa, Muñeco de Nieve & Rodolfo
          </span>
          <span className="font-bold text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            Caracas 2026 ❤️
          </span>
        </div>
      )}
    </div>
  );
};
