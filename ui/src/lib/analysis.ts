import * as turf from '@turf/turf';
import type { Feature, Polygon, FeatureCollection, Point } from 'geojson';
import type {
  AnalysisRequest,
  AnalysisResult,
  FloodSummary,
  FireSummary,
  DroughtSummary,
  HazardSeverity,
  DroughtSeverity,
  TimeRange
} from './types';
import { sampleAOIs } from '@/data/sampleAOI';
import { sampleFloodExtent, californiaFloodExtent, kenyaFloodExtent } from '@/data/sampleFlood';
import { californiaFirePoints, bangladeshFirePoints, kenyaFirePoints } from '@/data/sampleFire';
import { kenyaDroughtGrid, bangladeshDroughtGrid, californiaDroughtGrid } from '@/data/sampleDrought';
import { DEFAULT_UNITS, fetchHazardFeaturesFromApi } from './liveDataService';
import { generateHistoryData, getDefaultTimeRangeFromHistory } from './historyGenerator';

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFloodSeverity(areaKm2: number): HazardSeverity {
  if (areaKm2 === 0) return 'none';
  if (areaKm2 < 1) return 'low';
  if (areaKm2 <= 10) return 'moderate';
  return 'high';
}

function getFireSeverity(count: number): HazardSeverity {
  if (count === 0) return 'none';
  if (count <= 3) return 'low';
  if (count <= 10) return 'moderate';
  return 'high';
}

function getDroughtSeverity(ndviAnomaly: number, rainfallAnomaly: number): DroughtSeverity {
  if (ndviAnomaly > -0.05 && rainfallAnomaly > -10) return 'none';
  if (ndviAnomaly > -0.1 || rainfallAnomaly > -25) return 'watch';
  if (ndviAnomaly > -0.2 || rainfallAnomaly > -50) return 'emerging';
  return 'severe';
}

function findMatchingRegion(aoi: Feature<Polygon>): string | null {
  const aoiCenter = turf.centroid(aoi);
  const [lng, lat] = aoiCenter.geometry.coordinates;

  for (const sample of sampleAOIs) {
    const samplePoly = sample.feature;
    if (turf.booleanIntersects(aoi, samplePoly)) {
      return sample.id;
    }
  }

  if (lng > 85 && lng < 95 && lat > 20 && lat < 25) return 'bangladesh-delta';
  if (lng > -125 && lng < -115 && lat > 35 && lat < 42) return 'california-wildfire';
  if (lng > 35 && lng < 42 && lat > -5 && lat < 5) return 'kenya-arid';

  return null;
}

function getFloodDataForRegion(regionId: string | null): FeatureCollection<Polygon> {
  switch (regionId) {
    case 'bangladesh-delta': return sampleFloodExtent;
    case 'california-wildfire': return californiaFloodExtent;
    case 'kenya-arid': return kenyaFloodExtent;
    default: return { type: 'FeatureCollection', features: [] };
  }
}

function getFireDataForRegion(regionId: string | null): FeatureCollection<Point> {
  switch (regionId) {
    case 'california-wildfire': return californiaFirePoints;
    case 'bangladesh-delta': return bangladeshFirePoints;
    case 'kenya-arid': return kenyaFirePoints;
    default: return { type: 'FeatureCollection', features: [] };
  }
}

function getDroughtDataForRegion(regionId: string | null): FeatureCollection<Polygon> {
  switch (regionId) {
    case 'kenya-arid': return kenyaDroughtGrid;
    case 'bangladesh-delta': return bangladeshDroughtGrid;
    case 'california-wildfire': return californiaDroughtGrid;
    default: return { type: 'FeatureCollection', features: [] };
  }
}

function analyzeFlood(
  aoi: Feature<Polygon>,
  floodData: FeatureCollection<Polygon>,
  dataSource?: string
): { summary: FloodSummary; clippedFlood: FeatureCollection<Polygon> } {
  const aoiAreaKm2 = turf.area(aoi) / 1_000_000;
  let totalFloodedArea = 0;
  const clippedFeatures: Feature<Polygon>[] = [];

  for (const floodFeature of floodData.features) {
    try {
      if (turf.booleanIntersects(aoi, floodFeature)) {
        const intersection = turf.intersect(
          turf.featureCollection([aoi, floodFeature])
        );
        if (intersection && intersection.geometry.type === 'Polygon') {
          const intersectionArea = turf.area(intersection) / 1_000_000;
          totalFloodedArea += intersectionArea;
          clippedFeatures.push(intersection as Feature<Polygon>);
        }
      }
    } catch (e) {
      // Skip invalid geometries
    }
  }

  const percentOfAOI = aoiAreaKm2 > 0 ? (totalFloodedArea / aoiAreaKm2) * 100 : 0;
  const severity = getFloodSeverity(totalFloodedArea);

  let note = '';
  if (severity === 'none') note = 'No significant flooding detected in the area.';
  else if (severity === 'low') note = 'Limited inundation observed near water bodies.';
  else if (severity === 'moderate') note = 'Moderate flooding affecting low-lying areas.';
  else note = 'Significant flooding with widespread inundation.';
  
  if (dataSource) note += ` (Source: ${dataSource})`;

  return {
    summary: {
      severity,
      floodedAreaKm2: Math.round(totalFloodedArea * 100) / 100,
      floodedAreaPercentOfAOI: Math.round(percentOfAOI * 100) / 100,
      note
    },
    clippedFlood: { type: 'FeatureCollection', features: clippedFeatures }
  };
}

