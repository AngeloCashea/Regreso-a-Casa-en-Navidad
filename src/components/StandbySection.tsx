import React from 'react';
import { Calendar, Check, Search } from 'lucide-react';
import { STANDBY } from '../data/calendarData';
import { CalendarEvent } from '../types';

interface StandbySectionProps {
  events: CalendarEvent[];
  completed: Record<number, boolean>;
  onToggleComplete: (id: number) => void;
  onScheduleStandby: (id: number) => void;
}

export const StandbySection: React.FC<StandbySectionProps> = ({
  events,
  completed,
  onToggleComplete,
  onScheduleStandby,
}) => {
  return (
    <section className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center">
            <Search className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950">
              Planes en revisión (pendientes de confirmación o fecha)
            </h3>
            <p className="text-[11px] text-amber-800/80">
              La Guaira post-terremoto, juegos de los Leones y obras por anunciar
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {STANDBY.map((s) => {
          const isDone = completed[s.id];
          const inCalendar = events.find((e) => e.id === s.id);
          const dayInfo = inCalendar
            ? ` — 📅 En el calendario: ${inCalendar.day} de ${
                inCalendar.month === 12 ? 'Diciembre' : 'Enero'
              }`
            : '';

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-200/70 shadow-2xs transition-all ${
                isDone ? 'opacity-55' : 'opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleComplete(s.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'border-amber-400 hover:border-amber-600 text-transparent'
                }`}
                title={
                  isDone ? 'Marcar como pendiente' : 'Marcar como listo'
                }
              >
                <Check className="w-3 h-3" />
              </button>

              <div className="flex-1 min-w-0">
                <strong
                  className={`text-xs sm:text-sm font-bold text-stone-900 block ${
                    isDone ? 'line-through text-stone-400' : ''
                  }`}
                >
                  {s.title}
                </strong>
                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                  {s.desc}
                  {dayInfo && (
                    <span className="font-semibold text-purple-700">
                      {dayInfo}
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onScheduleStandby(s.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500 hover:bg-amber-50 text-amber-900 text-xs font-bold transition-colors shrink-0"
              >
                <Calendar className="w-3 h-3 text-amber-700" />
                {inCalendar ? 'Mover' : 'Agendar'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
