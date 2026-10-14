import { Palette } from '@/constants/design';
import type { InviteRole, TeamRole } from '@/features/team/types';

/** Assignable roles for the invite form + role control (owner is fixed). */
export const INVITE_ROLES: { key: InviteRole; label: string }[] = [
  { key: 'member', label: 'Member' },
  { key: 'admin', label: 'Admin' },
];

export function roleLabel(role: TeamRole): string {
  return { owner: 'Owner', admin: 'Admin', member: 'Member' }[role];
}

/** Role → badge colors (pure UI mapping). */
export function roleColors(role: TeamRole): { color: string; bg: string } {
  switch (role) {
    case 'owner':
      return { color: Palette.goldText, bg: Palette.goldWash };
    case 'admin':
      return { color: Palette.planText, bg: Palette.planBg };
    default:
      return { color: Palette.textStrong, bg: 'rgba(27,23,18,0.05)' };
  }
}
