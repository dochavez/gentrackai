import { Palette } from '@/constants/design';

import type { GeneratorStatus } from './types';

export type StatusDisplay = {
  label: string;
  color: string;
  bg: string;
  dot: string;
  ok: boolean;
};

/** Maps a generator status to its label and palette colors. */
export function statusDisplay(status: GeneratorStatus): StatusDisplay {
  switch (status) {
    case 'needs_care':
      return { label: 'NEEDS CARE', color: Palette.red, bg: Palette.redBg, dot: Palette.alert, ok: false };
    case 'offline':
      return { label: 'OFFLINE', color: Palette.textMuted, bg: Palette.goldWash, dot: Palette.textMuted, ok: false };
    default:
      return { label: 'RUNNING', color: Palette.green, bg: Palette.greenBg, dot: Palette.green, ok: true };
  }
}
