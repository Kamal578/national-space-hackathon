import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface HazardApiFeatures {
  climate?: {
    t2m_mean?: number;
    t2m_max?: number;
    precip_sum?: number;
    wind_mean?: number;
  };
  drought?: {
    chirps_precip_sum?: number;
    chirps_precip_mean?: number;
  };
  fire?: {
    fires_count?: number;
    fires_mean_brightness?: number;
    fires_mean_frp?: number;
  };
}

export interface HazardApiResponse {
  lat: number;
  lon: number;
  start: string;
  end: string;
  features: HazardApiFeatures;
}

export interface HazardApiResult {
  success: boolean;
  data?: HazardApiResponse;
  error?: string;
  source: string;
}

function getBbox(aoi: Feature<Polygon>): [number, number, number, number] {
  const bbox = turf.bbox(aoi);
  return [bbox[0], bbox[1], bbox[2], bbox[3]];
}

function getCentroid(aoi: Feature<Polygon>): { lon: number; lat: number } {
  const centroid = turf.centroid(aoi);
  const [lon, lat] = centroid.geometry.coordinates;
  return { lon, lat };
}

export async function fetchHazardFeaturesFromApi(
  aoi: Feature<Polygon>,
  startDate: string,
  endDate: string,
  firmsDays: number = 7
): Promise<HazardApiResult> {
  const bbox = getBbox(aoi);
  const { lat, lon } = getCentroid(aoi);

  try {
    const response = await fetch(`${API_BASE_URL}/hazard-features`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat,
        lon,
        start: startDate,
        end: endDate,
        bbox,
        firms_days: firmsDays
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      source: `${API_BASE_URL}/hazard-features`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: `${API_BASE_URL}/hazard-features`
    };
  }
}
