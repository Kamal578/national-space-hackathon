import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import type { HazardUnits } from './types';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';  
const API_BASE_URL = 'https://hazard-api-562229553414.europe-central2.run.app';
export const DEFAULT_UNITS: HazardUnits = {
  climate: {
    t2m_mean: 'degC',
    t2m_max: 'degC',
    precip_sum: 'mm',
    wind_mean: 'm/s'
  },
  drought: {
    chirps_precip_sum: 'mm',
    chirps_precip_mean: 'mm/day'
  },
  fire: {
    fires_count: 'count',
    fires_mean_brightness: 'Kelvin',
    fires_mean_frp: 'MW'
  }
};

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
  units?: HazardUnits;
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

export async function fetchHazardFeaturesFromApi(
  aoi: Feature<Polygon>,
  startDate: string,
  endDate: string,
  firmsDays: number = 7
): Promise<HazardApiResult> {
  const bbox = getBbox(aoi);

  try {
    const response = await fetch(`${API_BASE_URL}/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bbox,
        start: startDate,
        end: endDate,
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
      source: `${API_BASE_URL}/compute`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: `${API_BASE_URL}/compute`
    };
  }
}
