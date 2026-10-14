import { Palette } from '@/constants/design';
import type { InsightSeverity } from '@/features/insights/types';

/** Severity → design-token color pair for a recommendation badge (pure UI). */
export function severityColors(severity: InsightSeverity): { color: string; bg: string } {
  switch (severity) {
    case 'critical':
      return { color: Palette.red, bg: Palette.redBg };
    case 'warning':
      return { color: Palette.goldText, bg: Palette.goldWash };
    default:
      return { color: Palette.green, bg: Palette.greenBg };
  }
}

/** Ring color by score band. */
export function healthColor(score: number): string {
  if (score >= 85) return Palette.green;
  if (score >= 60) return Palette.gold;
  return Palette.alert;
}
