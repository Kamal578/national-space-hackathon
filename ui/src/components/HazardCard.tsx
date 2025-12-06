import { Droplets, Flame, Sun, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HazardSeverity, DroughtSeverity } from '@/lib/types';

type HazardType = 'flood' | 'fire' | 'drought';

interface HazardCardProps {
  type: HazardType;
  severity: HazardSeverity | DroughtSeverity;
  metrics: { label: string; value: string | number | null; unit?: string; tooltip?: string }[];
  note?: string;
}

const hazardConfig = {
  flood: {
    icon: Droplets,
    title: 'Flood',
    bgClass: 'hazard-flood-light',
    iconBgClass: 'bg-flood',
    severityLabels: {
      none: 'No Risk',
      low: 'Low',
      moderate: 'Moderate',
      high: 'High',
      unknown: 'Unknown'
    }
  },
  fire: {
    icon: Flame,
    title: 'Fire',
    bgClass: 'hazard-fire-light',
    iconBgClass: 'bg-fire',
    severityLabels: {
      none: 'No Activity',
      low: 'Low',
      moderate: 'Moderate',
      high: 'High',
      unknown: 'Unknown'
    }
  },
  drought: {
    icon: Sun,
    title: 'Drought',
    bgClass: 'hazard-drought-light',
    iconBgClass: 'bg-drought',
    severityLabels: {
      none: 'Normal',
      watch: 'Watch',
      emerging: 'Emerging',
      severe: 'Severe',
      unknown: 'Unknown'
    }
  }
};

const severityColorMap: Record<string, string> = {
  none: 'bg-severity-none text-primary-foreground',
  low: 'bg-severity-low text-primary-foreground',
  moderate: 'bg-severity-moderate text-foreground',
  high: 'bg-severity-high text-primary-foreground',
  watch: 'bg-severity-watch text-foreground',
  emerging: 'bg-severity-emerging text-primary-foreground',
  severe: 'bg-severity-severe text-primary-foreground',
  unknown: 'bg-severity-unknown text-primary-foreground'
};

const severityInterpretation: Record<HazardType, Record<string, string>> = {
  flood: {
    none: 'No significant inundation expected.',
    low: 'Minor, localized ponding possible.',
    moderate: 'Noticeable flooding in low-lying areas.',
    high: 'Widespread flooding likely.',
    unknown: 'Insufficient flood data.'
  },
  fire: {
    none: 'No active fire hotspots detected.',
    low: 'Isolated hotspots; low spread risk.',
    moderate: 'Multiple hotspots; elevated spread risk.',
    high: 'High fire activity; rapid spread possible.',
    unknown: 'Insufficient fire data.'
  },
  drought: {
    none: 'Vegetation and rainfall near normal.',
    watch: 'Early signs of dryness; monitor.',
    emerging: 'Developing drought stress.',
    severe: 'Severe moisture stress and vegetation loss.',
    unknown: 'Insufficient drought data.'
  }
};

const climateTermHelp: Record<string, string> = {
  'NDVI Anomaly': 'NDVI is a greenness index; anomaly shows how far vegetation is from normal.',
  'Rainfall Deficit': 'How much less rain fell than typical over the selected period.',
  'Active Hotspots': 'Count of satellite-detected fire pixels (FIRMS).',
  'Area Flooded': 'Estimated flooded area within the AOI.',
  'Wind': 'Average 10m wind speed over the period.'
};

export function HazardCard({ type, severity, metrics, note }: HazardCardProps) {
  const config = hazardConfig[type];
  const Icon = config.icon;
  const severityLabel = config.severityLabels[severity as keyof typeof config.severityLabels] || 'Unknown';
  const severityCopy = severityInterpretation[type][severity as string] || 'No interpretation available.';

  return (
    <Card className={cn('rounded-2xl shadow-lg border-0 overflow-hidden', config.bgClass)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.iconBgClass)}>
              <Icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={cn('rounded-full px-3 py-1 text-xs font-medium', severityColorMap[severity])}>
                {severityLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              {severityCopy}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-card/60 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {metric.tooltip || climateTermHelp[metric.label] ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="underline decoration-dotted cursor-help">{metric.label}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {metric.tooltip || climateTermHelp[metric.label]}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span>{metric.label}</span>
                )}
              </div>
              <p className="text-lg font-semibold">
                {metric.value !== null ? (
                  <>
                    {metric.value} {metric.unit ? <span className="text-xs font-normal text-muted-foreground">{metric.unit}</span> : null}
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HelpCircle className="w-4 h-4" />
                    N/A
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
        {note && (
          <p className="text-sm text-muted-foreground italic">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}
