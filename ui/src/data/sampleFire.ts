import type { FeatureCollection, Point } from 'geojson';

// Sample fire hotspots for California (FIRMS-style data)
export const californiaFirePoints: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'fire-1',
        brightness: 325.5,
        confidence: 85,
        acq_date: '2024-01-15',
        acq_time: '1430',
        satellite: 'VIIRS',
        frp: 12.5
      },
      geometry: { type: 'Point', coordinates: [-122.1, 38.3] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-2',
        brightness: 318.2,
        confidence: 78,
        acq_date: '2024-01-15',
        acq_time: '1432',
        satellite: 'VIIRS',
        frp: 8.3
      },
      geometry: { type: 'Point', coordinates: [-122.15, 38.32] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-3',
        brightness: 342.8,
        confidence: 92,
        acq_date: '2024-01-14',
        acq_time: '0845',
        satellite: 'MODIS',
        frp: 22.1
      },
      geometry: { type: 'Point', coordinates: [-121.8, 38.55] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-4',
        brightness: 310.5,
        confidence: 72,
        acq_date: '2024-01-14',
        acq_time: '0847',
        satellite: 'MODIS',
        frp: 5.8
      },
      geometry: { type: 'Point', coordinates: [-121.85, 38.58] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-5',
        brightness: 355.2,
        confidence: 95,
        acq_date: '2024-01-13',
        acq_time: '1520',
        satellite: 'VIIRS',
        frp: 35.2
      },
      geometry: { type: 'Point', coordinates: [-122.3, 38.7] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-6',
        brightness: 328.9,
        confidence: 88,
        acq_date: '2024-01-13',
        acq_time: '1522',
        satellite: 'VIIRS',
        frp: 15.6
      },
      geometry: { type: 'Point', coordinates: [-122.28, 38.68] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-7',
        brightness: 312.4,
        confidence: 75,
        acq_date: '2024-01-12',
        acq_time: '0930',
        satellite: 'MODIS',
        frp: 7.2
      },
      geometry: { type: 'Point', coordinates: [-121.95, 38.42] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-8',
        brightness: 338.6,
        confidence: 89,
        acq_date: '2024-01-12',
        acq_time: '0932',
        satellite: 'MODIS',
        frp: 18.9
      },
      geometry: { type: 'Point', coordinates: [-121.92, 38.45] }
    }
  ]
};

// Bangladesh fire data (minimal)
export const bangladeshFirePoints: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'fire-bd-1',
        brightness: 305.2,
        confidence: 65,
        acq_date: '2024-01-15',
        acq_time: '1100',
        satellite: 'VIIRS',
        frp: 3.2
      },
      geometry: { type: 'Point', coordinates: [90.15, 22.65] }
    }
  ]
};

// Kenya fire data
export const kenyaFirePoints: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'fire-ke-1',
        brightness: 315.8,
        confidence: 78,
        acq_date: '2024-01-14',
        acq_time: '1330',
        satellite: 'VIIRS',
        frp: 8.5
      },
      geometry: { type: 'Point', coordinates: [37.5, -0.5] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'fire-ke-2',
        brightness: 308.3,
        confidence: 70,
        acq_date: '2024-01-14',
        acq_time: '1332',
        satellite: 'VIIRS',
        frp: 5.1
      },
      geometry: { type: 'Point', coordinates: [37.8, -0.2] }
    }
  ]
};
