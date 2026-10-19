import React from 'react';
import { Sparkles, Heart, Compass, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  completedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  completedCount,
  totalCount,
}) => {
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  let progressMessage = '¡La aventura está por comenzar!';
  if (completedCount === totalCount && totalCount > 0) {
    progressMessage = '🎄 ¡Todas las aventuras completadas con mamá!';
  } else if (completedCount > 0) {
    progressMessage = `${completedCount} aventura${
      completedCount > 1 ? 's' : ''
    } vivida${completedCount > 1 ? 's' : ''} juntas en Caracas ❤️`;
  }

  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#700F11] via-[#8B1A1A] to-[#A32020] text-white shadow-xl border border-red-950/20">
      {/* Decorative festive ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
        <div className="absolute top-2 left-4 text-xs tracking-[1em] select-none">
          ❄ ❆ ✦ ❄ ❆ ✦ ❄ ❆ ✦ ❄ ❆
        </div>
        <div className="absolute bottom-2 right-4 text-xs tracking-[1em] select-none">
          ✦ ❄ ❆ ✦ ❄ ❆ ✦ ❄ ❆ ✦ ❄
        </div>
      </div>

      <div className="relative p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diciembre 2026 – Enero 2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
              🎄 Regreso a Casa en Navidad 🎅
            </h1>
            <p className="text-sm text-red-100/90 font-medium flex items-center gap-1.5">
              <span>Mamá vuelve a Venezuela después de casi 9 años</span>
              <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300 inline" />
            </p>
          </div>

          {/* Counter widget */}
          <div className="shrink-0 flex items-center gap-3 bg-black/25 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shadow-inner">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-200/80">
                Aventuras
              </span>
              <div className="flex items-baseline justify-end gap-0.5">
                <span className="text-3xl font-extrabold text-amber-300 tabular-nums">
                  {completedCount}
                </span>
                <span className="text-base font-semibold text-white/60 tabular-nums">
                  /{totalCount}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Festive Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-red-100/80 mb-2">
            <span>{progressMessage}</span>
            <span className="text-amber-300 font-bold tabular-nums">
              {Math.round(pct)}%
            </span>
          </div>

          <div className="relative h-2.5 bg-black/30 rounded-full overflow-visible p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
            {/* Moving festive sleigh */}
            <div
              className="absolute top-1/2 -translate-y-1/2 text-xl select-none pointer-events-none transition-all duration-500 ease-out filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{
                left: `calc(${pct}% - 10px)`,
              }}
            >
              🛷
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
