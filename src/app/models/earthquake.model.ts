export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  coordinates: Coordinates;
  depth?: number;
  url?: string;
}

export interface EarthquakeMeta {
  count: number;
  source: string;
  timestamp: string;
  cached: boolean;
}

export interface EarthquakeListResponse {
  metadata: EarthquakeMeta;
  data: Earthquake[];
}

export interface EarthquakeFilters {
  startDate: string;
  endDate: string;
  minMagnitude: number;
  maxMagnitude: number;
  location: string;
}

export interface EarthquakeStats {
  total: number;
  highestMagnitude: number;
  lastActivity: string | null;
}

export type ViewMode = 'map' | 'list';
export type ThemeMode = 'light' | 'dark';
export type MapStyle = 'road' | 'night' | 'satellite_road_labels';
