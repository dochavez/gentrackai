import { useState } from 'react';
import useSWR from 'swr';

import type { InviteRole, TeamOverview } from '@/features/team/types';
import {
  cancelInvitation,
  ORGANIZATION_KEY,
  removeMember,
  updateMemberRole,
} from '@/services/api/organization';

/**
 * The organization overview (members, roles, pending invitations) plus the
 * owner/admin management actions. Reads `GET /organization` via SWR.
 */
export function useTeam() {
  const { data, isLoading, mutate } = useSWR<TeamOverview>(ORGANIZATION_KEY);
  const [busyId, setBusyId] = useState<string | null>(null);

  const changeRole = async (userId: string, role: InviteRole) => {
    setBusyId(userId);
    try {
      await updateMemberRole(userId, role);
      await mutate();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (userId: string) => {
    setBusyId(userId);
    try {
      await removeMember(userId);
      await mutate();
    } finally {
      setBusyId(null);
    }
  };

  const cancelInvite = async (id: string) => {
    setBusyId(id);
    try {
      await cancelInvitation(id);
      await mutate();
    } finally {
      setBusyId(null);
    }
  };

  return {
    organization: data?.organization,
    role: data?.role,
    canManageTeam: data?.canManageTeam ?? false,
    members: data?.members ?? [],
    invitations: data?.invitations ?? [],
    isLoading,
    busyId,
    refresh: mutate,
    changeRole,
    remove,
    cancelInvite,
  };
}
