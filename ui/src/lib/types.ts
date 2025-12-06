import type { Feature, FeatureCollection, Polygon, Point } from 'geojson';

export type HazardSeverity = 'none' | 'low' | 'moderate' | 'high' | 'unknown';
export type DroughtSeverity = 'none' | 'watch' | 'emerging' | 'severe' | 'unknown';
export type AnalysisMode = 'demo' | 'live';
export type AggregationType = 'monthly' | 'yearly';

export interface TimeRange {
  start: string;
  end: string;
}

export interface HistoryConfig {
  yearsBack: number;
  aggregation: AggregationType;
}

export interface HazardSelection {
  flood: boolean;
  fire: boolean;
  drought: boolean;
}

export interface FloodSummary {
  severity: HazardSeverity;
  floodedAreaKm2: number | null;
  floodedAreaPercentOfAOI: number | null;
  note?: string;
}

export interface FireSummary {
  severity: HazardSeverity;
  hotspotsCount: number | null;
  clusters?: number;
  note?: string;
}

export interface DroughtSummary {
  severity: DroughtSeverity;
  ndviAnomaly: number | null;
  rainfallAnomalyMm: number | null;
  note?: string;
}

export interface AnalysisSummary {
  flood: FloodSummary;
  fire: FireSummary;
  drought: DroughtSummary;
}

export interface GeoJsonLayers {
  aoi: Feature<Polygon>;
  floodExtent?: FeatureCollection<Polygon>;
  firePoints?: FeatureCollection<Point>;
  droughtGrid?: FeatureCollection<Polygon>;
}

// Historical time-series data types
export interface FloodHistoryPoint {
  periodStart: string;
  periodEnd: string;
  floodedAreaKm2: number | null;
  floodedAreaPercentOfAOI: number | null;
}

export interface FireHistoryPoint {
  periodStart: string;
  periodEnd: string;
  hotspotsCount: number | null;
}

export interface DroughtHistoryPoint {
  periodStart: string;
  periodEnd: string;
  ndviAnomaly: number | null;
  rainfallAnomalyMm: number | null;
  droughtSeverity: DroughtSeverity;
}

export interface HistoryData {
  flood?: {
    aggregation: AggregationType;
    series: FloodHistoryPoint[];
  };
  fire?: {
    aggregation: AggregationType;
    series: FireHistoryPoint[];
  };
  drought?: {
    aggregation: AggregationType;
    series: DroughtHistoryPoint[];
  };
}

export interface AnalysisResult {
  analysisId: string;
  summary: AnalysisSummary;
  geojsonLayers: GeoJsonLayers;
  generatedAt: string;
  mode: AnalysisMode;
  timeRange: TimeRange;
  aoiName?: string;
  history?: HistoryData;
}

export interface AnalysisRequest {
  aoi: Feature<Polygon>;
  mode: AnalysisMode;
  historyConfig: HistoryConfig;
  hazards: HazardSelection;
  aoiName?: string;
}

export interface SampleAOI {
  id: string;
  name: string;
  description: string;
  feature: Feature<Polygon>;
  center: [number, number];
  zoom: number;
}
