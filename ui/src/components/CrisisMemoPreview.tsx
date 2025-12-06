import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generatePDF } from '@/lib/pdfGenerator';
import type { AnalysisResult } from '@/lib/types';

interface CrisisMemoPreviewProps {
  result: AnalysisResult;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function generateMemoText(result: AnalysisResult): string {
  const { summary, timeRange, aoiName } = result;
  
  const floodText = summary.flood.severity === 'unknown' 
    ? 'flood data unavailable'
    : summary.flood.severity === 'none'
    ? 'no significant flooding'
    : `${summary.flood.severity} flood risk (${summary.flood.floodedAreaKm2} km² inundated, ~${summary.flood.floodedAreaPercentOfAOI}% of AOI)`;

  const fireText = summary.fire.severity === 'unknown'
    ? 'fire data unavailable'
    : summary.fire.severity === 'none'
    ? 'no active fire hotspots'
    : `${summary.fire.severity} fire activity with ${summary.fire.hotspotsCount} hotspot${summary.fire.hotspotsCount !== 1 ? 's' : ''} detected`;

  const droughtText = summary.drought.severity === 'unknown'
    ? 'drought data unavailable'
    : summary.drought.severity === 'none'
    ? 'normal vegetation and rainfall conditions'
    : `${summary.drought.severity} drought conditions with NDVI anomaly of ${summary.drought.ndviAnomaly} and rainfall deficit of ${summary.drought.rainfallAnomalyMm} mm`;

  return `For the period ${formatDate(timeRange.start)} to ${formatDate(timeRange.end)}, ${aoiName} experienced: ${floodText}; ${fireText}; ${droughtText}.`;
}

export function CrisisMemoPreview({ result }: CrisisMemoPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const memoText = generateMemoText(result);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(result);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Crisis Memo Preview
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Generated: {formatDate(result.generatedAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4 border border-border">
          <p className="text-sm leading-relaxed">{memoText}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-flood-light rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Flood</p>
            <p className="font-semibold capitalize">{result.summary.flood.severity}</p>
          </div>
          <div className="bg-fire-light rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Fire</p>
            <p className="font-semibold capitalize">{result.summary.fire.severity}</p>
          </div>
          <div className="bg-drought-light rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Drought</p>
            <p className="font-semibold capitalize">{result.summary.drought.severity}</p>
          </div>
        </div>

        <Button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full rounded-xl"
          variant="secondary"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Crisis Memo (PDF)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
