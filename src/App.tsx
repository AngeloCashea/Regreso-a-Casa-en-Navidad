import React, { useState, useEffect } from 'react';
import { Calendar, List, Map, Sparkles, HelpCircle } from 'lucide-react';
import {
  CATEGORIES,
  DATA_VERSION,
  DEFAULT_EVENTS,
  STANDBY,
} from './data/calendarData';
import { CalendarEvent } from './types';
import { Header } from './components/Header';
import { CalendarGrid } from './components/CalendarGrid';
import { DayDetailPanel } from './components/DayDetailPanel';
import { ListView } from './components/ListView';
import { CaracasMap } from './components/CaracasMap';
import { StandbySection } from './components/StandbySection';
import { DayPickerModal } from './components/DayPickerModal';
import { ChristmasScene } from './components/ChristmasScene';
import { AudioPlayer } from './components/AudioPlayer';

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const savedVersion = parseInt(
        localStorage.getItem('xmas-version') || '0',
        10
      );
      if (savedVersion < DATA_VERSION) {
        localStorage.setItem('xmas-version', DATA_VERSION.toString());
        const saved = localStorage.getItem('xmas-events');
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as CalendarEvent[];
            const existingIds = new Set(parsed.map((e) => e.id));
            const missing = DEFAULT_EVENTS.filter((e) => !existingIds.has(e.id));
            const updated = missing.length > 0 ? [...parsed, ...missing] : parsed;
            localStorage.setItem('xmas-events', JSON.stringify(updated));
            return updated;
          } catch {
            // fallback to default events
          }
        }
        localStorage.setItem('xmas-events', JSON.stringify(DEFAULT_EVENTS));
        return JSON.parse(JSON.stringify(DEFAULT_EVENTS));
      }
      const saved = localStorage.getItem('xmas-events');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CalendarEvent[];
          const existingIds = new Set(parsed.map((e) => e.id));
          const missing = DEFAULT_EVENTS.filter((e) => !existingIds.has(e.id));
          if (missing.length > 0) {
            const updated = [...parsed, ...missing];
            localStorage.setItem('xmas-events', JSON.stringify(updated));
            return updated;
          }
          return parsed;
        } catch {
          return DEFAULT_EVENTS;
        }
      }
      return DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  });

  const [completed, setCompleted] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('xmas-completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('xmas-notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentView, setCurrentView] = useState<'calendar' | 'list' | 'map'>(
    'calendar'
  );
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dragItemId, setDragItemId] = useState<number | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCurrent, setModalCurrent] = useState('');
  const [modalTargetId, setModalTargetId] = useState<number | null>(null);
  const [modalIsStandby, setModalIsStandby] = useState(false);

  // Persistence helpers
  useEffect(() => {
    try {
      localStorage.setItem('xmas-events', JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('xmas-completed', JSON.stringify(completed));
    } catch (e) {
      console.error(e);
    }
  }, [completed]);

  useEffect(() => {
    try {
      localStorage.setItem('xmas-notes', JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  // Event handlers
  const handleToggleComplete = (id: number) => {
    setCompleted((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveNote = (key: string, content: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (!content.trim()) {
        delete next[key];
      } else {
        next[key] = content;
      }
      return next;
    });
  };

  const handleSelectDay = (day: number | null, month: number | null) => {
    setSelectedDay(day);
    setSelectedMonth(month);
  };

  const handleDragStart = (id: number) => {
    setDragItemId(id);
  };

  const handleDragEnd = () => {
    setDragItemId(null);
  };

  const handleDropOnDay = (targetDay: number, targetMonth: number) => {
    if (dragItemId == null) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === dragItemId && !e.fixed) {
          return { ...e, day: targetDay, month: targetMonth };
        }
        return e;
      })
    );
    setDragItemId(null);
  };

  // Open modal to change event day
  const handleChangeEventDay = (id: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setModalTitle(`📅 Mover: ${ev.title}`);
    setModalCurrent(
      `Actualmente programado: ${ev.day} de ${
        ev.month === 12 ? 'Diciembre' : 'Enero'
      }`
    );
    setModalTargetId(id);
    setModalIsStandby(false);
    setModalOpen(true);
  };

  // Open modal to schedule standby item
  const handleScheduleStandby = (id: number) => {
    const sb = STANDBY.find((s) => s.id === id);
    if (!sb) return;
    const existing = events.find((e) => e.id === id);
    setModalTitle(
      `📅 ${existing ? 'Mover' : 'Agendar'}: ${sb.title
        .replace('🔍', '')
        .trim()}`
    );
    setModalCurrent(
      existing
        ? `Actualmente programado: ${existing.day} de ${
            existing.month === 12 ? 'Diciembre' : 'Enero'
          }`
        : 'Aún no tiene fecha asignada en el calendario.'
    );
    setModalTargetId(id);
    setModalIsStandby(true);
    setModalOpen(true);
  };

  const handleConfirmModal = (target: { day: number; month: number }) => {
    if (modalTargetId == null) return;

    if (modalIsStandby) {
      const sb = STANDBY.find((s) => s.id === modalTargetId);
      if (!sb) return;
      const existing = events.find((e) => e.id === modalTargetId);
      if (existing) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === modalTargetId
              ? { ...e, day: target.day, month: target.month }
              : e
          )
        );
      } else {
        setEvents((prev) => [
          ...prev,
          {
            id: sb.id,
            day: target.day,
            month: target.month,
            title: sb.title.replace('🔍', '').trim(),
            desc: sb.desc,
            cat: 'revision',
          },
        ]);
      }
    } else {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === modalTargetId
            ? { ...e, day: target.day, month: target.month }
            : e
        )
      );
    }

    setModalOpen(false);
  };

  // Computed metrics
  const eventIds = new Set(events.map((e) => e.id));
  const completedCount = Object.keys(completed).filter(
    (k) => completed[Number(k)] && eventIds.has(Number(k))
  ).length;

  const totalCount = events.length;

  // Events of selected day for the detail drawer
  const selectedDayEvents =
    selectedDay && selectedMonth
      ? events.filter(
          (e) =>
            e.day === selectedDay &&
            e.month === selectedMonth &&
            (!filterCat || e.cat === filterCat)
        )
      : [];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1E1E] selection:bg-[#B22222] selection:text-white pb-24">
      {/* Container */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-5">
        {/* Header with progress */}
        <Header completedCount={completedCount} totalCount={totalCount} />

        {/* View switcher tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-stone-200/80 rounded-2xl shadow-inner border border-stone-200">
            <button
              type="button"
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'calendar'
                  ? 'bg-white text-[#8B1A1A] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendario</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'list'
                  ? 'bg-white text-[#8B1A1A] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('map')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'map'
                  ? 'bg-white text-[#8B1A1A] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Mapa</span>
            </button>
          </div>
        </div>

        {/* Category filters (active for Calendar & List views) */}
        {currentView !== 'map' && (
          <div className="flex flex-wrap gap-1.5 justify-center items-center py-1">
            <button
              type="button"
              onClick={() => setFilterCat(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filterCat === null
                  ? 'bg-[#8B1A1A] border-[#8B1A1A] text-white shadow-xs'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              Todos ({events.length})
            </button>

            {Object.entries(CATEGORIES).map(([catKey, cat]) => {
              const active = filterCat === catKey;
              const count = events.filter((e) => e.cat === catKey).length;
              if (count === 0) return null;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setFilterCat(active ? null : catKey)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? 'text-white border-transparent shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200/90 hover:border-stone-300'
                  }`}
                  style={{
                    backgroundColor: active ? cat.color : undefined,
                  }}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      active ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Views */}
        {currentView === 'calendar' && (
          <div className="space-y-4">
            <CalendarGrid
              events={events}
              completed={completed}
              selectedDay={selectedDay}
              selectedMonth={selectedMonth}
              filterCat={filterCat}
              onSelectDay={handleSelectDay}
              onDropEvent={handleDropOnDay}
            />

            {selectedDay != null && selectedMonth != null && (
              <DayDetailPanel
                day={selectedDay}
                month={selectedMonth}
                events={selectedDayEvents}
                completed={completed}
                notes={notes}
                onClose={() => handleSelectDay(null, null)}
                onToggleComplete={handleToggleComplete}
                onMoveEvent={handleChangeEventDay}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onSaveNote={handleSaveNote}
              />
            )}
          </div>
        )}

        {currentView === 'list' && (
          <ListView
            events={events}
            completed={completed}
            filterCat={filterCat}
            onToggleComplete={handleToggleComplete}
            onMoveEvent={handleChangeEventDay}
          />
        )}

        {currentView === 'map' && <CaracasMap />}

        {/* Standby Section */}
        {currentView !== 'map' && (
          <StandbySection
            events={events}
            completed={completed}
            onToggleComplete={handleToggleComplete}
            onScheduleStandby={handleScheduleStandby}
          />
        )}

        {/* Tips & Legend */}
        {currentView !== 'map' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <HelpCircle className="w-4 h-4 text-[#8B1A1A]" />
              <span>Guía para el viaje</span>
            </div>
            <p className="leading-relaxed">
              {currentView === 'calendar'
                ? '• Toca cualquier día para abrir sus planes, marcar actividades completadas o escribir notas personales. Arrastra eventos entre casillas para reorganizarlos.'
                : '• Marca cada aventura conforme la vayan viviendo en familia. El progreso se actualiza automáticamente.'}
            </p>
            <p className="leading-relaxed">
              • ⚾🦁 <strong>Béisbol:</strong> Mamá elige entre Leones vs Caribes (domingo 6 Dic, más tranquilo) o el Clásico Leones vs Magallanes (martes 15 Dic, más intenso).
            </p>
            <p className="leading-relaxed">
              • 🔍 <strong>La Guaira:</strong> Queda en revisión por las reparaciones del terremoto; puedes agendarla en cualquier fecha disponible con el botón "Agendar".
            </p>
          </div>
        )}

        {/* Animated Christmas Scene at the bottom */}
        <div className="pt-2">
          <ChristmasScene />
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-stone-400 py-4 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Navidad 2026 · Caracas, Venezuela ❤️</span>
        </footer>
      </main>

      {/* Floating Holiday Music Synthesizer Button */}
      <AudioPlayer />

      {/* Day Picker Modal */}
      <DayPickerModal
        isOpen={modalOpen}
        title={modalTitle}
        currentInfo={modalCurrent}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmModal}
      />
    </div>
  );
}