function analyzeFire(
  aoi: Feature<Polygon>,
  fireData: FeatureCollection<Point>,
  dataSource?: string
): { summary: FireSummary; filteredFire: FeatureCollection<Point> } {
  const filteredFeatures: Feature<Point>[] = [];

  for (const firePoint of fireData.features) {
    if (turf.booleanPointInPolygon(firePoint, aoi)) {
      filteredFeatures.push(firePoint);
    }
  }

  const hotspotsCount = filteredFeatures.length;
  const severity = getFireSeverity(hotspotsCount);

  let note = '';
  if (severity === 'none') note = 'No active fire hotspots detected.';
  else if (severity === 'low') note = 'Minor fire activity detected.';
  else if (severity === 'moderate') note = 'Elevated fire activity with multiple hotspots.';
  else note = 'High fire activity requiring immediate attention.';
  
  if (dataSource) note += ` (Source: ${dataSource})`;

  return {
    summary: {
      severity,
      hotspotsCount,
      clusters: Math.ceil(hotspotsCount / 3),
      note
    },
    filteredFire: { type: 'FeatureCollection', features: filteredFeatures }
  };
}

function analyzeDrought(
  aoi: Feature<Polygon>,
  droughtData: FeatureCollection<Polygon>,
  dataSource?: string
): { summary: DroughtSummary; clippedDrought: FeatureCollection<Polygon> } {
  const clippedFeatures: Feature<Polygon>[] = [];
  let totalNdvi = 0;
  let totalRainfall = 0;
  let count = 0;

  for (const droughtCell of droughtData.features) {
    try {
      if (turf.booleanIntersects(aoi, droughtCell)) {
        const props = droughtCell.properties || {};
        totalNdvi += props.ndvi_anomaly || 0;
        totalRainfall += props.rainfall_anomaly_mm || 0;
        count++;

        const intersection = turf.intersect(
          turf.featureCollection([aoi, droughtCell])
        );
        if (intersection && intersection.geometry.type === 'Polygon') {
          clippedFeatures.push({
            ...intersection as Feature<Polygon>,
            properties: droughtCell.properties
          });
        }
      }
    } catch (e) {
      // Skip invalid geometries
    }
  }

  const avgNdvi = count > 0 ? totalNdvi / count : 0;
  const avgRainfall = count > 0 ? totalRainfall / count : 0;
  const severity = getDroughtSeverity(avgNdvi, avgRainfall);

  let note = '';
  if (severity === 'none') note = 'Normal vegetation and rainfall conditions.';
  else if (severity === 'watch') note = 'Early signs of water stress observed.';
  else if (severity === 'emerging') note = 'Drought conditions developing with notable vegetation stress.';
  else note = 'Severe drought with significant vegetation decline.';
  
  if (dataSource) note += ` (Source: ${dataSource})`;

  return {
    summary: {
      severity,
      ndviAnomaly: Math.round(avgNdvi * 100) / 100,
      rainfallAnomalyMm: Math.round(avgRainfall * 10) / 10,
      note
    },
    clippedDrought: { type: 'FeatureCollection', features: clippedFeatures }
  };
}

