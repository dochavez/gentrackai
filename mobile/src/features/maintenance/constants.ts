import { Palette } from '@/constants/design';
import type {
  DueOption,
  MaintenanceStatus,
  PeriodOption,
  StatusColors,
} from '@/features/maintenance/types';

/** Quick-pick due windows for the "schedule a service" form (days from today). */
export const DUE_OPTIONS: DueOption[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

/** Selectable report period windows (chips on the report screen). */
export const PERIODS: PeriodOption[] = [
  { key: '3mo', label: '1–3 mo' },
  { key: '6mo', label: '6 mo' },
  { key: '9mo', label: '9 mo' },
  { key: '1y', label: '1 year' },
  { key: '5y', label: '5 yr history' },
];

/** Maps a maintenance status to its badge design-token colors (pure UI concern). */
export function statusColors(status: MaintenanceStatus): StatusColors {
  switch (status) {
    case 'done':
      return { color: Palette.green, bg: Palette.greenBg };
    case 'overdue':
      return { color: Palette.red, bg: Palette.redBg };
    case 'soon':
      return { color: Palette.goldText, bg: Palette.goldWash };
    default:
      return { color: Palette.textMuted, bg: 'rgba(27,23,18,0.05)' };
  }
}
