import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Globe2,
  Droplets,
  Flame,
  Sun,
  Shield,
  BarChart3,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">SPARKS.lab</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            Multi-Hazard Risk Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Real-Time Crisis Awareness
            <span className="text-primary block mt-2">At Your Fingertips</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            SPARKS.lab combines satellite imagery and climate data to provide
            instant flood, fire, and drought assessments for any region on
            Earth.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="w-12 h-12 rounded-xl bg-flood/10 flex items-center justify-center mb-4">
                <Droplets className="w-6 h-6 text-flood" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Flood Detection</h3>
              <p className="text-sm text-muted-foreground">
                Sentinel-1 SAR analysis for real-time flood extent mapping and
                severity assessment.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="w-12 h-12 rounded-xl bg-fire/10 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-fire" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fire Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                NASA FIRMS integration for active fire hotspot detection and
                cluster analysis.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="w-12 h-12 rounded-xl bg-drought/10 flex items-center justify-center mb-4">
                <Sun className="w-6 h-6 text-drought" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Drought Analysis</h3>
              <p className="text-sm text-muted-foreground">
                NDVI anomaly and rainfall deficit tracking for early drought
                warning.
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Interactive Dashboards</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Automated Crisis Memos</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" />
              <span>Global Coverage</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="rounded-2xl px-10 py-7 text-lg font-medium shadow-xl mt-8"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-muted-foreground">
            No account required • Demo mode available
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>Built for governments, agencies, insurers, and NGOs worldwide.</p>
      </footer>
    </div>
  );
};

export default Landing;
