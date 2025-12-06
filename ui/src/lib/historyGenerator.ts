import { addMonths, addYears, startOfMonth, startOfYear, endOfMonth, endOfYear, format, isBefore } from 'date-fns';
import type { 
  HistoryConfig, 
  HistoryData, 
  FloodHistoryPoint, 
  FireHistoryPoint, 
  DroughtHistoryPoint,
  HazardSelection,
  DroughtSeverity
} from './types';

function generatePeriods(config: HistoryConfig): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];
  const now = new Date();
  
  if (config.aggregation === 'monthly') {
    let current = startOfMonth(addMonths(now, -config.yearsBack * 12));
    const endDate = endOfMonth(now);
    
    while (isBefore(current, endDate)) {
      periods.push({
        start: current,
        end: endOfMonth(current)
      });
      current = addMonths(current, 1);
    }
  } else {
    let current = startOfYear(addYears(now, -config.yearsBack));
    const endDate = endOfYear(now);
    
    while (isBefore(current, endDate)) {
      periods.push({
        start: current,
        end: endOfYear(current)
      });
      current = addYears(current, 1);
    }
  }
  
  return periods;
}

function generateSeasonalVariation(month: number): number {
  // Creates a seasonal pattern peaking in summer months
  const seasonalFactor = Math.sin((month - 3) * Math.PI / 6);
  return 0.5 + 0.5 * seasonalFactor;
}

function generateRandomWithTrend(
  baseValue: number, 
  variance: number, 
  trendFactor: number,
  index: number,
  totalPeriods: number
): number {
  const trend = trendFactor * (index / totalPeriods);
  const random = (Math.random() - 0.5) * 2 * variance;
  return Math.max(0, baseValue * (1 + trend) + random);
}

export function generateFloodHistory(
  config: HistoryConfig,
  regionId: string | null
): { aggregation: typeof config.aggregation; series: FloodHistoryPoint[] } {
  const periods = generatePeriods(config);
  
  // Base values vary by region
  const baseFloodArea = regionId === 'bangladesh-delta' ? 15 
    : regionId === 'california-wildfire' ? 2 
    : regionId === 'kenya-arid' ? 0.5 
    : 1;
  
  const series: FloodHistoryPoint[] = periods.map((period, index) => {
    const month = period.start.getMonth();
    const seasonality = regionId === 'bangladesh-delta' 
      ? (month >= 5 && month <= 9 ? 2 : 0.3) // Monsoon season
      : generateSeasonalVariation(month);
    
    const floodedArea = generateRandomWithTrend(
      baseFloodArea * seasonality,
      baseFloodArea * 0.3,
      0.1,
      index,
      periods.length
    );
    
    return {
      periodStart: format(period.start, 'yyyy-MM-dd'),
      periodEnd: format(period.end, 'yyyy-MM-dd'),
      floodedAreaKm2: Math.round(floodedArea * 100) / 100,
      floodedAreaPercentOfAOI: Math.round((floodedArea / 100) * 1000) / 1000
    };
  });
  
  return { aggregation: config.aggregation, series };
}

export function generateFireHistory(
  config: HistoryConfig,
  regionId: string | null
): { aggregation: typeof config.aggregation; series: FireHistoryPoint[] } {
  const periods = generatePeriods(config);
  
  // Base values vary by region
  const baseHotspots = regionId === 'california-wildfire' ? 25 
    : regionId === 'kenya-arid' ? 8 
    : regionId === 'bangladesh-delta' ? 3 
    : 5;
  
  const series: FireHistoryPoint[] = periods.map((period, index) => {
    const month = period.start.getMonth();
    // Fire season peaks in dry/hot months
    const seasonality = regionId === 'california-wildfire' 
      ? (month >= 6 && month <= 10 ? 3 : 0.2) // CA fire season
      : regionId === 'kenya-arid'
      ? (month >= 0 && month <= 3 || month >= 10 ? 2 : 0.5) // Kenya dry season
      : generateSeasonalVariation(month);
    
    const hotspots = Math.round(generateRandomWithTrend(
      baseHotspots * seasonality,
      baseHotspots * 0.4,
      0.15,
      index,
      periods.length
    ));
    
    return {
      periodStart: format(period.start, 'yyyy-MM-dd'),
      periodEnd: format(period.end, 'yyyy-MM-dd'),
      hotspotsCount: hotspots
    };
  });
  
  return { aggregation: config.aggregation, series };
}

export function generateDroughtHistory(
  config: HistoryConfig,
  regionId: string | null
): { aggregation: typeof config.aggregation; series: DroughtHistoryPoint[] } {
  const periods = generatePeriods(config);
  
  // Base drought severity by region
  const baseDrought = regionId === 'kenya-arid' ? -0.25 
    : regionId === 'california-wildfire' ? -0.15 
    : regionId === 'bangladesh-delta' ? -0.05 
    : -0.1;
  
  const series: DroughtHistoryPoint[] = periods.map((period, index) => {
    const month = period.start.getMonth();
    // Drought stress peaks in dry season
    const seasonality = regionId === 'kenya-arid' 
      ? (month >= 0 && month <= 3 || month >= 10 ? 1.5 : 0.5)
      : regionId === 'california-wildfire'
      ? (month >= 6 && month <= 10 ? 1.8 : 0.4)
      : generateSeasonalVariation(month);
    
    const ndviAnomaly = generateRandomWithTrend(
      baseDrought * seasonality,
      0.1,
      -0.05, // Worsening trend
      index,
      periods.length
    );
    
    const rainfallAnomaly = ndviAnomaly * 200 + (Math.random() - 0.5) * 20;
    
    // Determine severity
    let severity: DroughtSeverity = 'none';
    if (ndviAnomaly < -0.3) severity = 'severe';
    else if (ndviAnomaly < -0.2) severity = 'emerging';
    else if (ndviAnomaly < -0.1) severity = 'watch';
    
    return {
      periodStart: format(period.start, 'yyyy-MM-dd'),
      periodEnd: format(period.end, 'yyyy-MM-dd'),
      ndviAnomaly: Math.round(ndviAnomaly * 100) / 100,
      rainfallAnomalyMm: Math.round(rainfallAnomaly * 10) / 10,
      droughtSeverity: severity
    };
  });
  
  return { aggregation: config.aggregation, series };
}

export function generateHistoryData(
  config: HistoryConfig,
  hazards: HazardSelection,
  regionId: string | null
): HistoryData {
  const history: HistoryData = {};
  
  if (hazards.flood) {
    history.flood = generateFloodHistory(config, regionId);
  }
  
  if (hazards.fire) {
    history.fire = generateFireHistory(config, regionId);
  }
  
  if (hazards.drought) {
    history.drought = generateDroughtHistory(config, regionId);
  }
  
  return history;
}

export function getDefaultTimeRangeFromHistory(history: HistoryData): { start: string; end: string } {
  // Get the latest period from any hazard series
  const floodSeries = history.flood?.series;
  const fireSeries = history.fire?.series;
  const droughtSeries = history.drought?.series;
  
  const series = floodSeries || fireSeries || droughtSeries;
  
  if (series && series.length > 0) {
    const latestPeriod = series[series.length - 1];
    return {
      start: latestPeriod.periodStart,
      end: latestPeriod.periodEnd
    };
  }
  
  // Fallback
  const now = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  return {
    start: format(monthAgo, 'yyyy-MM-dd'),
    end: format(now, 'yyyy-MM-dd')
  };
}
