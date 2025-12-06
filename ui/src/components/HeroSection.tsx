import { Shield, Zap, Globe, Droplets, Flame, Sun, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onRunAnalysis: () => void;
  isLoading: boolean;
  hasSelectedAOI: boolean;
  selectedAOIName?: string;
}

export function HeroSection({ 
  onRunAnalysis, 
  isLoading, 
  hasSelectedAOI,
  selectedAOIName 
}: HeroSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-8 text-center">
      <div className="space-y-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <Shield className="w-4 h-4" />
          Multi-Hazard Risk Intelligence
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
          Unified Situational Awareness for
          <span className="text-primary block mt-2">Flood, Fire & Drought</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Generate automated crisis snapshots using open Earth observation and climate data. 
          Built for governments, agencies, insurers, and NGOs.
        </p>

        {/* Hazard Icons */}
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-flood/10 flex items-center justify-center">
              <Droplets className="w-7 h-7 text-flood" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Flood</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-fire/10 flex items-center justify-center">
              <Flame className="w-7 h-7 text-fire" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Fire</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-drought/10 flex items-center justify-center">
              <Sun className="w-7 h-7 text-drought" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Drought</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>Instant Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span>Global Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Actionable Memos</span>
          </div>
        </div>

        {/* Selected AOI Indicator */}
        {hasSelectedAOI && (
          <div className="flex items-center justify-center gap-2 text-sm text-primary bg-primary/10 py-2 px-4 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>Selected: <strong>{selectedAOIName}</strong></span>
          </div>
        )}

        {/* Single Run Button */}
        <div className="pt-4">
          {!hasSelectedAOI ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select an Area of Interest from the sidebar to begin
              </p>
            </div>
          ) : (
            <Button 
              onClick={onRunAnalysis}
              disabled={isLoading}
              size="lg"
              className="rounded-2xl px-10 py-7 text-lg font-medium shadow-lg"
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
          )}
        </div>
      </div>
    </div>
  );
}
