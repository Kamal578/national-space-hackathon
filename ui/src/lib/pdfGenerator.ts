import jsPDF from "jspdf";
import type { AnalysisResult } from "./types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const severityInterpretation = {
  flood: {
    none: "No significant inundation expected.",
    low: "Minor, localized ponding possible.",
    moderate: "Noticeable flooding in low-lying areas.",
    high: "Widespread flooding likely.",
    unknown: "Flood conditions could not be assessed.",
  },
  fire: {
    none: "No active fire hotspots detected.",
    low: "Isolated hotspots; low spread risk.",
    moderate: "Multiple hotspots; elevated spread risk.",
    high: "High fire activity; rapid spread possible.",
    unknown: "Fire conditions could not be assessed.",
  },
  drought: {
    none: "Vegetation and rainfall near normal.",
    watch: "Early signs of dryness; monitor.",
    emerging: "Developing drought stress.",
    severe: "Severe moisture stress and vegetation loss.",
    unknown: "Drought conditions could not be assessed.",
  },
};

export async function generatePDF(result: AnalysisResult): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Header
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SPARKS.lab", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Multi-Hazard Crisis Snapshot", margin, 28);

  // Right side header info
  doc.setFontSize(9);
  doc.text(
    `Generated: ${formatDate(result.generatedAt)}`,
    pageWidth - margin,
    18,
    { align: "right" }
  );
  doc.text(`Mode: ${result.mode.toUpperCase()}`, pageWidth - margin, 26, {
    align: "right",
  });

  y = 55;

  // Area and Time Range
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(result.aoiName || "Analysis Area", margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Period: ${formatDate(result.timeRange.start)} - ${formatDate(
      result.timeRange.end
    )}`,
    margin,
    y
  );

  y += 15;

  // Summary Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const { flood, fire, drought } = result.summary;

  const floodText =
    flood.severity === "unknown"
      ? "flood data was unavailable"
      : flood.severity === "none"
      ? `no significant flooding was detected (${severityInterpretation.flood.none})`
      : `${flood.severity} flood conditions were observed (${
          severityInterpretation.flood[flood.severity]
        }, ${flood.floodedAreaKm2} km² inundated, approximately ${
          flood.floodedAreaPercentOfAOI
        }% of the analysis area)`;

  const fireText =
    fire.severity === "unknown"
      ? "fire data was unavailable"
      : fire.severity === "none"
      ? `no active fire hotspots were detected (${severityInterpretation.fire.none})`
      : `${fire.severity} fire activity was recorded with ${
          fire.hotspotsCount
        } active hotspot(s); ${severityInterpretation.fire[fire.severity]}`;

  const droughtText =
    drought.severity === "unknown"
      ? "drought data was unavailable"
      : drought.severity === "none"
      ? `vegetation and rainfall conditions appear normal (${severityInterpretation.drought.none})`
      : `${drought.severity} drought conditions are present (${
          severityInterpretation.drought[drought.severity]
        }, NDVI anomaly: ${drought.ndviAnomaly}, rainfall deficit: ${
          drought.rainfallAnomalyMm
        } mm)`;

  const summaryText = `During the analysis period, ${result.aoiName} experienced the following conditions: ${floodText}; ${fireText}; and ${droughtText}.`;

  const lines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 10;

  // Hazard Details Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Hazard Assessment Summary", margin, y);
  y += 10;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 5, contentWidth, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Hazard", margin + 5, y);
  doc.text("Severity", margin + 50, y);
  doc.text("Key Metrics", margin + 90, y);

  y += 10;
  doc.setFont("helvetica", "normal");

  // Flood row
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y - 5, contentWidth, 12, "F");
  doc.text("Flood", margin + 5, y);
  doc.text(flood.severity.toUpperCase(), margin + 50, y);
  doc.text(
    flood.floodedAreaKm2 !== null
      ? `${flood.floodedAreaKm2} km² (${flood.floodedAreaPercentOfAOI}% of AOI)`
      : "N/A",
    margin + 90,
    y
  );
  y += 5;
  doc.setFontSize(8);
  doc.text(
    `Interpretation: ${severityInterpretation.flood[flood.severity] || "N/A"}`,
    margin + 90,
    y
  );
  doc.setFontSize(9);

  y += 12;

  // Fire row
  doc.setFillColor(254, 226, 226);
  doc.rect(margin, y - 5, contentWidth, 12, "F");
  doc.text("Fire", margin + 5, y);
  doc.text(fire.severity.toUpperCase(), margin + 50, y);
  doc.text(
    fire.hotspotsCount !== null
      ? `${fire.hotspotsCount} hotspots detected`
      : "N/A",
    margin + 90,
    y
  );
  y += 5;
  doc.setFontSize(8);
  doc.text(
    `Interpretation: ${severityInterpretation.fire[fire.severity] || "N/A"}`,
    margin + 90,
    y
  );
  doc.setFontSize(9);

  y += 12;

  // Drought row
  doc.setFillColor(254, 249, 195);
  doc.rect(margin, y - 5, contentWidth, 12, "F");
  doc.text("Drought", margin + 5, y);
  doc.text(drought.severity.toUpperCase(), margin + 50, y);
  doc.text(
    drought.ndviAnomaly !== null
      ? `NDVI: ${drought.ndviAnomaly}, Rain: ${drought.rainfallAnomalyMm}mm`
      : "N/A",
    margin + 90,
    y
  );
  y += 5;
  doc.setFontSize(8);
  doc.text(
    `Interpretation: ${
      severityInterpretation.drought[drought.severity] || "N/A"
    }`,
    margin + 90,
    y
  );
  doc.setFontSize(9);

  y += 20;

  // Data Sources Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Data Sources & Methodology", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  const sources = [
    "• Flood: Sentinel-1 SAR-derived flood extents (ESA/Copernicus)",
    "• Fire: NASA FIRMS active fire data (VIIRS/MODIS)",
    "• Drought: NDVI anomalies (Sentinel-2/MODIS), rainfall anomalies (CHIRPS/IMERG)",
    "• Spatial analysis: Turf.js for geospatial operations",
    "• AOI clipping and area calculations performed using standard GIS methods",
  ];

  sources.forEach((source) => {
    doc.text(source, margin, y);
    y += 5;
  });

  y += 10;

  // Disclaimer
  doc.setFillColor(255, 251, 235);
  doc.rect(margin, y - 3, contentWidth, 20, "F");
  doc.setFontSize(8);
  doc.setTextColor(120, 80, 20);
  doc.setFont("helvetica", "italic");
  const disclaimer =
    "Disclaimer: This report is generated by SPARKS.lab, a prototype crisis intelligence tool. The analysis is based on sample/demo data and should not be used for operational emergency decision-making. Always verify findings with authoritative sources before taking action.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 10);
  doc.text(disclaimerLines, margin + 5, y + 4);

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text("SPARKS.lab - Unified Flood, Fire & Drought Snapshot", margin, 285);
  doc.text(`Analysis ID: ${result.analysisId}`, pageWidth - margin, 285, {
    align: "right",
  });

  // Save the PDF
  doc.save(`crisis-memo-${result.analysisId}.pdf`);
}
