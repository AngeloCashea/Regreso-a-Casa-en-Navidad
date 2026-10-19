import React, { useEffect, useState } from 'react';
import { Calendar, X, Check, AlertCircle } from 'lucide-react';
import { DAYS_OF_WEEK, DEC_START_DOW } from '../data/calendarData';

interface DayPickerModalProps {
  isOpen: boolean;
  title: string;
  currentInfo?: string;
  onClose: () => void;
  onConfirm: (target: { day: number; month: number }) => void;
}

export const DayPickerModal: React.FC<DayPickerModalProps> = ({
  isOpen,
  title,
  currentInfo,
  onClose,
  onConfirm,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parseDayInput = (val: string): { day: number; month: number } | null => {
    if (!val) return null;
    const raw = val.trim().toLowerCase();
    let day = 0;
    let month = 12;

    if (
      raw.includes('ene') ||
      raw.includes('jan') ||
      (raw.startsWith('e') && raw.length <= 3)
    ) {
      day = parseInt(raw.replace(/[^\d]/g, ''), 10);
      month = 1;
    } else {
      day = parseInt(raw, 10);
      if (day > 100) {
        day -= 100;
        month = 1;
      }
    }

    if (isNaN(day)) return null;
    if (month === 12 && (day < 3 || day > 31)) return null;
    if (month === 1 && (day < 1 || day > 2)) return null;
    return { day, month };
  };

  const handleManualConfirm = () => {
    const parsed = parseDayInput(inputValue);
    if (!parsed) {
      setError(true);
      return;
    }
    setError(false);
    onConfirm(parsed);
    onClose();
  };

  const handleSelect = (day: number, month: number) => {
    onConfirm({ day, month });
    onClose();
  };

  // Helper for weekday labels in the modal picker
  const getDow = (d: number, m: number) => {
    if (m === 12) return DAYS_OF_WEEK[(DEC_START_DOW + d - 1) % 7];
    const dec31dow = (DEC_START_DOW + 30) % 7;
    return DAYS_OF_WEEK[(dec31dow + d) % 7];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#8B1A1A] via-[#A82323] to-[#8B1A1A] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {currentInfo && (
            <div className="bg-amber-50 text-amber-900 text-xs px-3 py-2 rounded-lg border border-amber-200/80 font-medium">
              {currentInfo}
            </div>
          )}

          {/* Quick select grid */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
              Selecciona un día rápidamente:
            </label>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-[#8B1A1A] uppercase tracking-wide">
                  Diciembre 2026 (del 3 al 31)
                </span>
                <div className="grid grid-cols-7 gap-1.5 mt-1.5">
                  {Array.from({ length: 29 }, (_, i) => i + 3).map((d) => (
                    <button
                      key={`d-${d}`}
                      type="button"
                      onClick={() => handleSelect(d, 12)}
                      className="group flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border border-stone-200 hover:border-[#8B1A1A] hover:bg-[#8B1A1A] hover:text-white transition-all text-center bg-stone-50/70"
                    >
                      <span className="text-[9px] text-stone-500 group-hover:text-amber-200 font-medium">
                        {getDow(d, 12)}
                      </span>
                      <span className="text-xs font-bold text-stone-800 group-hover:text-white">
                        {d}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                  Enero 2027 (E1 y E2)
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[1, 2].map((d) => (
                    <button
                      key={`e-${d}`}
                      type="button"
                      onClick={() => handleSelect(d, 1)}
                      className="group flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-sky-200 hover:border-sky-600 hover:bg-sky-700 hover:text-white transition-all bg-sky-50"
                    >
                      <span className="text-xs font-bold text-sky-900 group-hover:text-white">
                        Enero {d} ({getDow(d, 1)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-stone-200 pt-3">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[11px] text-stone-400 font-medium">
              o escribe el día
            </span>

            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualConfirm();
                }}
                placeholder="Ej: 29 o E1"
                className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A]"
              />
              <button
                type="button"
                onClick={handleManualConfirm}
                className="px-4 py-2 bg-[#8B1A1A] hover:bg-[#721515] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar
              </button>
            </div>

            {error && (
              <p className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Día no válido. Usa 3–31 para Dic o E1/E2 para Ene.
              </p>
            )}
          </div>
        </div>

        <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
