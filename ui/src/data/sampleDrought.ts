import type { FeatureCollection, Polygon } from 'geojson';

// Sample drought grid for Kenya (NDVI + rainfall anomalies)
export const kenyaDroughtGrid: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        gridId: 'g1',
        ndvi_anomaly: -0.18,
        rainfall_anomaly_mm: -52,
        severity: 'severe'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [37.0, -1.5],
          [37.5, -1.5],
          [37.5, -0.75],
          [37.0, -0.75],
          [37.0, -1.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g2',
        ndvi_anomaly: -0.22,
        rainfall_anomaly_mm: -68,
        severity: 'severe'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [37.5, -1.5],
          [38.0, -1.5],
          [38.0, -0.75],
          [37.5, -0.75],
          [37.5, -1.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g3',
        ndvi_anomaly: -0.15,
        rainfall_anomaly_mm: -38,
        severity: 'emerging'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [38.0, -1.5],
          [38.5, -1.5],
          [38.5, -0.75],
          [38.0, -0.75],
          [38.0, -1.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g4',
        ndvi_anomaly: -0.12,
        rainfall_anomaly_mm: -42,
        severity: 'emerging'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [37.0, -0.75],
          [37.5, -0.75],
          [37.5, 0.0],
          [37.0, 0.0],
          [37.0, -0.75]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g5',
        ndvi_anomaly: -0.08,
        rainfall_anomaly_mm: -28,
        severity: 'watch'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [37.5, -0.75],
          [38.0, -0.75],
          [38.0, 0.0],
          [37.5, 0.0],
          [37.5, -0.75]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g6',
        ndvi_anomaly: -0.06,
        rainfall_anomaly_mm: -18,
        severity: 'watch'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [38.0, -0.75],
          [38.5, -0.75],
          [38.5, 0.0],
          [38.0, 0.0],
          [38.0, -0.75]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g7',
        ndvi_anomaly: -0.04,
        rainfall_anomaly_mm: -12,
        severity: 'none'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [37.0, 0.0],
          [37.5, 0.0],
          [37.5, 0.5],
          [37.0, 0.5],
          [37.0, 0.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g8',
        ndvi_anomaly: -0.03,
        rainfall_anomaly_mm: -8,
        severity: 'none'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [37.5, 0.0],
          [38.0, 0.0],
          [38.0, 0.5],
          [37.5, 0.5],
          [37.5, 0.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'g9',
        ndvi_anomaly: -0.02,
        rainfall_anomaly_mm: -5,
        severity: 'none'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [38.0, 0.0],
          [38.5, 0.0],
          [38.5, 0.5],
          [38.0, 0.5],
          [38.0, 0.0]
        ]]
      }
    }
  ]
};

// Bangladesh drought grid (minimal - flood region)
export const bangladeshDroughtGrid: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        gridId: 'bd-g1',
        ndvi_anomaly: 0.02,
        rainfall_anomaly_mm: 15,
        severity: 'none'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [89.5, 22.0],
          [90.5, 22.0],
          [90.5, 23.0],
          [89.5, 23.0],
          [89.5, 22.0]
        ]]
      }
    }
  ]
};

// California drought grid (moderate)
export const californiaDroughtGrid: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        gridId: 'ca-g1',
        ndvi_anomaly: -0.09,
        rainfall_anomaly_mm: -22,
        severity: 'watch'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 38.0],
          [-122.0, 38.0],
          [-122.0, 38.5],
          [-122.5, 38.5],
          [-122.5, 38.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'ca-g2',
        ndvi_anomaly: -0.12,
        rainfall_anomaly_mm: -35,
        severity: 'emerging'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.0, 38.0],
          [-121.5, 38.0],
          [-121.5, 38.5],
          [-122.0, 38.5],
          [-122.0, 38.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'ca-g3',
        ndvi_anomaly: -0.07,
        rainfall_anomaly_mm: -18,
        severity: 'watch'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 38.5],
          [-122.0, 38.5],
          [-122.0, 39.0],
          [-122.5, 39.0],
          [-122.5, 38.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        gridId: 'ca-g4',
        ndvi_anomaly: -0.05,
        rainfall_anomaly_mm: -12,
        severity: 'none'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.0, 38.5],
          [-121.5, 38.5],
          [-121.5, 39.0],
          [-122.0, 39.0],
          [-122.0, 38.5]
        ]]
      }
    }
  ]
};
