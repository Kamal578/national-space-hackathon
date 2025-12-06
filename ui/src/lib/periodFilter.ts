import type { 
  HistoryData, 
  TimeRange, 
  AnalysisSummary, 
  FloodSummary,
  FireSummary,
  DroughtSummary,
  HazardSeverity,
  DroughtSeverity
} from './types';

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

export function getSummaryForPeriod(
  history: HistoryData,
  selectedPeriod: TimeRange
): AnalysisSummary {
  // Find the data point(s) that overlap with the selected period
  const floodPoints = history.flood?.series.filter(
    p => p.periodStart >= selectedPeriod.start && p.periodEnd <= selectedPeriod.end
  ) || [];
  
  const firePoints = history.fire?.series.filter(
    p => p.periodStart >= selectedPeriod.start && p.periodEnd <= selectedPeriod.end
  ) || [];
  
  const droughtPoints = history.drought?.series.filter(
    p => p.periodStart >= selectedPeriod.start && p.periodEnd <= selectedPeriod.end
  ) || [];

  // If no exact match, find closest or overlapping
  const getClosestOrOverlapping = <T extends { periodStart: string; periodEnd: string }>(
    series: T[] | undefined,
    period: TimeRange
  ): T | undefined => {
    if (!series || series.length === 0) return undefined;
    
    // First try exact match
    const exact = series.find(
      p => p.periodStart === period.start || 
           (p.periodStart <= period.start && p.periodEnd >= period.start) ||
           (p.periodStart <= period.end && p.periodEnd >= period.end)
    );
    if (exact) return exact;
    
    // Find closest by start date
    return series.reduce((closest, current) => {
      const closestDiff = Math.abs(new Date(closest.periodStart).getTime() - new Date(period.start).getTime());
      const currentDiff = Math.abs(new Date(current.periodStart).getTime() - new Date(period.start).getTime());
      return currentDiff < closestDiff ? current : closest;
    });
  };

  // Aggregate or use closest point
  let floodSummary: FloodSummary;
  if (floodPoints.length > 0) {
    const avgArea = floodPoints.reduce((sum, p) => sum + (p.floodedAreaKm2 || 0), 0) / floodPoints.length;
    const avgPercent = floodPoints.reduce((sum, p) => sum + (p.floodedAreaPercentOfAOI || 0), 0) / floodPoints.length;
    floodSummary = {
      severity: getFloodSeverity(avgArea),
      floodedAreaKm2: Math.round(avgArea * 100) / 100,
      floodedAreaPercentOfAOI: Math.round(avgPercent * 1000) / 1000,
      note: `Flood data for selected period`
    };
  } else {
    const closest = getClosestOrOverlapping(history.flood?.series, selectedPeriod);
    floodSummary = closest ? {
      severity: getFloodSeverity(closest.floodedAreaKm2 || 0),
      floodedAreaKm2: closest.floodedAreaKm2,
      floodedAreaPercentOfAOI: closest.floodedAreaPercentOfAOI,
      note: `Flood data from ${closest.periodStart}`
    } : {
      severity: 'unknown',
      floodedAreaKm2: null,
      floodedAreaPercentOfAOI: null
    };
  }

  let fireSummary: FireSummary;
  if (firePoints.length > 0) {
    const totalHotspots = firePoints.reduce((sum, p) => sum + (p.hotspotsCount || 0), 0);
    fireSummary = {
      severity: getFireSeverity(totalHotspots),
      hotspotsCount: totalHotspots,
      clusters: Math.ceil(totalHotspots / 3),
      note: `Fire data for selected period`
    };
  } else {
    const closest = getClosestOrOverlapping(history.fire?.series, selectedPeriod);
    fireSummary = closest ? {
      severity: getFireSeverity(closest.hotspotsCount || 0),
      hotspotsCount: closest.hotspotsCount,
      clusters: Math.ceil((closest.hotspotsCount || 0) / 3),
      note: `Fire data from ${closest.periodStart}`
    } : {
      severity: 'unknown',
      hotspotsCount: null
    };
  }

  let droughtSummary: DroughtSummary;
  if (droughtPoints.length > 0) {
    const avgNdvi = droughtPoints.reduce((sum, p) => sum + (p.ndviAnomaly || 0), 0) / droughtPoints.length;
    const avgRainfall = droughtPoints.reduce((sum, p) => sum + (p.rainfallAnomalyMm || 0), 0) / droughtPoints.length;
    const severities = droughtPoints.map(p => p.droughtSeverity);
    const mostSevere = severities.includes('severe') ? 'severe' 
      : severities.includes('emerging') ? 'emerging'
      : severities.includes('watch') ? 'watch' : 'none';
    droughtSummary = {
      severity: mostSevere,
      ndviAnomaly: Math.round(avgNdvi * 100) / 100,
      rainfallAnomalyMm: Math.round(avgRainfall * 10) / 10,
      note: `Drought data for selected period`
    };
  } else {
    const closest = getClosestOrOverlapping(history.drought?.series, selectedPeriod);
    droughtSummary = closest ? {
      severity: closest.droughtSeverity,
      ndviAnomaly: closest.ndviAnomaly,
      rainfallAnomalyMm: closest.rainfallAnomalyMm,
      note: `Drought data from ${closest.periodStart}`
    } : {
      severity: 'unknown',
      ndviAnomaly: null,
      rainfallAnomalyMm: null
    };
  }

  return {
    flood: floodSummary,
    fire: fireSummary,
    drought: droughtSummary
  };
}

// Get a scaling factor based on the period's values vs the overall max
export function getPeriodScaleFactor(
  history: HistoryData,
  selectedPeriod: TimeRange,
  hazardType: 'flood' | 'fire' | 'drought'
): number {
  const series = hazardType === 'flood' ? history.flood?.series
    : hazardType === 'fire' ? history.fire?.series
    : history.drought?.series;
  
  if (!series || series.length === 0) return 1;

  // Find the selected period's value
  const selected = series.find(
    p => p.periodStart <= selectedPeriod.start && p.periodEnd >= selectedPeriod.start
  ) || series.find(
    p => Math.abs(new Date(p.periodStart).getTime() - new Date(selectedPeriod.start).getTime()) < 
         32 * 24 * 60 * 60 * 1000 // Within 32 days
  );

  if (!selected) return 1;

  // Calculate max value in series
  let maxValue = 0;
  let selectedValue = 0;

  if (hazardType === 'flood') {
    const floodSeries = series as typeof history.flood.series;
    maxValue = Math.max(...floodSeries.map(p => p.floodedAreaKm2 || 0));
    selectedValue = (selected as typeof floodSeries[0]).floodedAreaKm2 || 0;
  } else if (hazardType === 'fire') {
    const fireSeries = series as typeof history.fire.series;
    maxValue = Math.max(...fireSeries.map(p => p.hotspotsCount || 0));
    selectedValue = (selected as typeof fireSeries[0]).hotspotsCount || 0;
  } else {
    const droughtSeries = series as typeof history.drought.series;
    maxValue = Math.max(...droughtSeries.map(p => Math.abs(p.ndviAnomaly || 0)));
    selectedValue = Math.abs((selected as typeof droughtSeries[0]).ndviAnomaly || 0);
  }

  if (maxValue === 0) return 1;
  return Math.max(0.1, selectedValue / maxValue);
}
