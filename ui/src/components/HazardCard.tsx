import { Droplets, Flame, Sun, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { HazardSeverity, DroughtSeverity } from '@/lib/types';

type HazardType = 'flood' | 'fire' | 'drought';

interface HazardCardProps {
  type: HazardType;
  severity: HazardSeverity | DroughtSeverity;
  metrics: { label: string; value: string | number | null }[];
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

export function HazardCard({ type, severity, metrics, note }: HazardCardProps) {
  const config = hazardConfig[type];
  const Icon = config.icon;
  const severityLabel = config.severityLabels[severity as keyof typeof config.severityLabels] || 'Unknown';

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
          <Badge className={cn('rounded-full px-3 py-1 text-xs font-medium', severityColorMap[severity])}>
            {severityLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-card/60 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold">
                {metric.value !== null ? metric.value : (
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
