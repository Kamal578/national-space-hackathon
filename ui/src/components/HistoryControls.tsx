import { Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HistoryConfig, AggregationType } from '@/lib/types';

interface HistoryControlsProps {
  historyConfig: HistoryConfig;
  onHistoryConfigChange: (config: HistoryConfig) => void;
}

export function HistoryControls({
  historyConfig,
  onHistoryConfigChange
}: HistoryControlsProps) {
  const handleYearsChange = (value: string) => {
    const years = Math.max(1, Math.min(10, parseInt(value) || 3));
    const aggregation: AggregationType = years > 5 ? 'yearly' : historyConfig.aggregation;
    onHistoryConfigChange({ yearsBack: years, aggregation });
  };

  const handleAggregationChange = (value: AggregationType) => {
    onHistoryConfigChange({ ...historyConfig, aggregation: value });
  };

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Historical Window
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="years-back" className="text-xs">Years to Analyze</Label>
          <Input
            id="years-back"
            type="number"
            min={1}
            max={10}
            value={historyConfig.yearsBack}
            onChange={(e) => handleYearsChange(e.target.value)}
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Analyze hazards from the last {historyConfig.yearsBack} year{historyConfig.yearsBack > 1 ? 's' : ''} up to today
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="aggregation" className="text-xs">Temporal Resolution</Label>
          <Select
            value={historyConfig.aggregation}
            onValueChange={handleAggregationChange}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {historyConfig.aggregation === 'monthly' ? 'Show data per month' : 'Show data per year'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
