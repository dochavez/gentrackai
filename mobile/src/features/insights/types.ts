export type InsightSeverity = 'info' | 'warning' | 'critical';

/** One AI maintenance recommendation (matches the backend payload). */
export type Recommendation = {
  title: string;
  body: string;
  severity: InsightSeverity;
  generatorName?: string | null;
};

/** A single bar in the weekly run-hours chart. */
export type WeeklyRunHours = { label: string; value: number };

/** Deterministic analytics (matches App\Services\FleetAnalytics::build). */
export type FleetAnalytics = {
  generatorCount: number;
  healthScore: number;
  healthLabel: string;
  healthSubtext: string;
  weeklyRunHours: WeeklyRunHours[];
  runHoursTrendLabel: string;
  forecastLabel: string;
};

/** The cached AI layer (null until the first generation completes). */
export type AiInsights = {
  recommendations: Recommendation[];
  generatedAgo: string | null;
};

/** Full `GET /insights` response. */
export type InsightsResponse = {
  analytics: FleetAnalytics;
  ai: AiInsights | null;
  aiPending: boolean;
};
