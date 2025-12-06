import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Bbox = [number, number, number, number];

interface CustomLocationSelectorProps {
  onSelect: (selection: {
    bbox: Bbox;
    center: [number, number];
    areaKm2: number;
  }) => void;
}

const formatDeg = (value: number) => `${value.toFixed(3)}°`;

export function CustomLocationSelector({ onSelect }: CustomLocationSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const startDragRef = useRef<L.LatLng | null>(null);
  const [draftBbox, setDraftBbox] = useState<Bbox | null>(null);
  const [confirmedBbox, setConfirmedBbox] = useState<Bbox | null>(null);
  const [areaKm2, setAreaKm2] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState({
    west: '',
    south: '',
    east: '',
    north: ''
  });

  const disableInteractions = (map: L.Map | null) => {
    if (!map) return;
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.touchZoom.disable();
  };

  const enableInteractions = (map: L.Map | null) => {
    if (!map) return;
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.touchZoom.enable();
  };

  const computeMeta = (bbox: Bbox) => {
    const poly = turf.bboxPolygon(bbox);
    const area = Math.round((turf.area(poly) / 1_000_000) * 100) / 100;
    const centroid = turf.centroid(poly).geometry.coordinates as [number, number];
    return { area, centroid };
  };

  const drawRectangle = (bbox: Bbox, map?: L.Map) => {
    const targetMap = map || mapInstance.current;
    if (!targetMap) return;
    if (rectangleRef.current) {
      rectangleRef.current.remove();
    }
    const [w, s, e, n] = bbox;
    const rectangle = L.rectangle(
      [
        [s, w],
        [n, e]
      ],
      { color: '#22c55e', weight: 2, fillColor: '#22c55e', fillOpacity: 0.2 }
    );
    rectangle.addTo(targetMap);
    rectangleRef.current = rectangle;
  };

  const applyBbox = (bbox: Bbox, map?: L.Map) => {
    setDraftBbox(bbox);
    setError(null);
    const { area } = computeMeta(bbox);
    setAreaKm2(area);
    setInputs({
      west: bbox[0].toString(),
      south: bbox[1].toString(),
      east: bbox[2].toString(),
      north: bbox[3].toString()
    });
    drawRectangle(bbox, map);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // reset map if re-render
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      boxZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('mousedown', (e) => {
      if (!isSelectingRef.current) return;
      startDragRef.current = e.latlng;
      map.dragging.disable();
    });

    map.on('mousemove', (e) => {
      if (!isSelectingRef.current || !startDragRef.current) return;
      const start = startDragRef.current;
      const west = Math.min(start.lng, e.latlng.lng);
      const east = Math.max(start.lng, e.latlng.lng);
      const south = Math.min(start.lat, e.latlng.lat);
      const north = Math.max(start.lat, e.latlng.lat);
      const bbox: Bbox = [west, south, east, north];
      drawRectangle(bbox, map);
    });

    map.on('mouseup', (e) => {
      if (!isSelectingRef.current || !startDragRef.current) return;
      const start = startDragRef.current;
      const west = Math.min(start.lng, e.latlng.lng);
      const east = Math.max(start.lng, e.latlng.lng);
      const south = Math.min(start.lat, e.latlng.lat);
      const north = Math.max(start.lat, e.latlng.lat);
      const bbox: Bbox = [west, south, east, north];
      applyBbox(bbox, map);
      setIsSelecting(false);
      isSelectingRef.current = false;
      startDragRef.current = null;
      // Keep interactions disabled after drawing; user can reset to regain pan/zoom
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const resetSelection = () => {
    setDraftBbox(null);
    setConfirmedBbox(null);
    setAreaKm2(null);
    setError(null);
    setInputs({ west: '', south: '', east: '', north: '' });
    startDragRef.current = null;
    isSelectingRef.current = false;
    setIsSelecting(false);
    if (rectangleRef.current) {
      rectangleRef.current.remove();
      rectangleRef.current = null;
    }
    enableInteractions(mapInstance.current);
  };

  const confirmArea = () => {
    if (!draftBbox) return;
    const { area, centroid } = computeMeta(draftBbox);
    setConfirmedBbox(draftBbox);
    disableInteractions(mapInstance.current);
    onSelect({
      bbox: draftBbox,
      center: [centroid[0], centroid[1]],
      areaKm2: area
    });
  };

  const handleInputChange = (key: keyof typeof inputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyInputs = () => {
    const vals = ['west', 'south', 'east', 'north'] as const;
    const parsed = vals.map((k) => Number(inputs[k]));
    if (parsed.some((v) => Number.isNaN(v))) {
      setError('Enter numeric coordinates.');
      return;
    }
    const [w, s, e, n] = parsed;
    if (w >= e || s >= n) {
      setError('Min lon/lat must be less than max lon/lat.');
      return;
    }
    const bbox: Bbox = [w, s, e, n];
    applyBbox(bbox);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              setIsSelecting(true);
              isSelectingRef.current = true;
              disableInteractions(mapInstance.current);
            }}
            variant={isSelecting ? 'secondary' : 'default'}
          >
            {isSelecting ? 'Selecting…' : 'Select Area'}
          </Button>
          <Button type="button" variant="outline" onClick={resetSelection}>
            Reset
          </Button>
          {draftBbox && (
            <Button type="button" variant="default" onClick={confirmArea}>
              Confirm Area
            </Button>
          )}
          {confirmedBbox && (
            <Badge variant="secondary">Area confirmed</Badge>
          )}
        </div>

        <div className="h-96 rounded-xl overflow-hidden border border-border relative">
          <div ref={mapRef} className="absolute inset-0" />
          <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-sm max-w-xs">
            {isSelecting
              ? 'Click and drag to draw a rectangle. Release to finish, then confirm.'
              : 'Pan/zoom freely. Click "Select Area" to draw a rectangle.'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label htmlFor="west">Min Lon (°)</Label>
          <Input
            id="west"
            type="number"
            value={inputs.west}
            onChange={(e) => handleInputChange('west', e.target.value)}
            onBlur={applyInputs}
            placeholder="-123.5"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="south">Min Lat (°)</Label>
          <Input
            id="south"
            type="number"
            value={inputs.south}
            onChange={(e) => handleInputChange('south', e.target.value)}
            onBlur={applyInputs}
            placeholder="34.2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="east">Max Lon (°)</Label>
          <Input
            id="east"
            type="number"
            value={inputs.east}
            onChange={(e) => handleInputChange('east', e.target.value)}
            onBlur={applyInputs}
            placeholder="-121.9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="north">Max Lat (°)</Label>
          <Input
            id="north"
            type="number"
            value={inputs.north}
            onChange={(e) => handleInputChange('north', e.target.value)}
            onBlur={applyInputs}
            placeholder="38.8"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={applyInputs}>
          Apply Coordinates
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between text-sm">
        <div className="space-y-1">
          <p className="font-medium">Draft Coordinates</p>
          {draftBbox ? (
            <>
              <p className="text-muted-foreground">W {formatDeg(draftBbox[0])}, S {formatDeg(draftBbox[1])}</p>
              <p className="text-muted-foreground">E {formatDeg(draftBbox[2])}, N {formatDeg(draftBbox[3])}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No draft area</p>
          )}
        </div>
        <div className="space-y-1 text-right">
          <p className="font-medium">Area</p>
          <div className="flex items-center justify-end gap-2">
            <Badge variant="secondary">
              {areaKm2 ? `${areaKm2.toLocaleString()} km²` : '—'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
