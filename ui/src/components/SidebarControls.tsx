import { MapPin, Layers } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sampleAOIs } from '@/data/sampleAOI';
import { HistoryControls } from '@/components/HistoryControls';
import type { SampleAOI, AnalysisMode, HazardSelection, HistoryConfig } from '@/lib/types';

interface SidebarControlsProps {
  isLoading: boolean;
  selectedAOI: SampleAOI | null;
  onSelectAOI: (aoi: SampleAOI) => void;
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  hazards: HazardSelection;
  onHazardsChange: (hazards: HazardSelection) => void;
  historyConfig: HistoryConfig;
  onHistoryConfigChange: (config: HistoryConfig) => void;
  showRunButton?: boolean;
}

export function SidebarControls({
  selectedAOI,
  onSelectAOI,
  mode,
  onModeChange,
  hazards,
  onHazardsChange,
  historyConfig,
  onHistoryConfigChange
}: SidebarControlsProps) {
  return (
    <aside className="w-80 bg-card border-r border-border overflow-y-auto p-4 space-y-4">
      {/* AOI Selection */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Area of Interest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={selectedAOI?.id || ''}
            onValueChange={(value) => {
              const aoi = sampleAOIs.find(a => a.id === value);
              if (aoi) onSelectAOI(aoi);
            }}
          >
            {sampleAOIs.map((aoi) => (
              <div key={aoi.id} className="flex items-start space-x-3">
                <RadioGroupItem value={aoi.id} id={aoi.id} className="mt-1" />
                <Label htmlFor={aoi.id} className="cursor-pointer">
                  <span className="font-medium text-sm">{aoi.name}</span>
                  <p className="text-xs text-muted-foreground">{aoi.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Historical Window - replaces Time Range */}
      <HistoryControls
        historyConfig={historyConfig}
        onHistoryConfigChange={onHistoryConfigChange}
      />

      {/* Hazard Selection */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Hazards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-flood" />
              <Label htmlFor="flood-toggle" className="text-sm">Flood</Label>
            </div>
            <Switch
              id="flood-toggle"
              checked={hazards.flood}
              onCheckedChange={(checked) => onHazardsChange({ ...hazards, flood: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-fire" />
              <Label htmlFor="fire-toggle" className="text-sm">Fire</Label>
            </div>
            <Switch
              id="fire-toggle"
              checked={hazards.fire}
              onCheckedChange={(checked) => onHazardsChange({ ...hazards, fire: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-drought" />
              <Label htmlFor="drought-toggle" className="text-sm">Drought</Label>
            </div>
            <Switch
              id="drought-toggle"
              checked={hazards.drought}
              onCheckedChange={(checked) => onHazardsChange({ ...hazards, drought: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Analysis Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as AnalysisMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="demo" id="demo" />
              <Label htmlFor="demo" className="cursor-pointer">
                <span className="text-sm">Demo Mode</span>
                <span className="text-xs text-muted-foreground block">Uses sample data (recommended)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <RadioGroupItem value="live" id="live" />
              <Label htmlFor="live" className="cursor-pointer">
                <span className="text-sm">Live Mode</span>
                <span className="text-xs text-muted-foreground block">Experimental, may fail</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </aside>
  );
}
