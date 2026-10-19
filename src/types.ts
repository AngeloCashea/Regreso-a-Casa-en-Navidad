export type CategoryKey =
  | 'playa'
  | 'montaña'
  | 'ciudad'
  | 'gastronomia'
  | 'entretenimiento'
  | 'celebracion'
  | 'sugerido'
  | 'pendiente'
  | 'revision';

export interface CategoryInfo {
  label: string;
  color: string;
  emoji: string;
  bgLight: string;
  border: string;
  textColor: string;
}

export interface CalendarEvent {
  id: number;
  day: number;
  month: number; // 12 or 1
  title: string;
  desc: string;
  cat: CategoryKey;
  fixed?: boolean;
}

export interface StandbyItem {
  id: number;
  title: string;
  desc: string;
}

export interface MapSite {
  lat: number;
  lon: number;
  tag?: string;
}

export interface MapPlace {
  id: string;
  name: string;
  short?: string;
  cat: 'food' | 'nature' | 'city' | 'fun' | 'celebrate' | 'family';
  zone: string;
  icon: string;
  lat?: number;
  lon?: number;
  status: 'identified' | 'approx' | 'pending';
  review?: boolean;
  sites?: MapSite[];
  summary: string;
  activities: string[];
}

export interface MapCategory {
  label: string;
  icon: string;
  color: string;
}

export interface EscapeDestination {
  icon: string;
  name: string;
  text: string;
}
