import type { FeatureCollection, Polygon } from 'geojson';

// Sample flood extent data for Bangladesh Coastal Delta
export const sampleFloodExtent: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'flood-1',
        severity: 'moderate',
        detectedDate: '2024-01-15',
        source: 'Sentinel-1 SAR'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [89.7, 22.2],
          [89.9, 22.2],
          [89.95, 22.35],
          [89.8, 22.45],
          [89.65, 22.35],
          [89.7, 22.2]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'flood-2',
        severity: 'high',
        detectedDate: '2024-01-15',
        source: 'Sentinel-1 SAR'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [90.1, 22.5],
          [90.3, 22.45],
          [90.35, 22.65],
          [90.2, 22.75],
          [90.05, 22.6],
          [90.1, 22.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'flood-3',
        severity: 'low',
        detectedDate: '2024-01-14',
        source: 'Sentinel-1 SAR'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [90.2, 22.8],
          [90.35, 22.82],
          [90.38, 22.92],
          [90.25, 22.95],
          [90.18, 22.88],
          [90.2, 22.8]
        ]]
      }
    }
  ]
};

// California flood data (minimal for fire region)
export const californiaFloodExtent: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: []
};

// Kenya flood data (minimal for drought region)
export const kenyaFloodExtent: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: []
};
