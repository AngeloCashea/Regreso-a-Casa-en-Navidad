import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Tag,
  Compass,
  ListFilter,
  MapPin,
  X,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import {
  ESCAPES,
  MAP_CATEGORIES,
  MAP_PLACES,
  ZONE_ORDER,
} from '../data/calendarData';
import { MapPlace, MapSite } from '../types';

const VBW = 1000;
const VBH = 1080;
const LON0 = -67.016;
const LON_SPAN = 0.221;
const LAT1 = 10.6115;
const LAT_SPAN = 0.2356;
const MAX_ZOOM = 5;

const projX = (lon: number) => ((lon - LON0) / LON_SPAN) * VBW;
const projY = (lat: number) => ((LAT1 - lat) / LAT_SPAN) * VBH;

interface CaracasMapProps {
  onPlanClick?: (eventTitle: string) => void;
}

export const CaracasMap: React.FC<CaracasMapProps> = () => {
  const [subView, setSubView] = useState<'map' | 'directory'>('map');
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [legendOpen, setLegendOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const vpRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map()
  );
  const gestureRef = useRef<{
    type: 'pan' | 'pinch';
    x?: number;
    y?: number;
    px: number;
    py: number;
    d?: number;
    z?: number;
    m?: { x: number; y: number };
  } | null>(null);

  const getSitesOf = (p: MapPlace): MapSite[] => {
    if (p.sites && p.sites.length > 0) return p.sites;
    if (p.lat != null && p.lon != null) return [{ lat: p.lat, lon: p.lon }];
    return [];
  };

  const matchesCat = (p: MapPlace) =>
    activeCats.size === 0 || activeCats.has(p.cat);

  const toggleCat = (catKey: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveCats(new Set());
  };

  const clampPan = useCallback(
    (newX: number, newY: number, currentZoom: number) => {
      const w = vpRef.current?.clientWidth || 360;
      const h = vpRef.current?.clientHeight || (w * VBH) / VBW;
      const minX = -w * (currentZoom - 1);
      const minY = -h * (currentZoom - 1);
      return {
        x: Math.min(0, Math.max(minX, newX)),
        y: Math.min(0, Math.max(minY, newY)),
      };
    },
    []
  );

  const applyZoom = useCallback(
    (factor: number, focalX?: number, focalY?: number) => {
      setZoom((prevZoom) => {
        const nextZoom = Math.max(1, Math.min(MAX_ZOOM, prevZoom * factor));
        const w = vpRef.current?.clientWidth || 360;
        const h = vpRef.current?.clientHeight || (w * VBH) / VBW;
        const fx = focalX ?? w / 2;
        const fy = focalY ?? h / 2;

        setPan((prevPan) => {
          if (nextZoom === 1) return { x: 0, y: 0 };
          const ratio = nextZoom / prevZoom;
          const nx = fx - (fx - prevPan.x) * ratio;
          const ny = fy - (fy - prevPan.y) * ratio;
          return clampPan(nx, ny, nextZoom);
        });

        return nextZoom;
      });
    },
    [clampPan]
  );

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goToPlace = (placeId: string) => {
    const p = MAP_PLACES.find((x) => x.id === placeId);
    if (!p) return;
    const sites = getSitesOf(p);
    if (!sites.length) return;

    if (!matchesCat(p)) {
      clearFilters();
    }
    setSelectedId(placeId);
    setSubView('map');

    const s = sites[0];
    const w = vpRef.current?.clientWidth || 360;
    const h = vpRef.current?.clientHeight || (w * VBH) / VBW;
    const sc = w / VBW;
    const targetZoom = 2.4;

    const nx = w / 2 - projX(s.lon) * sc * targetZoom;
    const ny = h / 2 - projY(s.lat) * sc * targetZoom;

    setZoom(targetZoom);
    setPan(clampPan(nx, ny, targetZoom));

    vpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Pointer gesture handlers for pan and pinch
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;

    const handlePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.pin-element')) return;
      el.setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
      });
      setIsDragging(true);

      if (pointersRef.current.size === 1) {
        gestureRef.current = {
          type: 'pan',
          x: e.clientX,
          y: e.clientY,
          px: pan.x,
          py: pan.y,
        };
      } else if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        const d = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY
        );
        const rect = el.getBoundingClientRect();
        gestureRef.current = {
          type: 'pinch',
          d,
          z: zoom,
          m: {
            x: (pts[0].clientX + pts[1].clientX) / 2 - rect.left,
            y: (pts[0].clientY + pts[1].clientY) / 2 - rect.top,
          },
          px: pan.x,
          py: pan.y,
        };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
      });
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (pointersRef.current.size === 1 && gesture.type === 'pan') {
        const nx = gesture.px + (e.clientX - (gesture.x ?? e.clientX));
        const ny = gesture.py + (e.clientY - (gesture.y ?? e.clientY));
        setPan(clampPan(nx, ny, zoom));
      } else if (pointersRef.current.size === 2 && gesture.type === 'pinch') {
        const pts = Array.from(pointersRef.current.values());
        const d = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY
        );
        const initialD = gesture.d || d;
        const initialZ = gesture.z || 1;
        const newZ = Math.max(
          1,
          Math.min(MAX_ZOOM, initialZ * (d / initialD))
        );
        const ratio = newZ / initialZ;
        const mx = gesture.m?.x ?? 0;
        const my = gesture.m?.y ?? 0;
        const nx = mx - (mx - gesture.px) * ratio;
        const ny = my - (my - gesture.py) * ratio;

        setZoom(newZ);
        setPan(clampPan(nx, ny, newZ));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size === 0) {
        gestureRef.current = null;
        setIsDragging(false);
      } else if (pointersRef.current.size === 1) {
        const remaining = Array.from(pointersRef.current.values())[0];
        gestureRef.current = {
          type: 'pan',
          x: remaining.clientX,
          y: remaining.clientY,
          px: pan.x,
          py: pan.y,
        };
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 0.88;
      applyZoom(factor, e.clientX - rect.left, e.clientY - rect.top);
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan, clampPan, applyZoom]);

  // Compute separated pin positions
  const vpWidth = vpRef.current?.clientWidth || 360;
  const k = (vpWidth / VBW) * zoom;
  const u = 1 / (k || 1);
  const rpx = Math.min(15, 9 + 2.4 * (zoom - 1));

  const pinList: Array<{
    p: MapPlace;
    tag: string;
    ax: number;
    ay: number;
    x: number;
    y: number;
    label?: {
      txt: string;
      anchor: 'start' | 'end' | 'middle';
      lx: number;
      ly: number;
    } | null;
  }> = [];

  MAP_PLACES.forEach((p) => {
    getSitesOf(p).forEach((s) => {
      const ax = projX(s.lon) * k;
      const ay = projY(s.lat) * k;
      pinList.push({
        p,
        tag: s.tag || '',
        ax,
        ay,
        x: ax,
        y: ay,
      });
    });
  });

  const minD = 2 * rpx + 2;
  const maxMove = rpx * 2.6;
  for (let it = 0; it < 35; it++) {
    let moved = false;
    for (let i = 0; i < pinList.length; i++) {
      for (let j = i + 1; j < pinList.length; j++) {
        const a = pinList[i];
        const b = pinList[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d < minD) {
          if (d < 0.01) {
            dx = 1;
            dy = j % 2 ? 0.35 : -0.35;
            d = Math.hypot(dx, dy);
          }
          const push = (minD - d) / 2 + 0.01;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
          moved = true;
        }
      }
    }
    pinList.forEach((o) => {
      const mx = o.x - o.ax;
      const my = o.y - o.ay;
      const m = Math.hypot(mx, my);
      if (m > maxMove) {
        o.x = o.ax + (mx / m) * maxMove;
        o.y = o.ay + (my / m) * maxMove;
      }
    });
    if (!moved) break;
  }

  // Label collision avoidance
  const hitBox = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  const boxes = pinList.map((o) => ({
    x: o.x - rpx,
    y: o.y - rpx,
    w: 2 * rpx,
    h: 2 * rpx,
  }));
  const placedLabels: { x: number; y: number; w: number; h: number }[] = [];
  const order = pinList
    .map((_, i) => i)
    .sort(
      (a, b) =>
        (pinList[b].p.id === selectedId ? 1 : 0) -
        (pinList[a].p.id === selectedId ? 1 : 0)
    );

  order.forEach((i) => {
    const o = pinList[i];
    const sel = o.p.id === selectedId;
    o.label = null;
    if (!(sel || zoom >= 1.3)) return;
    if (!sel && activeCats.size && !matchesCat(o.p)) return;

    const txt = (o.p.short || o.p.name) + (o.tag ? ' · ' + o.tag : '');
    const W = txt.length * 6.4 + 6;
    const H = 15;
    const cands: [('start' | 'end' | 'middle'), number, number][] = [
      ['start', o.x + rpx + 4, o.y - H / 2],
      ['end', o.x - rpx - 4, o.y - H / 2],
      ['middle', o.x, o.y - rpx - 4 - H],
      ['middle', o.x, o.y + rpx + 4],
    ];

    for (const [anchor, lx, ly] of cands) {
      const r = {
        x: anchor === 'start' ? lx : anchor === 'end' ? lx - W : lx - W / 2,
        y: ly,
        w: W,
        h: H,
      };
      if (
        boxes.some((b, j) => j !== i && hitBox(r, b)) ||
        placedLabels.some((b) => hitBox(r, b))
      )
        continue;
      placedLabels.push(r);
      o.label = { txt, anchor, lx: lx - o.x, ly: ly + H / 2 - o.y };
      break;
    }
    if (!o.label && sel) {
      o.label = { txt, anchor: 'start', lx: rpx + 4, ly: 0 };
    }
  });

  const selectedPlace = MAP_PLACES.find((p) => p.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Sub tabs: Explorar vs Directorio */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-stone-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setSubView('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subView === 'map'
                ? 'bg-white text-[#8B1A1A] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Explorar mapa
          </button>
          <button
            type="button"
            onClick={() => setSubView('directory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subView === 'directory'
                ? 'bg-white text-[#8B1A1A] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Directorio de lugares
          </button>
        </div>
      </div>

      {subView === 'map' ? (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header & Controls toolbar */}
          <div className="p-4 border-b border-stone-200/80 bg-gradient-to-b from-stone-50/80 to-white">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  <span>🗺️ Caracas ilustrada</span>
                </h2>
                <p className="text-xs text-stone-500">
                  El Ávila al norte · Ubicaciones reales simplificadas para paseos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => applyZoom(0.8)}
                  disabled={zoom <= 1}
                  className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-xs font-semibold text-stone-600 tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => applyZoom(1.25)}
                  disabled={zoom >= MAX_ZOOM}
                  className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={resetMap}
                className="w-8 h-8 border border-stone-200 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-100 shadow-2xs"
                title="Centrar Caracas completa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1" />

              <button
                type="button"
                onClick={() => setLegendOpen(!legendOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                  legendOpen
                    ? 'border-[#8B1A1A] bg-[#8B1A1A] text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Tag className="w-3 h-3" />
                Categorías
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    legendOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Collapsible Categories Filter */}
            {legendOpen && (
              <div className="mt-3 pt-3 border-t border-stone-200 animate-in fade-in duration-150">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {Object.entries(MAP_CATEGORIES).map(([catKey, c]) => {
                    const active = activeCats.has(catKey);
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => toggleCat(catKey)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          active
                            ? 'text-white border-transparent shadow-xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                        style={{
                          backgroundColor: active ? c.color : undefined,
                        }}
                      >
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                  {activeCats.size > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs text-[#8B1A1A] hover:underline font-semibold ml-2"
                    >
                      Ver todas
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive SVG Viewport */}
          <div
            ref={vpRef}
            className={`relative aspect-[1000/1080] w-full overflow-hidden bg-[#FAF7F5] select-none touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Mountain Snow particle layer */}
            <div
              className={`absolute top-0 left-0 right-0 h-1/3 pointer-events-none overflow-hidden z-10 transition-opacity ${
                zoom > 1.6 ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {[...Array(16)].map((_, i) => (
                <span
                  key={i}
                  className="absolute -top-4 text-white animate-map-snow pointer-events-none"
                  style={{
                    left: `${(i * 6.25 + (i % 3) * 2) % 100}%`,
                    fontSize: `${8 + (i % 5) * 2}px`,
                    animationDuration: `${5 + (i % 4) * 2}s`,
                    animationDelay: `${-(i * 0.7)}s`,
                    opacity: 0.85,
                  }}
                >
                  {i % 2 === 0 ? '❄' : '❆'}
                </span>
              ))}
            </div>

            {/* The Caracas Vector SVG */}
            <svg
              className="w-full h-full block origin-top-left transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
              viewBox="0 0 1000 1080"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#070f24" />
                  <stop offset="1" stopColor="#162850" />
                </linearGradient>
                <linearGradient id="northGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0d2b20" />
                  <stop offset="1" stopColor="#1a4a2d" />
                </linearGradient>
                <linearGradient id="southGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1f6a43" />
                  <stop offset="0.55" stopColor="#2E8B57" />
                  <stop offset="1" stopColor="#5aa97a" />
                </linearGradient>
                <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#faf7f5" />
                </linearGradient>
                <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#faf7f5" />
                  <stop offset="1" stopColor="#f3ecea" />
                </linearGradient>
                <pattern
                  id="blocksPat"
                  width="26"
                  height="26"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="3"
                    y="3"
                    width="20"
                    height="20"
                    rx="4"
                    fill="#efe5e2"
                    opacity=".75"
                  />
                </pattern>
                <filter
                  id="pinShadowDrop"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1.2"
                    stdDeviation="1.6"
                    floodColor="#3a0d0d"
                    floodOpacity=".38"
                  />
                </filter>
                <clipPath id="clipLandArea">
                  <rect x="0" y="426" width="1000" height="654" />
                </clipPath>
              </defs>

              {/* Background land */}
              <rect width="1000" height="1080" fill="url(#landGrad)" />
              <rect
                x="0"
                y="426"
                width="1000"
                height="654"
                fill="url(#blocksPat)"
              />

              {/* El Ávila mountain ridges */}
              <path
                d="M0 3H1000V322L1000.0 321.8C990.4 319.0 962.6 305.6 942.1 305.0C921.6 304.4 898.6 320.4 876.9 317.9C855.2 315.4 833.5 290.8 811.8 290.2C790.1 289.6 768.3 316.5 746.6 314.0C724.9 311.5 703.1 276.9 681.4 275.4C659.7 273.9 634.9 310.5 616.3 305.0C597.7 299.5 590.4 241.5 569.9 242.6C549.4 243.7 514.4 303.2 493.2 311.4C472.0 319.6 461.8 289.9 442.5 291.9C423.2 293.8 396.7 319.2 377.4 323.1C358.1 327.0 343.6 314.2 326.7 315.3C309.8 316.4 295.4 329.7 276.0 329.5C256.6 329.3 232.7 314.2 210.0 314.0C187.3 313.8 163.3 327.3 140.0 328.2C116.7 329.1 93.3 318.5 70.0 319.2C46.7 319.9 11.7 330.0 0.0 332.1Z"
                fill="url(#northGrad)"
              />

              {/* Caribbean Sea to the north */}
              <path
                d="M0 0H1000V46Q930 54 860 44T720 48T580 42T440 50T300 44T160 52T0 44Z"
                fill="url(#seaGrad)"
              />

              {/* Sea sparkle stars */}
              <g>
                <circle cx="339" cy="9" r="1.2" fill="#fff" opacity="0.9" />
                <circle cx="57" cy="7" r="1.6" fill="#fff" opacity="0.5" />
                <circle cx="382" cy="23" r="0.9" fill="#fff" opacity="0.9" />
                <circle cx="227" cy="6" r="0.9" fill="#fff" opacity="0.7" />
                <circle cx="436" cy="7" r="0.9" fill="#fff" opacity="0.5" />
                <circle cx="572" cy="18" r="0.9" fill="#fff" opacity="0.9" />
                <circle cx="134" cy="12" r="1.6" fill="#fff" opacity="0.9" />
                <circle cx="604" cy="6" r="1.6" fill="#fff" opacity="0.9" />
                <circle cx="868" cy="7" r="1.2" fill="#fff" opacity="0.7" />
              </g>

              {/* Guaira highway connection */}
              <path
                d="M868 10l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"
                fill="#FFD700"
              />

              {/* South slope of El Ávila */}
              <path
                d="M0.0 332.1C11.7 330.0 46.7 319.9 70.0 319.2C93.3 318.5 116.7 329.1 140.0 328.2C163.3 327.3 187.3 313.8 210.0 314.0C232.7 314.2 256.6 329.3 276.0 329.5C295.4 329.7 309.8 316.4 326.7 315.3C343.6 314.2 358.1 327.0 377.4 323.1C396.7 319.2 423.2 293.8 442.5 291.9C461.8 289.9 472.0 319.6 493.2 311.4C514.4 303.2 549.4 243.7 569.9 242.6C590.4 241.5 597.7 299.5 616.3 305.0C634.9 310.5 659.7 273.9 681.4 275.4C703.1 276.9 724.9 311.5 746.6 314.0C768.3 316.5 790.1 289.6 811.8 290.2C833.5 290.8 855.2 315.4 876.9 317.9C898.6 320.4 921.6 304.4 942.1 305.0C962.6 305.6 990.4 319.0 1000.0 321.8 L1000 438 L0 438 Z"
                fill="url(#southGrad)"
              />

              {/* Snow caps on mountain peaks */}
              <path
                d="M413 316L432 305L443 291L455 306L473 316Q458 311 449 314Q440 309 431 315Q422 311 413 316Z"
                fill="#fff"
                opacity=".96"
              />
              <path
                d="M525 279L554 262L570 242L588 264L615 279Q592 271 579 276Q565 268 552 277Q538 271 525 279Z"
                fill="#fff"
                opacity=".96"
              />
              <path
                d="M648 302L670 290L681 274L695 291L714 302Q698 296 688 300Q678 294 668 301Q658 297 648 302Z"
                fill="#fff"
                opacity=".96"
              />
              <path
                d="M777 318L800 305L812 289L826 307L846 318Q829 312 819 316Q808 310 798 316Q788 312 777 318Z"
                fill="#fff"
                opacity=".96"
              />

              {/* Mountain foothills with pines */}
              <path
                d="M0 466V430Q20 414 40 430Q60 417 80 430Q100 420 120 430Q140 414 160 430Q180 417 200 430Q220 420 240 430Q260 414 280 430Q300 417 320 430Q340 420 360 430Q380 414 400 430Q420 417 440 430Q460 420 480 430Q500 414 520 430Q540 417 560 430Q580 420 600 430Q620 414 640 430Q660 417 680 430Q700 420 720 430Q740 414 760 430Q780 417 800 430Q820 420 840 430Q860 414 880 430Q900 417 920 430Q940 420 960 430Q980 414 1000 430V466Z"
                fill="url(#driftGrad)"
                stroke="#eadfdf"
                strokeWidth="1"
              />

              {/* Caracas City Parks & Rivers */}
              <g clipPath="url(#clipLandArea)">
                {/* Parque del Este */}
                <ellipse
                  cx="799"
                  cy="542"
                  rx="28"
                  ry="22"
                  fill="#cfe6cf"
                  opacity=".85"
                />
                <ellipse
                  cx="799"
                  cy="542"
                  rx="17"
                  ry="12"
                  fill="#b6d9b8"
                  opacity=".7"
                />
                {/* Los Caobos */}
                <ellipse
                  cx="570"
                  cy="564"
                  rx="30"
                  ry="23"
                  fill="#cfe6cf"
                  opacity=".85"
                />
                {/* Los Próceres */}
                <rect
                  x="509"
                  y="639"
                  width="14"
                  height="56"
                  rx="7"
                  fill="#cfe6cf"
                  opacity=".9"
                />
                {/* La Mariposa reservoir */}
                <ellipse
                  cx="389"
                  cy="939"
                  rx="34"
                  ry="18"
                  fill="#9fd0d8"
                />
                <ellipse
                  cx="382"
                  cy="936"
                  rx="18"
                  ry="7"
                  fill="#c4e6ea"
                  opacity=".8"
                />

                {/* Río Guaire */}
                <path
                  d="M981.9 602.8C962.3 598.2 902.7 580.6 864.3 575.3C825.8 569.9 785.1 570.7 751.1 570.7C717.2 570.7 690.8 572.2 660.6 575.3C630.5 578.4 596.5 585.2 570.1 589.0C543.7 592.9 522.6 588.3 502.3 598.2C481.9 608.1 463.8 625.0 448.0 648.6C432.1 672.3 419.3 712.1 407.2 740.3C395.2 768.6 383.1 795.3 375.6 818.3C368.0 841.2 364.3 867.9 362.0 877.8"
                  fill="none"
                  stroke="#a9d6dc"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  opacity=".9"
                />

                {/* Avenues & Highways: Autopista Fco Fajardo & Cota Mil */}
                <path
                  d="M411.8 495.1C432.5 496.8 502.3 501.0 536.2 505.6C570.1 510.2 587.1 516.9 615.4 522.6C643.7 528.2 675.7 533.4 705.9 539.5C736.0 545.7 762.4 551.8 796.4 559.3C830.3 566.7 878.6 577.2 909.5 584.5C940.4 591.7 969.8 599.7 981.9 602.8"
                  fill="none"
                  stroke="#FFE08A"
                  strokeWidth="6.4"
                  strokeLinecap="round"
                />
                <path
                  d="M343.9 488.2C362.7 485.5 419.3 476.0 457.0 472.2C494.7 468.3 536.2 468.0 570.1 465.3C604.1 462.6 626.7 456.9 660.6 456.1C694.6 455.3 739.8 459.2 773.8 460.7C807.7 462.2 834.1 463.0 864.3 465.3C894.4 467.6 939.7 472.9 954.8 474.4"
                  fill="none"
                  stroke="#FFE08A"
                  strokeWidth="6.4"
                  strokeLinecap="round"
                />
                <path
                  d="M459.3 543.2C459.7 547.0 458.9 548.6 461.5 566.1C464.2 583.7 473.6 622.7 475.1 648.6C476.6 674.6 469.8 696.8 470.6 722.0C471.3 747.2 478.1 786.9 479.6 799.9"
                  fill="none"
                  stroke="#FFE08A"
                  strokeWidth="6.4"
                  strokeLinecap="round"
                />
              </g>

              {/* Highway to La Guaira */}
              <path
                d="M389.1 518.0C386.9 493.9 377.8 420.6 375.6 373.6C373.3 326.6 376.3 278.1 375.6 236.1C374.8 194.1 376.3 150.1 371.0 121.5C365.8 92.8 371.0 74.9 343.9 64.2C316.7 53.5 254.5 58.6 208.1 57.3C161.8 56.0 89.4 56.5 65.6 56.4"
                fill="none"
                stroke="#FFE08A"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* District Labels */}
              <g
                style={{
                  opacity: zoom >= 2.2 ? 0.2 : zoom >= 1.4 ? 0.5 : 0.9,
                }}
              >
                <text
                  x="389"
                  y="461"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  Centro
                </text>
                <text
                  x="724"
                  y="497"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  Chacao · Altamira
                </text>
                <text
                  x="688"
                  y="650"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  Las Mercedes
                </text>
                <text
                  x="579"
                  y="626"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  Bello Monte
                </text>
                <text
                  x="543"
                  y="575"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  UCV
                </text>
                <text
                  x="959"
                  y="605"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  Petare
                </text>
                <text
                  x="859"
                  y="901"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  El Hatillo
                </text>
                <text
                  x="480"
                  y="727"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  Coche
                </text>
                <text
                  x="290"
                  y="837"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  La Rinconada
                </text>
                <text
                  x="276"
                  y="108"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#8B4545] select-none"
                >
                  La Guaira
                </text>
                <text
                  x="720"
                  y="372"
                  textAnchor="middle"
                  className="font-extrabold text-[14px] fill-[#e8f5ee] tracking-widest opacity-85 select-none"
                >
                  WARAIRA REPANO · EL ÁVILA
                </text>
                <text
                  x="640"
                  y="26"
                  textAnchor="middle"
                  className="font-semibold text-[11px] fill-[#c9d6ee] opacity-80 select-none"
                >
                  ↑ Mar Caribe
                </text>
              </g>

              {/* Compass Rose */}
              <g transform="translate(930 1010)">
                <circle
                  r="31"
                  fill="#fff"
                  stroke="#e8e0e0"
                  strokeWidth="2"
                />
                <circle
                  r="26"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                />
                <path d="M0 -21L7 2 0 18-7 2Z" fill="#8B1A1A" />
                <path d="M0 -21L7 2H-7Z" fill="#B22222" />
                <text
                  x="0"
                  y="-37"
                  textAnchor="middle"
                  className="font-extrabold text-[12px] fill-[#8B1A1A]"
                >
                  N
                </text>
              </g>

              {/* Map Scale */}
              <g transform="translate(730 1040)">
                <path
                  d="M0 0H83"
                  stroke="#8B1A1A"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M0 -6V6M83 -6V6M41.5 -4V4"
                  stroke="#8B1A1A"
                  strokeWidth="2"
                />
                <text
                  x="41"
                  y="-12"
                  textAnchor="middle"
                  className="font-bold text-[11px] fill-[#8B1A1A]"
                >
                  ≈ 2 km
                </text>
              </g>

              {/* Leader lines for offset pins */}
              <g id="leaders">
                {pinList
                  .filter((o) => Math.hypot(o.x - o.ax, o.y - o.ay) > 3)
                  .map((o, idx) => {
                    const c =
                      MAP_CATEGORIES[o.p.cat]?.color ||
                      MAP_CATEGORIES.celebrate.color;
                    return (
                      <g key={`lead-${idx}`}>
                        <line
                          x1={o.ax * u}
                          y1={o.ay * u}
                          x2={o.x * u}
                          y2={o.y * u}
                          stroke={c}
                          strokeWidth={1.6 * u}
                          strokeLinecap="round"
                          opacity={0.85}
                        />
                        <circle
                          cx={o.ax * u}
                          cy={o.ay * u}
                          r={2.8 * u}
                          fill={c}
                          stroke="#fff"
                          strokeWidth={1 * u}
                        />
                      </g>
                    );
                  })}
              </g>

              {/* Pins layer */}
              <g id="pins">
                {[...pinList]
                  .sort(
                    (a, b) =>
                      (a.p.id === selectedId ? 1 : 0) -
                      (b.p.id === selectedId ? 1 : 0)
                  )
                  .map((o, idx) => {
                    const p = o.p;
                    const c =
                      MAP_CATEGORIES[p.cat] || MAP_CATEGORIES.celebrate;
                    const sel = selectedId === p.id;
                    const pend = p.status === 'pending';
                    const appr = p.status === 'approx';
                    const dim =
                      activeCats.size > 0 && !matchesCat(p) ? 0.28 : 1;
                    const bx = rpx * 0.72;
                    const by = -rpx * 0.72;

                    return (
                      <g
                        key={`pin-${p.id}-${idx}`}
                        className="pin-element cursor-pointer group"
                        transform={`translate(${o.x * u} ${o.y * u}) scale(${u})`}
                        opacity={dim}
                        onClick={() =>
                          setSelectedId(sel ? null : p.id)
                        }
                      >
                        {/* Touch hit target */}
                        <circle
                          r={Math.max(rpx + 4, 18)}
                          fill="transparent"
                        />

                        {/* Halo */}
                        <circle
                          r={rpx + 5.5}
                          fill="none"
                          stroke="#FFD700"
                          strokeWidth={3.5}
                          className={`transition-opacity duration-150 ${
                            sel ? 'opacity-100' : 'opacity-0'
                          }`}
                        />

                        {/* Approx status ring */}
                        {appr && (
                          <circle
                            r={rpx + 3.4}
                            fill="none"
                            stroke={c.color}
                            strokeWidth={1.7}
                            strokeDasharray="3 2.4"
                          />
                        )}

                        {/* Main pin core */}
                        <circle
                          r={rpx}
                          fill={pend ? '#ffffff' : c.color}
                          stroke={pend ? c.color : '#ffffff'}
                          strokeWidth={pend ? 2.2 : 2}
                          strokeDasharray={pend ? '4 2.6' : undefined}
                          filter="url(#pinShadowDrop)"
                        />

                        {/* Icon */}
                        <text
                          y="1"
                          fontSize={(rpx * 1.05).toFixed(1)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none select-none"
                        >
                          {p.icon}
                        </text>

                        {/* Badges for review or pending */}
                        {p.review && (
                          <circle
                            cx={bx}
                            cy={by}
                            r="4.8"
                            fill="#CC7722"
                            stroke="#fff"
                            strokeWidth="1.6"
                          />
                        )}
                        {pend && (
                          <g>
                            <circle
                              cx={bx}
                              cy={by}
                              r="6"
                              fill="#B8860B"
                              stroke="#fff"
                              strokeWidth="1.4"
                            />
                            <text
                              x={bx}
                              y={by + 0.5}
                              fontSize="9"
                              fontWeight="800"
                              fill="#fff"
                              textAnchor="middle"
                              dominantBaseline="central"
                            >
                              ?
                            </text>
                          </g>
                        )}

                        {/* Label text */}
                        {o.label && (
                          <text
                            x={o.label.lx}
                            y={o.label.ly}
                            textAnchor={o.label.anchor}
                            dominantBaseline="central"
                            className={`font-bold text-[11px] select-none pointer-events-none ${
                              sel ? 'fill-[#8B1A1A]' : 'fill-[#4a1c1c]'
                            }`}
                            style={{
                              paintOrder: 'stroke',
                              stroke: '#FAF7F5',
                              strokeWidth: '3.5px',
                              strokeLinejoin: 'round',
                            }}
                          >
                            {o.label.txt}
                          </text>
                        )}
                      </g>
                    );
                  })}
              </g>
            </svg>
          </div>

          {/* Quick legend strip */}
          <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-semibold text-stone-700">Estado:</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-stone-300" />
                Sede identificada
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-amber-600 bg-white" />
                Sede por elegir
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-orange-500" />
                En revisión
              </span>
            </div>
            <span className="text-[11px] text-stone-400">
              💡 Arrastra para mover el mapa · Usa dos dedos para zoom
            </span>
          </div>
        </div>
      ) : (
        /* Directory View */
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 items-center p-3 bg-white rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500 mr-2">
              Filtrar por:
            </span>
            {Object.entries(MAP_CATEGORIES).map(([catKey, c]) => {
              const active = activeCats.has(catKey);
              return (
                <button
                  key={`dir-cat-${catKey}`}
                  type="button"
                  onClick={() => toggleCat(catKey)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'text-white border-transparent'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                  style={{
                    backgroundColor: active ? c.color : undefined,
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
            {activeCats.size > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#8B1A1A] hover:underline font-semibold ml-2"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {ZONE_ORDER.map((zone) => {
              const placesInZone = MAP_PLACES.filter(
                (p) => p.zone === zone && matchesCat(p)
              );
              if (!placesInZone.length) return null;

              return (
                <details
                  key={zone}
                  className="group bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs"
                  open={zone !== 'Pendientes de sede'}
                >
                  <summary className="cursor-pointer list-none flex items-center justify-between p-3.5 hover:bg-stone-50 transition-colors">
                    <span className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#8B1A1A]" />
                      {zone}
                    </span>
                    <span className="text-xs font-bold text-[#8B1A1A] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      {placesInZone.length}{' '}
                      {placesInZone.length === 1 ? 'lugar' : 'lugares'}
                    </span>
                  </summary>

                  <div className="px-3 pb-3 space-y-1 divide-y divide-stone-100">
                    {placesInZone.map((p) => {
                      const c =
                        MAP_CATEGORIES[p.cat] || MAP_CATEGORIES.celebrate;
                      const isSel = selectedId === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`pt-2 flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                            isSel ? 'bg-amber-50/80 ring-1 ring-amber-300' : 'hover:bg-stone-50'
                          }`}
                          onClick={() => setSelectedId(isSel ? null : p.id)}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base"
                            style={{ backgroundColor: `${c.color}22` }}
                          >
                            {p.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-bold text-stone-900">
                                {p.name}
                              </strong>
                              {p.review && (
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded">
                                  En revisión
                                </span>
                              )}
                              {p.status === 'pending' && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                  Por elegir
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                              {p.summary}
                            </p>
                          </div>

                          {p.lat != null && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToPlace(p.id);
                              }}
                              className="px-2 py-1 text-xs font-bold text-[#8B1A1A] hover:bg-red-50 rounded border border-red-200 transition-colors shrink-0"
                            >
                              Ver en mapa
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected place detail drawer */}
      {selectedPlace && (
        <div className="p-4 bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-stone-200 shadow-md animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-2xs"
                style={{
                  backgroundColor: `${
                    (MAP_CATEGORIES[selectedPlace.cat] || MAP_CATEGORIES.celebrate)
                      .color
                  }20`,
                }}
              >
                {selectedPlace.icon}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  {selectedPlace.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-stone-700">
                    {MAP_CATEGORIES[selectedPlace.cat]?.label}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-xs text-stone-500 font-medium">
                    {selectedPlace.zone}
                  </span>
                  {selectedPlace.review && (
                    <span className="text-[11px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                      🔍 En revisión
                    </span>
                  )}
                  {selectedPlace.status === 'pending' && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      📋 Sede por definir
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              aria-label="Cerrar detalle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/60">
            {selectedPlace.summary}
          </p>

          {/* Associated activities */}
          <div className="mt-3">
            <span className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider block mb-1.5">
              Planes en este lugar:
            </span>
            {selectedPlace.activities && selectedPlace.activities.length > 0 ? (
              <div className="space-y-1.5">
                {selectedPlace.activities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-stone-800 bg-white p-2 rounded-lg border border-stone-200/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B1A1A]" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Aún no hay un plan con fecha asignada en este sitio.
              </p>
            )}
          </div>

          {selectedPlace.lat != null && subView === 'directory' && (
            <div className="mt-3 pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => goToPlace(selectedPlace.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B1A1A] hover:bg-[#721515] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Ver en el mapa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Escapadas fuera de Caracas */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>🏝️ Escapadas fuera de Caracas</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {ESCAPES.map((e, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded-xl border border-stone-200 flex items-start gap-2.5 shadow-2xs"
            >
              <span className="text-2xl">{e.icon}</span>
              <div>
                <strong className="text-xs font-bold text-stone-900 block">
                  {e.name}
                </strong>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  {e.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
