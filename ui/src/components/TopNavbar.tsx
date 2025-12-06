import { Globe2, Info, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TopNavbarProps {
  showBackButton?: boolean;
  onGoBack?: () => void;
  showNewAnalysis?: boolean;
  onNewAnalysis?: () => void;
}

export function TopNavbar({ showBackButton, onGoBack, showNewAnalysis, onNewAnalysis }: TopNavbarProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {showBackButton && !showNewAnalysis && (
          <Button variant="ghost" size="icon" onClick={onGoBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <Globe2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">CrisisLens</h1>
            <p className="text-xs text-muted-foreground">Unified Flood, Fire & Drought Snapshot</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showNewAnalysis && (
          <Button onClick={onNewAnalysis} size="sm" className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            New Analysis
          </Button>
        )}

        {/* add max z-index to DialogContent to ensure it appears above other elements */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Info className="w-4 h-4" />
              About
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>About CrisisLens</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">CrisisLens</strong> provides unified situational awareness
                for flood, fire, and drought hazards using open Earth observation and climate data.
              </p>
              <p>
                Designed for civil protection agencies, insurers, utilities, and NGOs, CrisisLens
                reduces analyst workload by automating multi-hazard risk snapshots and generating
                actionable crisis memos.
              </p>
              <div>
                <p className="font-medium text-foreground mb-2">Data Sources:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Flood: Sentinel-1 SAR derived extents</li>
                  <li>Fire: NASA FIRMS active fire data</li>
                  <li>Drought: NDVI anomalies (Sentinel/MODIS) & rainfall (CHIRPS/IMERG)</li>
                </ul>
              </div>
              <p className="text-xs border-l-2 border-primary pl-3 italic">
                Disclaimer: This is a prototype for demonstration purposes.
                Not intended for operational emergency decision-making.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}