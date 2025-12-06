import type { SampleAOI } from '@/lib/types';
import type { Feature, Polygon } from 'geojson';

// Sample AOI: A region in Bangladesh (flood-prone area)
const bangladeshDelta: Feature<Polygon> = {
  type: 'Feature',
  properties: {
    name: 'Bangladesh Coastal Delta',
    description: 'Flood-prone coastal region'
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
};

// Sample AOI: California region (fire-prone area)
const californiaWildfire: Feature<Polygon> = {
  type: 'Feature',
  properties: {
    name: 'Northern California',
    description: 'Wildfire-prone forest region'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-122.5, 38.0],
      [-121.5, 38.0],
      [-121.5, 39.0],
      [-122.5, 39.0],
      [-122.5, 38.0]
    ]]
  }
};

// Sample AOI: East Africa (drought-prone area)
const kenyaDrought: Feature<Polygon> = {
  type: 'Feature',
  properties: {
    name: 'Kenya Arid Lands',
    description: 'Drought-prone arid region'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [37.0, -1.5],
      [38.5, -1.5],
      [38.5, 0.5],
      [37.0, 0.5],
      [37.0, -1.5]
    ]]
  }
};

export const sampleAOIs: SampleAOI[] = [
  {
    id: 'bangladesh-delta',
    name: 'Bangladesh Coastal Delta',
    description: 'Flood-prone coastal region in South Asia',
    feature: bangladeshDelta,
    center: [90.0, 22.5],
    zoom: 8
  },
  {
    id: 'california-wildfire',
    name: 'Northern California',
    description: 'Wildfire-prone forest region in Western US',
    feature: californiaWildfire,
    center: [-122.0, 38.5],
    zoom: 8
  },
  {
    id: 'kenya-arid',
    name: 'Kenya Arid Lands',
    description: 'Drought-prone arid region in East Africa',
    feature: kenyaDrought,
    center: [37.75, -0.5],
    zoom: 7
  }
];

export const getDefaultSampleAOI = (): SampleAOI => sampleAOIs[0];
