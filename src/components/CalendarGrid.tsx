import React, { useState } from 'react';
import { CATEGORIES, DAYS_OF_WEEK, DEC_START_DOW } from '../data/calendarData';
import { CalendarEvent } from '../types';

interface CalendarGridProps {
  events: CalendarEvent[];
  completed: Record<number, boolean>;
  selectedDay: number | null;
  selectedMonth: number | null;
  filterCat: string | null;
  onSelectDay: (day: number | null, month: number | null) => void;
  onDropEvent: (targetDay: number, targetMonth: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  completed,
  selectedDay,
  selectedMonth,
  filterCat,
  onSelectDay,
  onDropEvent,
}) => {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const getDayEvents = (d: number, m: number) => {
    let evts = events.filter((e) => e.day === d && e.month === m);
    if (filterCat) evts = evts.filter((e) => e.cat === filterCat);
    return evts;
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDragOverKey(key);
  };

  const handleDragLeave = (key: string) => {
    if (dragOverKey === key) setDragOverKey(null);
  };

  const handleDrop = (e: React.DragEvent, day: number, month: number) => {
    e.preventDefault();
    setDragOverKey(null);
    onDropEvent(day, month);
  };

  // Pre-calculate cells
  const totalCells = DEC_START_DOW + 31 + 2;
  const remainder = totalCells % 7;
  const trailingEmpty = remainder > 0 ? 7 - remainder : 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm">
      {/* Month legend / header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-stone-900 tracking-tight">
            Diciembre 2026
          </span>
          <span className="text-stone-300">/</span>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
            Enero 2027
          </span>
        </div>
        <span className="text-xs text-stone-500 font-medium hidden sm:inline">
          💡 Toca un día para ver o mover planes
        </span>
      </div>

      {/* Grid table */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Day of Week Headers */}
        {DAYS_OF_WEEK.map((d, i) => (
          <div
            key={d}
            className={`text-center py-1.5 text-xs font-bold uppercase tracking-wider ${
              i === 0 || i === 6 ? 'text-red-800/80' : 'text-stone-500'
            }`}
          >
            {d}
          </div>
        ))}

        {/* Empty cells before Dec 1 (Tue = index 2) */}
        {Array.from({ length: DEC_START_DOW }).map((_, i) => (
          <div
            key={`pre-${i}`}
            className="aspect-square rounded-xl bg-stone-50/50 border border-transparent opacity-30 pointer-events-none"
          />
        ))}

        {/* December 1 to 31 */}
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
          const inRange = d >= 3;
          const evts = inRange ? getDayEvents(d, 12) : [];
          const allDone = evts.length > 0 && evts.every((e) => completed[e.id]);
          const isSelected = selectedDay === d && selectedMonth === 12;
          const hasCelebration = evts.some((e) => e.cat === 'celebracion');
          const cellKey = `12-${d}`;
          const isDragTarget = dragOverKey === cellKey;

          // Milestone flags
          const isArrival = d === 4;
          const isGrandmaBirthday = d === 15;
          const isChristmasEve = d === 24;
          const isChristmas = d === 25;
          const isNewYearEve = d === 31;
          const isMilestone =
            isArrival ||
            isGrandmaBirthday ||
            isChristmasEve ||
            isChristmas ||
            isNewYearEve;

          return (
            <button
              key={cellKey}
              type="button"
              disabled={!inRange}
              onClick={() => {
                if (inRange) {
                  onSelectDay(isSelected ? null : d, isSelected ? null : 12);
                }
              }}
              onDragOver={(e) => inRange && handleDragOver(e, cellKey)}
              onDragLeave={() => inRange && handleDragLeave(cellKey)}
              onDrop={(e) => inRange && handleDrop(e, d, 12)}
              className={`group relative aspect-square rounded-xl p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all text-center focus:outline-none select-none ${
                !inRange
                  ? 'opacity-25 bg-stone-50/70 border border-stone-100 cursor-not-allowed'
                  : isSelected
                  ? 'bg-gradient-to-br from-[#8B1A1A] to-[#A32020] text-white shadow-md ring-2 ring-amber-300 ring-offset-2 z-10'
                  : isDragTarget
                  ? 'border-2 border-dashed border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
                  : 'bg-white hover:bg-stone-50 border border-stone-200/80 hover:border-stone-300 shadow-2xs'
              }`}
            >
              {/* Day Header row inside cell */}
              <div className="w-full flex items-center justify-between leading-none">
                <span
                  className={`text-xs sm:text-sm font-bold tabular-nums ${
                    isSelected
                      ? 'text-white'
                      : allDone && evts.length > 0
                      ? 'text-emerald-600 font-extrabold'
                      : isMilestone
                      ? 'text-[#8B1A1A] font-extrabold'
                      : 'text-stone-800'
                  }`}
                >
                  {d}
                </span>

                {/* Milestone or completion icon */}
                {allDone && evts.length > 0 ? (
                  <span
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-amber-200' : 'text-emerald-600'
                    }`}
                  >
                    ✓
                  </span>
                ) : hasCelebration && !isSelected ? (
                  <span className="text-[10px]" title="Celebración especial">
                    🎄
                  </span>
                ) : null}
              </div>

              {/* Event indicator dots */}
              <div className="flex items-center justify-center gap-1 w-full my-auto flex-wrap px-0.5">
                {evts.slice(0, 3).map((e) => {
                  const cat = CATEGORIES[e.cat];
                  const isDone = completed[e.id];
                  return (
                    <span
                      key={e.id}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-transform ${
                        isSelected ? 'ring-1 ring-white/60' : ''
                      } ${isDone ? 'opacity-40' : 'opacity-100'}`}
                      style={{
                        backgroundColor: isSelected
                          ? '#FDE047'
                          : cat?.color || '#8B1A1A',
                      }}
                      title={e.title}
                    />
                  );
                })}
                {evts.length > 3 && (
                  <span
                    className={`text-[8px] font-extrabold leading-none ${
                      isSelected ? 'text-white' : 'text-stone-500'
                    }`}
                  >
                    +{evts.length - 3}
                  </span>
                )}
              </div>

              {/* Bottom tag for key milestones */}
              {isArrival && (
                <span
                  className={`text-[8px] font-extrabold px-1 py-0.2 rounded leading-tight ${
                    isSelected
                      ? 'bg-amber-400 text-stone-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  Llegada ✈️
                </span>
              )}
              {isChristmasEve && (
                <span
                  className={`text-[8px] font-extrabold px-1 py-0.2 rounded leading-tight ${
                    isSelected
                      ? 'bg-amber-400 text-stone-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  Nochebuena
                </span>
              )}
              {isNewYearEve && (
                <span
                  className={`text-[8px] font-extrabold px-1 py-0.2 rounded leading-tight ${
                    isSelected
                      ? 'bg-amber-400 text-stone-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  Año Nuevo 🥂
                </span>
              )}
            </button>
          );
        })}

        {/* January 1 & 2 */}
        {[1, 2].map((d) => {
          const evts = getDayEvents(d, 1);
          const allDone = evts.length > 0 && evts.every((e) => completed[e.id]);
          const isSelected = selectedDay === d && selectedMonth === 1;
          const cellKey = `1-${d}`;
          const isDragTarget = dragOverKey === cellKey;
          const isDeparture = d === 2;

          return (
            <button
              key={cellKey}
              type="button"
              onClick={() => {
                onSelectDay(isSelected ? null : d, isSelected ? null : 1);
              }}
              onDragOver={(e) => handleDragOver(e, cellKey)}
              onDragLeave={() => handleDragLeave(cellKey)}
              onDrop={(e) => handleDrop(e, d, 1)}
              className={`group relative aspect-square rounded-xl p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all text-center focus:outline-none select-none ${
                isSelected
                  ? 'bg-gradient-to-br from-[#1E40AF] to-[#2563EB] text-white shadow-md ring-2 ring-amber-300 ring-offset-2 z-10'
                  : isDragTarget
                  ? 'border-2 border-dashed border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
                  : 'bg-sky-50/80 hover:bg-sky-100/70 border border-sky-200/90 shadow-2xs'
              }`}
            >
              <div className="w-full flex items-center justify-between leading-none">
                <span
                  className={`text-xs sm:text-sm font-bold tabular-nums ${
                    isSelected
                      ? 'text-white'
                      : allDone && evts.length > 0
                      ? 'text-emerald-700 font-extrabold'
                      : 'text-sky-900'
                  }`}
                >
                  E{d}
                </span>

                {allDone && evts.length > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-amber-200' : 'text-emerald-600'
                    }`}
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1 w-full my-auto flex-wrap px-0.5">
                {evts.map((e) => {
                  const cat = CATEGORIES[e.cat];
                  const isDone = completed[e.id];
                  return (
                    <span
                      key={e.id}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-transform ${
                        isSelected ? 'ring-1 ring-white/60' : ''
                      } ${isDone ? 'opacity-40' : 'opacity-100'}`}
                      style={{
                        backgroundColor: isSelected
                          ? '#93C5FD'
                          : cat?.color || '#2563EB',
                      }}
                      title={e.title}
                    />
                  );
                })}
              </div>

              {isDeparture && (
                <span
                  className={`text-[8px] font-extrabold px-1 py-0.2 rounded leading-tight ${
                    isSelected
                      ? 'bg-amber-400 text-stone-900'
                      : 'bg-sky-200 text-sky-900'
                  }`}
                >
                  Despedida ✈️
                </span>
              )}
            </button>
          );
        })}

        {/* Trailing empty cells */}
        {Array.from({ length: trailingEmpty }).map((_, i) => (
          <div
            key={`post-${i}`}
            className="aspect-square rounded-xl bg-stone-50/40 border border-transparent opacity-20 pointer-events-none"
          />
        ))}
      </div>
    </div>
  );
};
