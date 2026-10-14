import { Badge } from '@/components/ui/badge';
import { roleColors, roleLabel } from '@/features/team/constants';
import type { TeamRole } from '@/features/team/types';

export function RoleBadge({ role }: { role: TeamRole }) {
  const c = roleColors(role);

  return <Badge label={roleLabel(role).toUpperCase()} color={c.color} backgroundColor={c.bg} />;
}
