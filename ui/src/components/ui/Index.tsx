import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavbar } from '@/components/TopNavbar';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { MapView } from '@/components/MapView';
import { HazardCard } from '@/components/HazardCard';
import { HazardChart } from '@/components/HazardChart';
import { CrisisMemoPreview } from '@/components/CrisisMemoPreview';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { TimeSeriesCharts } from '@/components/TimeSeriesCharts';
import { useToast } from '@/hooks/use-toast';
import { runAnalysis } from '@/lib/analysis';
import { getSummaryForPeriod, getPeriodScaleFactor } from '@/lib/periodFilter';
import type { SampleAOI, AnalysisMode, HazardSelection, HistoryConfig, TimeRange, AnalysisResult, AnalysisSummary } from '@/lib/types';

type ViewState = 'config' | 'loading' | 'results';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [selectedAOI, setSelectedAOI] = useState<SampleAOI | null>(null);
  const [mode, setMode] = useState<AnalysisMode>('demo');
  const [hazards, setHazards] = useState<HazardSelection>({
    flood: true,
    fire: true,
    drought: true
  });
  const [historyConfig, setHistoryConfig] = useState<HistoryConfig>({
    yearsBack: 3,
    aggregation: 'monthly'
  });
  const [viewState, setViewState] = useState<ViewState>('config');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange | null>(null);

  const handleRunAnalysis = async () => {
    if (!selectedAOI) {
      toast({
        title: 'No Area Selected',
        description: 'Please select an Area of Interest before running the analysis.',
        variant: 'destructive'
      });
      return;
    }

    setViewState('loading');
    
    try {
      const analysisResult = await runAnalysis({
        aoi: selectedAOI.feature,
        mode,
        historyConfig,
        hazards,
        aoiName: selectedAOI.name
      });

      setPendingResult(analysisResult);

    } catch (error) {
      console.error('Analysis failed:', error);
      setViewState('config');
      toast({
        title: 'Analysis Failed',
        description: 'An error occurred while running the analysis. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleProgressComplete = () => {
    if (pendingResult) {
      setResult(pendingResult);
      setSelectedPeriod(pendingResult.timeRange);
      setPendingResult(null);
      setViewState('results');
      
      toast({
        title: 'Analysis Complete',
        description: `Crisis snapshot generated for ${selectedAOI?.name}`,
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handlePeriodSelect = useCallback((period: TimeRange) => {
    setSelectedPeriod(period);
  }, []);

  const handleGoBack = () => {
    if (viewState === 'results') {
      setResult(null);
      setSelectedPeriod(null);
      setViewState('config');
    } else {
      navigate('/');
    }
  };

  // Compute period-specific summary when selectedPeriod changes
  const periodSummary: AnalysisSummary | null = useMemo(() => {
    if (!result?.history || !selectedPeriod) return result?.summary || null;
    return getSummaryForPeriod(result.history, selectedPeriod);
  }, [result, selectedPeriod]);

  // Compute scale factors for map visualization
  const scaleFactors = useMemo(() => {
    if (!result?.history || !selectedPeriod) {
      return { flood: 1, fire: 1, drought: 1 };
    }
    return {
      flood: getPeriodScaleFactor(result.history, selectedPeriod, 'flood'),
      fire: getPeriodScaleFactor(result.history, selectedPeriod, 'fire'),
      drought: getPeriodScaleFactor(result.history, selectedPeriod, 'drought')
    };
  }, [result, selectedPeriod]);

  const mapCenter: [number, number] = selectedAOI 
    ? selectedAOI.center 
    : [0, 20];
  
  const mapZoom = selectedAOI?.zoom || 2;

  const displayTimeRange = selectedPeriod || result?.timeRange;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar 
        showBackButton={viewState !== 'results'} 
        onGoBack={handleGoBack}
        showNewAnalysis={viewState === 'results'}
        onNewAnalysis={handleGoBack}
      />
      
      {viewState === 'results' ? (
        /* Results view - no sidebar, full width */
        <main className="flex-1 overflow-y-auto">
          {result && displayTimeRange && periodSummary && (
            <div ref={resultsRef} className="p-6 space-y-6">
              {/* Analysis Context Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedAOI?.name || 'Analysis Region'}</h2>
                    <p className="text-sm text-muted-foreground">{selectedAOI?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <div className="px-3 py-1.5 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Period: </span>
                    <span className="font-medium text-foreground">
                      {historyConfig.yearsBack} year{historyConfig.yearsBack > 1 ? 's' : ''} ({historyConfig.aggregation})
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                    <span className="text-muted-foreground">Mode: </span>
                    <span className="font-medium text-primary capitalize">{mode}</span>
                  </div>
                </div>
              </div>

              {/* Historical Time-Series Charts */}
              {result.history && (
                <TimeSeriesCharts
                  history={result.history}
                  hazards={hazards}
                  selectedPeriod={displayTimeRange}
                  onPeriodSelect={handlePeriodSelect}
                />
              )}

              {/* Map Section */}
              <div className="h-[400px] md:h-[500px]">
                <MapView
                  center={mapCenter}
                  zoom={mapZoom}
                  result={result}
                  showFlood={hazards.flood}
                  showFire={hazards.fire}
                  showDrought={hazards.drought}
                  scaleFactors={scaleFactors}
                  periodHotspotsCount={periodSummary.fire.hotspotsCount}
                />
              </div>

              {/* Hazard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hazards.flood && (
                  <HazardCard
                    type="flood"
                    severity={periodSummary.flood.severity}
                    metrics={[
                      { label: 'Area Flooded', value: periodSummary.flood.floodedAreaKm2 ? `${periodSummary.flood.floodedAreaKm2} km²` : null },
                      { label: '% of AOI', value: periodSummary.flood.floodedAreaPercentOfAOI ? `${periodSummary.flood.floodedAreaPercentOfAOI}%` : null }
                    ]}
                    note={periodSummary.flood.note}
                  />
                )}
                
                {hazards.fire && (
                  <HazardCard
                    type="fire"
                    severity={periodSummary.fire.severity}
                    metrics={[
                      { label: 'Active Hotspots', value: periodSummary.fire.hotspotsCount },
                      { label: 'Clusters', value: periodSummary.fire.clusters || 0 }
                    ]}
                    note={periodSummary.fire.note}
                  />
                )}
                
                {hazards.drought && (
                  <HazardCard
                    type="drought"
                    severity={periodSummary.drought.severity}
                    metrics={[
                      { label: 'NDVI Anomaly', value: periodSummary.drought.ndviAnomaly },
                      { label: 'Rainfall Deficit', value: periodSummary.drought.rainfallAnomalyMm ? `${periodSummary.drought.rainfallAnomalyMm} mm` : null }
                    ]}
                    note={periodSummary.drought.note}
                  />
                )}
              </div>

              {/* Chart and Memo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HazardChart summary={periodSummary} />
                <CrisisMemoPreview result={{ ...result, summary: periodSummary, timeRange: displayTimeRange }} />
              </div>
            </div>
          )}
        </main>
      ) : (
        /* Config/Loading view - centered layout */
        <main className="flex-1 overflow-y-auto">
          {viewState === 'config' && (
            <ConfigurationPanel
              selectedAOI={selectedAOI}
              onSelectAOI={setSelectedAOI}
              mode={mode}
              onModeChange={setMode}
              hazards={hazards}
              onHazardsChange={setHazards}
              historyConfig={historyConfig}
              onHistoryConfigChange={setHistoryConfig}
              onRunAnalysis={handleRunAnalysis}
              isLoading={false}
            />
          )}

          {viewState === 'loading' && (
            <AnalysisProgress onComplete={handleProgressComplete} />
          )}
        </main>
      )}
    </div>
  );
};

export default Index;
