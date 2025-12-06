import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, Droplets, Flame, Sun, CheckCircle2 } from 'lucide-react';

interface AnalysisProgressProps {
  onComplete: () => void;
}

const steps = [
  { icon: Droplets, label: 'Analyzing flood data...', color: 'text-flood' },
  { icon: Flame, label: 'Scanning fire hotspots...', color: 'text-fire' },
  { icon: Sun, label: 'Processing drought indicators...', color: 'text-drought' },
  { icon: CheckCircle2, label: 'Generating crisis memo...', color: 'text-primary' },
];

export function AnalysisProgress({ onComplete }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const duration = 4000; // 4 seconds total
    const interval = 50; // Update every 50ms
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const stepIndex = Math.min(Math.floor(progress / 25), steps.length - 1);
    setCurrentStep(stepIndex);
  }, [progress]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 space-y-8">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Running Crisis Snapshot</h2>
        <p className="text-muted-foreground">Analyzing satellite and climate data...</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Progress value={progress} className="h-3 rounded-full" />
        
        <div className="flex items-center justify-center gap-2">
          <CurrentIcon className={`w-5 h-5 ${steps[currentStep].color}`} />
          <span className="text-sm font-medium">{steps[currentStep].label}</span>
        </div>
      </div>

      <div className="flex items-center gap-8 pt-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex flex-col items-center gap-2 transition-all ${
                isActive ? 'opacity-100 scale-110' : isComplete ? 'opacity-60' : 'opacity-30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-primary/20' : 'bg-muted'
              }`}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-severity-none" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? step.color : 'text-muted-foreground'}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
