import React, { useState } from 'react';
import {
  X,
  Check,
  Calendar,
  GripVertical,
  StickyNote,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { CATEGORIES, DAYS_OF_WEEK, DEC_START_DOW } from '../data/calendarData';
import { CalendarEvent } from '../types';

interface DayDetailPanelProps {
  day: number;
  month: number;
  events: CalendarEvent[];
  completed: Record<number, boolean>;
  notes: Record<string, string>;
  onClose: () => void;
  onToggleComplete: (id: number) => void;
  onMoveEvent: (id: number) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onSaveNote: (key: string, content: string) => void;
}

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  day,
  month,
  events,
  completed,
  notes,
  onClose,
  onToggleComplete,
  onMoveEvent,
  onDragStart,
  onDragEnd,
  onSaveNote,
}) => {
  const noteKey = `${month}-${day}`;
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(notes[noteKey] || '');

  const getDow = (d: number, m: number) => {
    if (m === 12) return DAYS_OF_WEEK[(DEC_START_DOW + d - 1) % 7];
    const dec31dow = (DEC_START_DOW + 30) % 7;
    return DAYS_OF_WEEK[(dec31dow + d) % 7];
  };

  const monthName = month === 12 ? 'Diciembre 2026' : 'Enero 2027';

  const handleSaveNote = () => {
    onSaveNote(noteKey, noteText);
    setIsEditingNote(false);
  };

  const handleDeleteNote = () => {
    onSaveNote(noteKey, '');
    setNoteText('');
    setIsEditingNote(false);
  };

  return (
    <div className="bg-[#FAF7F2] border border-stone-300/80 rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B1A1A]">
              {getDow(day, month)}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-500 font-medium">
              {events.length} {events.length === 1 ? 'actividad' : 'actividades'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            {day} de {monthName}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors"
          aria-label="Cerrar panel de detalles"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Events list */}
      <div className="space-y-2.5">
        {events.length === 0 ? (
          <div className="text-center py-8 bg-white/70 rounded-xl border border-dashed border-stone-200 text-stone-400 text-sm">
            <p className="italic">
              Sin planes programados para este día.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              ¡Día libre perfecto para descansar o arrastrar un plan aquí!
            </p>
          </div>
        ) : (
          events.map((e) => {
            const cat = CATEGORIES[e.cat];
            const isDone = completed[e.id];

            return (
              <div
                key={e.id}
                draggable={!e.fixed}
                onDragStart={() => !e.fixed && onDragStart(e.id)}
                onDragEnd={() => !e.fixed && onDragEnd()}
                className={`group relative bg-white rounded-xl p-4 border transition-all shadow-2xs ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-75'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor: cat?.color || '#8B1A1A',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-xl select-none shrink-0 mt-0.5">
                      {cat?.emoji || '📍'}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-bold tracking-tight text-stone-900 ${
                            isDone ? 'line-through text-stone-400' : ''
                          }`}
                        >
                          {e.title}
                        </h3>

                        {/* Status badges */}
                        {e.cat === 'sugerido' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            Sugerido
                          </span>
                        )}
                        {e.cat === 'pendiente' && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                        {e.cat === 'revision' && (
                          <span className="text-[10px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            En revisión
                          </span>
                        )}
                        {e.fixed && (
                          <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Fecha fija
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {e.desc}
                      </p>
                    </div>
                  </div>

                  {!e.fixed && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 p-1"
                      title="Arrastrar a otro día"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Actions row */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(e.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isDone ? '¡Completado!' : 'Marcar listo'}
                  </button>

                  {!e.fixed && (
                    <button
                      type="button"
                      onClick={() => onMoveEvent(e.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 border border-purple-200 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Mover día
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Day Notes Card */}
      <div className="bg-[#FFFDEB] border border-amber-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <StickyNote className="w-4 h-4 text-amber-600" />
            <span>Nota del día</span>
          </div>

          {!isEditingNote && notes[noteKey] && (
            <button
              type="button"
              onClick={() => {
                setNoteText(notes[noteKey] || '');
                setIsEditingNote(true);
              }}
              className="text-xs text-amber-800 hover:underline font-semibold"
            >
              Editar
            </button>
          )}
        </div>

        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escribe recordatorios, ideas o tips para este día..."
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
            />
            <div className="flex items-center justify-end gap-2">
              {notes[noteKey] && (
                <button
                  type="button"
                  onClick={handleDeleteNote}
                  className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md font-semibold flex items-center gap-1 mr-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-200/50 rounded-md font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-1 text-xs bg-[#8B1A1A] hover:bg-[#701515] text-white rounded-md font-bold shadow-2xs flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Guardar
              </button>
            </div>
          </div>
        ) : notes[noteKey] ? (
          <p
            onClick={() => {
              setNoteText(notes[noteKey]);
              setIsEditingNote(true);
            }}
            className="text-xs text-stone-700 leading-relaxed cursor-pointer hover:bg-amber-100/50 p-1.5 rounded transition-colors whitespace-pre-wrap"
          >
            {notes[noteKey]}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNoteText('');
              setIsEditingNote(true);
            }}
            className="w-full py-2 px-3 border border-dashed border-amber-300 hover:bg-amber-100/40 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar una nota personal para este día
          </button>
        )}
      </div>
    </div>
  );
};
