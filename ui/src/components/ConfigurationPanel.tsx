import { MapPin, Layers, Clock, Zap, Play, Loader2, Map } from "lucide-react";
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { sampleAOIs } from "@/data/sampleAOI";
import type {
  SampleAOI,
  AnalysisMode,
  HazardSelection,
  HistoryConfig,
} from "@/lib/types";
import { CustomLocationSelector } from "@/components/CustomLocationSelector";
import * as turf from "@turf/turf";

interface ConfigurationPanelProps {
  selectedAOI: SampleAOI | null;
  onSelectAOI: (aoi: SampleAOI) => void;
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  hazards: HazardSelection;
  onHazardsChange: (hazards: HazardSelection) => void;
  historyConfig: HistoryConfig;
  onHistoryConfigChange: (config: HistoryConfig) => void;
  startDate: string;
  endDate: string;
  onDateChange: (range: { start: string; end: string }) => void;
  dateError?: string | null;
  onRunAnalysis: () => void;
  isLoading: boolean;
}

export function ConfigurationPanel({
  selectedAOI,
  onSelectAOI,
  mode,
  onModeChange,
  hazards,
  onHazardsChange,
  historyConfig,
  onHistoryConfigChange,
  startDate,
  endDate,
  onDateChange,
  dateError,
  onRunAnalysis,
  isLoading,
}: ConfigurationPanelProps) {
  const handleCustomSelection = useCallback(
    (selection: {
      bbox: [number, number, number, number];
      center: [number, number];
      areaKm2: number;
    }) => {
      const poly = turf.bboxPolygon(selection.bbox);
      onSelectAOI({
        id: `custom-${Date.now()}`,
        name: "Custom Area",
        description: `User-defined area (${selection.areaKm2.toLocaleString()} km²)`,
        feature: poly as any,
        center: selection.center,
        zoom: 8,
        bbox: selection.bbox,
        areaKm2: selection.areaKm2,
        isCustom: true,
      });
    },
    [onSelectAOI]
  );
  // Configuration panel component
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Configure Your Analysis
          </h1>
          <p className="text-muted-foreground">
            Select a region and customize your multi-hazard assessment
          </p>
        </div>

        {/* Custom AOI map (full width) */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              Draw or Enter a Custom Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CustomLocationSelector onSelect={handleCustomSelection} />
            {selectedAOI?.isCustom && selectedAOI.bbox && (
              <div className="text-xs text-muted-foreground">
                Using custom area (W {selectedAOI.bbox[0].toFixed(2)}°, S{" "}
                {selectedAOI.bbox[1].toFixed(2)}°, E{" "}
                {selectedAOI.bbox[2].toFixed(2)}°, N{" "}
                {selectedAOI.bbox[3].toFixed(2)}°)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AOI Selection */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Quick Pick Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup
                value={
                  selectedAOI?.id && !selectedAOI.isCustom ? selectedAOI.id : ""
                }
                onValueChange={(value) => {
                  const aoi = sampleAOIs.find((a) => a.id === value);
                  if (aoi) onSelectAOI(aoi);
                }}
              >
                {sampleAOIs.map((aoi) => (
                  <div
                    key={aoi.id}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      selectedAOI?.id === aoi.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                    onClick={() => onSelectAOI(aoi)}
                  >
                    <RadioGroupItem
                      value={aoi.id}
                      id={aoi.id}
                      className="mt-1"
                    />
                    <Label htmlFor={aoi.id} className="cursor-pointer flex-1">
                      <span className="font-medium">{aoi.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {aoi.description}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* History & Mode */}
          <div className="space-y-6">
            {/* Date range */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Analysis Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm" htmlFor="start-date">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={startDate}
                      onChange={(e) =>
                        onDateChange({ start: e.target.value, end: endDate })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm" htmlFor="end-date">
                      End Date
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={endDate}
                      onChange={(e) =>
                        onDateChange({ start: startDate, end: e.target.value })
                      }
                    />
                  </div>
                </div>
                {dateError && (
                  <p className="text-xs text-destructive">{dateError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Future dates are disabled; end date cannot be before start
                  date.
                </p>
              </CardContent>
            </Card>

            {/* Historical Window */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Time Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Years Back</Label>
                    <span className="text-sm font-medium text-primary">
                      {historyConfig.yearsBack} years
                    </span>
                  </div>
                  <Slider
                    value={[historyConfig.yearsBack]}
                    onValueChange={([value]) =>
                      onHistoryConfigChange({
                        ...historyConfig,
                        yearsBack: value,
                      })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Aggregation</Label>
                  <RadioGroup
                    value={historyConfig.aggregation}
                    onValueChange={(v) =>
                      onHistoryConfigChange({
                        ...historyConfig,
                        aggregation: v as "monthly" | "yearly",
                      })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label
                        htmlFor="monthly"
                        className="cursor-pointer text-sm"
                      >
                        Monthly
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yearly" id="yearly" />
                      <Label
                        htmlFor="yearly"
                        className="cursor-pointer text-sm"
                      >
                        Yearly
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Hazard Selection */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Hazards to Analyze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="flood-toggle"
                      checked={hazards.flood}
                      onCheckedChange={(checked) =>
                        onHazardsChange({ ...hazards, flood: checked })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-flood" />
                      <Label
                        htmlFor="flood-toggle"
                        className="cursor-pointer font-medium"
                      >
                        Flood
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="fire-toggle"
                      checked={hazards.fire}
                      onCheckedChange={(checked) =>
                        onHazardsChange({ ...hazards, fire: checked })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-fire" />
                      <Label
                        htmlFor="fire-toggle"
                        className="cursor-pointer font-medium"
                      >
                        Fire
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="drought-toggle"
                      checked={hazards.drought}
                      onCheckedChange={(checked) =>
                        onHazardsChange({ ...hazards, drought: checked })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-drought" />
                      <Label
                        htmlFor="drought-toggle"
                        className="cursor-pointer font-medium"
                      >
                        Drought
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analysis Mode - Full Width */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Analysis Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={mode}
              onValueChange={(v) => onModeChange(v as AnalysisMode)}
              className="flex flex-wrap gap-4"
            >
              <div
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors flex-1 min-w-[200px] ${
                  mode === "demo"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onModeChange("demo")}
              >
                <RadioGroupItem value="demo" id="demo" />
                <Label htmlFor="demo" className="cursor-pointer flex-1">
                  <span className="font-medium">Demo Mode</span>
                  <span className="text-sm text-muted-foreground block">
                    Uses sample data (recommended)
                  </span>
                </Label>
              </div>
              <div
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors flex-1 min-w-[200px] ${
                  mode === "live"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onModeChange("live")}
              >
                <RadioGroupItem value="live" id="live" />
                <Label htmlFor="live" className="cursor-pointer flex-1">
                  <span className="font-medium">Live Mode</span>
                  <span className="text-sm text-muted-foreground block">
                    Experimental, may fail
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Run Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onRunAnalysis}
            disabled={isLoading || !selectedAOI}
            size="lg"
            className="rounded-2xl px-12 py-7 text-lg font-medium shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run Crisis Snapshot
              </>
            )}
          </Button>
        </div>

        {!selectedAOI && (
          <p className="text-center text-sm text-muted-foreground">
            Please select an Area of Interest to begin
          </p>
        )}
      </div>
    </div>
  );
}
