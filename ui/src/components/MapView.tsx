import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { AnalysisResult } from '@/lib/types';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  center: [number, number];
  zoom: number;
  result: AnalysisResult | null;
  showFlood: boolean;
  showFire: boolean;
  showDrought: boolean;
  scaleFactors?: {
    flood: number;
    fire: number;
    drought: number;
  };
  periodHotspotsCount?: number | null;
}

export function MapView({ 
  center, 
  zoom, 
  result, 
  showFlood, 
  showFire, 
  showDrought,
  scaleFactors = { flood: 1, fire: 1, drought: 1 },
  periodHotspotsCount
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    aoi?: L.GeoJSON;
    flood?: L.GeoJSON;
    fire?: L.GeoJSON;
    drought?: L.GeoJSON;
    hazards?: L.LayerGroup;
  }>({});

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clean up existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [center[1], center[0]],
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Force resize after mount to ensure tiles load
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center[1], center[0]], zoom);
      mapInstanceRef.current.invalidateSize();
    }
  }, [center, zoom]);

  // Update layers based on result and scale factors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    Object.values(layersRef.current).forEach(layer => {
      if (layer) map.removeLayer(layer);
    });
    layersRef.current = {};

    if (!result) return;

    // Add AOI layer
    const aoiLayer = L.geoJSON(result.geojsonLayers.aoi, {
      style: {
        color: '#3b82f6',
        weight: 3,
        fillColor: '#3b82f6',
        fillOpacity: 0.05,
        dashArray: '5, 5'
      }
    }).addTo(map);
    layersRef.current.aoi = aoiLayer;

    // Add drought layer (below other layers) - opacity based on scale
    if (showDrought && result.geojsonLayers.droughtGrid?.features.length) {
      const droughtScale = scaleFactors.drought;
      const droughtLayer = L.geoJSON(result.geojsonLayers.droughtGrid, {
        style: (feature) => {
          const severity = feature?.properties?.severity || 'none';
          const baseOpacities: Record<string, number> = {
            none: 0.2,
            watch: 0.3,
            emerging: 0.4,
            severe: 0.5
          };
          const colors: Record<string, string> = {
            none: 'rgb(74, 222, 128)',
            watch: 'rgb(250, 204, 21)',
            emerging: 'rgb(251, 146, 60)',
            severe: 'rgb(239, 68, 68)'
          };
          return {
            color: 'transparent',
            fillColor: colors[severity] || colors.none,
            fillOpacity: (baseOpacities[severity] || 0.2) * droughtScale,
            weight: 0
          };
        }
      }).addTo(map);
      layersRef.current.drought = droughtLayer;
    }

    // Add flood layer - opacity based on scale
    if (showFlood && result.geojsonLayers.floodExtent?.features.length) {
      const floodScale = scaleFactors.flood;
      const floodLayer = L.geoJSON(result.geojsonLayers.floodExtent, {
        style: {
          color: '#0ea5e9',
          weight: 2,
          fillColor: '#0ea5e9',
          fillOpacity: 0.2 + (0.4 * floodScale) // Range from 0.2 to 0.6
        }
      }).addTo(map);
      layersRef.current.flood = floodLayer;
    }

    // Add fire points - show exact count matching the timeline
    if (showFire && result.geojsonLayers.firePoints?.features.length) {
      const fireScale = scaleFactors.fire;
      const allFeatures = result.geojsonLayers.firePoints.features;
      
      // Use the actual period hotspots count if available
      const numToShow = periodHotspotsCount != null 
        ? Math.min(periodHotspotsCount, allFeatures.length)
        : Math.max(1, Math.ceil(allFeatures.length * fireScale));
      
      const featuresToShow = allFeatures.slice(0, numToShow);
      
      const filteredFireData = {
        type: 'FeatureCollection' as const,
        features: featuresToShow
      };
      
      const fireLayer = L.geoJSON(filteredFireData, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 4 + (6 * fireScale), // Range from 4 to 10
            fillColor: '#f97316',
            color: '#ea580c',
              weight: 2,
              opacity: 0.5 + (0.5 * fireScale),
              fillOpacity: 0.4 + (0.4 * fireScale)
            });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            layer.bindPopup(`
              <div class="text-sm">
                <strong>Fire Hotspot</strong><br/>
                Date: ${props.acq_date || 'N/A'}<br/>
                Confidence: ${props.confidence || 'N/A'}%<br/>
                FRP: ${props.frp || 'N/A'} MW
              </div>
            `);
          }
        }
      ).addTo(map);
      layersRef.current.fire = fireLayer;
    }

    // Add hazard markers at AOI centroid for quick visual identifiers
    const hazardMarkers = L.layerGroup();
    const center = aoiLayer.getBounds().getCenter();
    const icon = (emoji: string, bg: string) =>
      L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${bg};color:#fff;font-size:16px;">${emoji}</div>`,
        className: 'hazard-marker'
      });

    if (showFlood) {
      L.marker(center, { icon: icon('🌊', '#0ea5e9') })
        .bindTooltip('Flood indicator', { direction: 'top' })
        .addTo(hazardMarkers);
    }
    if (showFire) {
      L.marker([center.lat + 0.05, center.lng], { icon: icon('🔥', '#f97316') })
        .bindTooltip('Fire indicator', { direction: 'top' })
        .addTo(hazardMarkers);
    }
    if (showDrought) {
      L.marker([center.lat - 0.05, center.lng], { icon: icon('🌵', '#f59e0b') })
        .bindTooltip('Drought indicator', { direction: 'top' })
        .addTo(hazardMarkers);
    }
    hazardMarkers.addTo(map);
    layersRef.current.hazards = hazardMarkers;

    // Fit bounds to AOI
    map.fitBounds(aoiLayer.getBounds(), { padding: [20, 20] });

  }, [result, showFlood, showFire, showDrought, scaleFactors, periodHotspotsCount]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000]">
        <p className="text-xs font-medium mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary border border-dashed" />
            <span className="text-xs text-muted-foreground">AOI Boundary</span>
          </div>
          {showFlood && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm bg-flood/60" />
              <span className="text-xs text-muted-foreground">Flood Extent</span>
            </div>
          )}
          {showFlood && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: '#0ea5e9', color: '#fff' }}>🌊</div>
              <span className="text-xs text-muted-foreground">Flood marker</span>
            </div>
          )}
          {showFire && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-fire" />
              <span className="text-xs text-muted-foreground">Fire Hotspot</span>
            </div>
          )}
          {showFire && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: '#f97316', color: '#fff' }}>🔥</div>
              <span className="text-xs text-muted-foreground">Fire marker</span>
            </div>
          )}
          {showDrought && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm bg-drought/50" />
              <span className="text-xs text-muted-foreground">Drought Stress</span>
            </div>
          )}
          {showDrought && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: '#f59e0b', color: '#fff' }}>🌵</div>
              <span className="text-xs text-muted-foreground">Drought marker</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
