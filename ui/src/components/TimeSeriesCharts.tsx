import { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Flame, CloudSun } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { HistoryData, TimeRange, HazardSelection, AggregationType } from '@/lib/types';

interface TimeSeriesChartsProps {
  history: HistoryData;
  hazards: HazardSelection;
  selectedPeriod: TimeRange;
  onPeriodSelect: (period: TimeRange) => void;
}

function formatPeriodLabel(dateStr: string, aggregation: AggregationType): string {
  const date = parseISO(dateStr);
  return aggregation === 'monthly' 
    ? format(date, 'MMM yyyy')
    : format(date, 'yyyy');
}

function formatSelectedPeriod(start: string, end: string): string {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`;
}

export function TimeSeriesCharts({
  history,
  hazards,
  selectedPeriod,
  onPeriodSelect
}: TimeSeriesChartsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // Build combined chart data
  const floodSeries = history.flood?.series || [];
  const fireSeries = history.fire?.series || [];
  const droughtSeries = history.drought?.series || [];
  
  const maxLength = Math.max(floodSeries.length, fireSeries.length, droughtSeries.length);
  const baseSeries = floodSeries.length === maxLength ? floodSeries 
    : fireSeries.length === maxLength ? fireSeries 
    : droughtSeries;

  const aggregation = history.flood?.aggregation || history.fire?.aggregation || history.drought?.aggregation || 'monthly';

  const chartData = useMemo(() => baseSeries.map((item, index) => ({
    index,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    label: formatPeriodLabel(item.periodStart, aggregation),
    flood: floodSeries[index]?.floodedAreaKm2 ?? null,
    fire: fireSeries[index]?.hotspotsCount ?? null,
    drought: droughtSeries[index]?.ndviAnomaly ? Math.abs(droughtSeries[index].ndviAnomaly!) * 100 : null
  })), [baseSeries, floodSeries, fireSeries, droughtSeries, aggregation]);

  // Find selected index range
  const selectedRange = useMemo(() => {
    const startIdx = chartData.findIndex(d => d.periodStart === selectedPeriod.start);
    const endIdx = chartData.findIndex(d => d.periodEnd === selectedPeriod.end);
    return { start: startIdx >= 0 ? startIdx : 0, end: endIdx >= 0 ? endIdx : chartData.length - 1 };
  }, [chartData, selectedPeriod]);

  const handleMouseDown = useCallback((data: any) => {
    if (data && data.activeTooltipIndex !== undefined) {
      setIsDragging(true);
      setDragStart(data.activeTooltipIndex);
      setDragEnd(data.activeTooltipIndex);
    }
  }, []);

  const handleMouseMove = useCallback((data: any) => {
    if (isDragging && data && data.activeTooltipIndex !== undefined) {
      setDragEnd(data.activeTooltipIndex);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      
      if (chartData[start] && chartData[end]) {
        onPeriodSelect({
          start: chartData[start].periodStart,
          end: chartData[end].periodEnd
        });
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, chartData, onPeriodSelect]);

  const handleClick = useCallback((data: any) => {
    if (data && data.activeTooltipIndex !== undefined) {
      const idx = data.activeTooltipIndex;
      if (chartData[idx]) {
        onPeriodSelect({
          start: chartData[idx].periodStart,
          end: chartData[idx].periodEnd
        });
      }
    }
  }, [chartData, onPeriodSelect]);

  if (chartData.length === 0) {
    return null;
  }

  // Common chart props for drag selection
  const chartInteractionProps = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onClick: handleClick
  };

  // Reference area for selection highlight
  const selectionStart = isDragging && dragStart !== null && dragEnd !== null 
    ? Math.min(dragStart, dragEnd) 
    : selectedRange.start;
  const selectionEnd = isDragging && dragStart !== null && dragEnd !== null 
    ? Math.max(dragStart, dragEnd) 
    : selectedRange.end;

  const selectedStartLabel = chartData[selectionStart]?.label;
  const selectedEndLabel = chartData[selectionEnd]?.label;

  return (
    <div className="space-y-4">
      {/* Selected Period Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Historical Timeline</h3>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          Selected: {formatSelectedPeriod(selectedPeriod.start, selectedPeriod.end)}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Click on a point or drag across the chart to select a time period. The map and metrics will update accordingly.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flood Chart */}
        {hazards.flood && history.flood && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplets className="w-4 h-4 text-flood" />
                Flood (km²)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} {...chartInteractionProps}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    {selectedStartLabel && selectedEndLabel && (
                      <ReferenceArea
                        x1={selectedStartLabel}
                        x2={selectedEndLabel}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.15}
                      />
                    )}
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number | null) => [value?.toFixed(2) ?? 'N/A', 'Flooded Area']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="flood" 
                      stroke="hsl(var(--flood))"
                      strokeWidth={2}
                      dot={{ r: 4, cursor: 'pointer', fill: 'hsl(var(--flood))' }}
                      activeDot={{ r: 6, cursor: 'pointer' }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fire Chart */}
        {hazards.fire && history.fire && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="w-4 h-4 text-fire" />
                Fire Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} {...chartInteractionProps}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    {selectedStartLabel && selectedEndLabel && (
                      <ReferenceArea
                        x1={selectedStartLabel}
                        x2={selectedEndLabel}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.15}
                      />
                    )}
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number | null) => [value ?? 'N/A', 'Hotspots']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fire" 
                      stroke="hsl(var(--fire))"
                      strokeWidth={2}
                      dot={{ r: 4, cursor: 'pointer', fill: 'hsl(var(--fire))' }}
                      activeDot={{ r: 6, cursor: 'pointer' }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drought Chart */}
        {hazards.drought && history.drought && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-drought" />
                Drought Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} {...chartInteractionProps}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    {selectedStartLabel && selectedEndLabel && (
                      <ReferenceArea
                        x1={selectedStartLabel}
                        x2={selectedEndLabel}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.15}
                      />
                    )}
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number | null) => [value?.toFixed(1) ?? 'N/A', 'NDVI Stress %']}
                    />
                    <ReferenceLine y={10} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="drought" 
                      stroke="hsl(var(--drought))"
                      strokeWidth={2}
                      dot={{ r: 4, cursor: 'pointer', fill: 'hsl(var(--drought))' }}
                      activeDot={{ r: 6, cursor: 'pointer' }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
