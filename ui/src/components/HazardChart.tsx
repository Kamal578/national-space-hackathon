import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { AnalysisSummary } from '@/lib/types';

interface HazardChartProps {
  summary: AnalysisSummary;
}

const severityToScore: Record<string, number> = {
  none: 0,
  low: 1,
  watch: 1,
  moderate: 2,
  emerging: 2,
  high: 3,
  severe: 3,
  unknown: 0
};

const colors = {
  flood: 'hsl(210, 90%, 55%)',
  fire: 'hsl(20, 90%, 50%)',
  drought: 'hsl(45, 90%, 50%)'
};

export function HazardChart({ summary }: HazardChartProps) {
  const data = [
    {
      name: 'Flood',
      score: severityToScore[summary.flood.severity] || 0,
      severity: summary.flood.severity,
      color: colors.flood
    },
    {
      name: 'Fire',
      score: severityToScore[summary.fire.severity] || 0,
      severity: summary.fire.severity,
      color: colors.fire
    },
    {
      name: 'Drought',
      score: severityToScore[summary.drought.severity] || 0,
      severity: summary.drought.severity,
      color: colors.drought
    }
  ];

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Hazard Severity Index
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis 
              type="number" 
              domain={[0, 3]} 
              ticks={[0, 1, 2, 3]}
              tickFormatter={(v) => ['None', 'Low', 'Mod', 'High'][v] || ''}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                      <p className="text-sm font-medium">{data.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Severity: {data.severity}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
