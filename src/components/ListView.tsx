import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { CATEGORIES, DAYS_OF_WEEK, DEC_START_DOW } from '../data/calendarData';
import { CalendarEvent } from '../types';

interface ListViewProps {
  events: CalendarEvent[];
  completed: Record<number, boolean>;
  filterCat: string | null;
  onToggleComplete: (id: number) => void;
  onMoveEvent: (id: number) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  events,
  completed,
  filterCat,
  onToggleComplete,
  onMoveEvent,
}) => {
  const getDow = (d: number, m: number) => {
    if (m === 12) return DAYS_OF_WEEK[(DEC_START_DOW + d - 1) % 7];
    const dec31dow = (DEC_START_DOW + 30) % 7;
    return DAYS_OF_WEEK[(dec31dow + d) % 7];
  };

  const sorted = [...events].sort((a, b) => {
    if (a.month !== b.month) return a.month === 12 ? -1 : 1;
    return a.day - b.day;
  });

  const filtered = filterCat
    ? sorted.filter((e) => e.cat === filterCat)
    : sorted;

  // Group by dayKey
  const grouped: Record<
    string,
    { day: number; month: number; events: CalendarEvent[] }
  > = {};

  filtered.forEach((e) => {
    const k = `${e.month}-${e.day}`;
    if (!grouped[k]) {
      grouped[k] = { day: e.day, month: e.month, events: [] };
    }
    grouped[k].events.push(e);
  });

  return (
    <div className="space-y-4">
      {Object.keys(grouped).length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm">
          No hay planes en esta categoría.
        </div>
      ) : (
        Object.values(grouped).map((group) => {
          const ml = group.month === 12 ? 'Dic' : 'Ene';
          const dowLabel = getDow(group.day, group.month);
          const allDone = group.events.every((e) => completed[e.id]);

          return (
            <div
              key={`${group.month}-${group.day}`}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden"
            >
              {/* Day header banner */}
              <div className="bg-stone-50/80 px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-stone-900 tabular-nums">
                    {group.day}
                  </span>
                  <span className="text-xs font-bold text-stone-600">
                    {dowLabel}, {ml}
                  </span>
                </div>

                {allDone && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ Todos listos
                  </span>
                )}
              </div>

              {/* Event rows */}
              <div className="p-3 divide-y divide-stone-100">
                {group.events.map((e) => {
                  const cat = CATEGORIES[e.cat];
                  const isDone = completed[e.id];

                  return (
                    <div
                      key={e.id}
                      className={`py-3 first:pt-1 last:pb-1 flex items-start gap-3 transition-opacity ${
                        isDone ? 'opacity-55' : 'opacity-100'
                      }`}
                    >
                      {/* Check button */}
                      <button
                        type="button"
                        onClick={() => onToggleComplete(e.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 hover:border-stone-400 text-transparent'
                        }`}
                        title={
                          isDone ? 'Marcar como pendiente' : 'Marcar como listo'
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">{cat?.emoji}</span>
                          <span
                            className={`text-sm font-bold text-stone-900 ${
                              isDone ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {e.title}
                          </span>

                          <span
                            className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: cat?.bgLight,
                              color: cat?.textColor,
                            }}
                          >
                            {cat?.label}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                          {e.desc}
                        </p>
                      </div>

                      {!e.fixed && (
                        <button
                          type="button"
                          onClick={() => onMoveEvent(e.id)}
                          className="px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded border border-purple-200 transition-colors shrink-0"
                          title="Cambiar fecha"
                        >
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Mover
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