export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const { aoi, mode, historyConfig, hazards, aoiName, customPeriod } = request;

  const regionId = findMatchingRegion(aoi);
  
  // Generate historical time-series data
  const history = generateHistoryData(historyConfig, hazards, regionId);
  
  // Get the default time range (latest period)
  const timeRange = customPeriod || getDefaultTimeRangeFromHistory(history);
  
  // Default to sample data for demo and as fallback
  let floodData: FeatureCollection<Polygon> = getFloodDataForRegion(regionId);
  let fireData: FeatureCollection<Point> = getFireDataForRegion(regionId);
  let droughtData: FeatureCollection<Polygon> = getDroughtDataForRegion(regionId);
  let floodSource = 'Sample Data';
  let fireSource = 'Sample Data';
  let droughtSource = 'Sample Data';
  let units = DEFAULT_UNITS;

  let floodSummary: FloodSummary = {
    severity: 'unknown',
    floodedAreaKm2: null,
    floodedAreaPercentOfAOI: null
  };
  let fireSummary: FireSummary = {
    severity: 'unknown',
    hotspotsCount: null
  };
  let droughtSummary: DroughtSummary = {
    severity: 'unknown',
    ndviAnomaly: null,
    rainfallAnomalyMm: null
  };

  let clippedFlood: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: [] };
  let filteredFire: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
  let clippedDrought: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: [] };

  if (mode === 'live') {
    console.log('Running in LIVE mode - calling backend API...');
    const apiResult = await fetchHazardFeaturesFromApi(aoi, timeRange.start, timeRange.end);

    if (apiResult.success && apiResult.data?.features) {
      const { features } = apiResult.data;
      units = apiResult.data.units || DEFAULT_UNITS;

      if (hazards.fire) {
        const count = features.fire?.fires_count ?? 0;
        fireSummary = {
          severity: getFireSeverity(count),
          hotspotsCount: count,
          clusters: Math.ceil(count / 3),
          note: features.fire?.fires_mean_frp
            ? `Mean FRP: ${Math.round(features.fire.fires_mean_frp)} MW`
            : 'Fire activity from FIRMS'
        };
        fireSource = 'Backend API (FIRMS)';
      }

      if (hazards.drought) {
        const precipMean = features.drought?.chirps_precip_mean ?? 0;
        const precipSum = features.drought?.chirps_precip_sum ?? 0;
        let severity: DroughtSeverity = 'none';
        if (precipMean < 1) severity = 'severe';
        else if (precipMean < 2.5) severity = 'emerging';
        else if (precipMean < 5) severity = 'watch';
        droughtSummary = {
          severity,
          ndviAnomaly: null,
          rainfallAnomalyMm: Math.round(precipSum * 10) / 10,
          note: `Total rainfall over period: ${Math.round(precipSum * 10) / 10} mm`
        };
        droughtSource = 'Backend API (CHIRPS)';
      }

      if (hazards.flood) {
        // API does not provide flood geometry; use precipitation as a proxy.
        const precipSum = features.climate?.precip_sum ?? 0;
        let severity: HazardSeverity = 'none';
        if (precipSum > 200) severity = 'high';
        else if (precipSum > 100) severity = 'moderate';
        else if (precipSum > 50) severity = 'low';
        floodSummary = {
          severity,
          floodedAreaKm2: null,
          floodedAreaPercentOfAOI: null,
          note: 'Flood extent unavailable; severity estimated from precipitation'
        };
        floodSource = 'Backend API (precip proxy)';
      }
    } else {
      console.warn('Backend API failed, falling back to sample data:', apiResult.error);
    }
  }

  // If we remained on sample data (demo or fallback), compute layers/summaries
  if (mode === 'demo' || (mode === 'live' && fireSummary.severity === 'unknown' && droughtSummary.severity === 'unknown')) {
    const floodAnalysis = hazards.flood ? analyzeFlood(aoi, floodData, floodSource) : null;
    const fireAnalysis = hazards.fire ? analyzeFire(aoi, fireData, fireSource) : null;
    const droughtAnalysis = hazards.drought ? analyzeDrought(aoi, droughtData, droughtSource) : null;

    floodSummary = floodAnalysis ? floodAnalysis.summary : floodSummary;
    fireSummary = fireAnalysis ? fireAnalysis.summary : fireSummary;
    droughtSummary = droughtAnalysis ? droughtAnalysis.summary : droughtSummary;

    clippedFlood = floodAnalysis ? floodAnalysis.clippedFlood : clippedFlood;
    filteredFire = fireAnalysis ? fireAnalysis.filteredFire : filteredFire;
    clippedDrought = droughtAnalysis ? droughtAnalysis.clippedDrought : clippedDrought;
  }

  return {
    analysisId: generateId(),
    summary: {
      flood: floodSummary,
      fire: fireSummary,
      drought: droughtSummary
    },
    geojsonLayers: {
      aoi,
      floodExtent: clippedFlood,
      firePoints: filteredFire,
      droughtGrid: clippedDrought
    },
    generatedAt: new Date().toISOString(),
    mode,
    timeRange,
    aoiName: aoiName || 'Custom Area',
    history,
    units
  };
}
