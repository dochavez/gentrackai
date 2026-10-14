import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { useAuth } from '@/hooks/use-auth';
import type { IncomingInvitation } from '@/features/team/types';
import {
  acceptInvitation,
  declineInvitation,
  INVITATIONS_KEY,
  ORGANIZATION_KEY,
} from '@/services/api/organization';

/**
 * Invitations addressed to the current user, with accept/decline. Accepting
 * moves the user to a new organization, so we refresh the auth user and
 * revalidate all cached fleet data.
 */
export function useIncomingInvitations() {
  const { refreshUser } = useAuth();
  const { data, isLoading, mutate } = useSWR<{ invitations: IncomingInvitation[] }>(INVITATIONS_KEY);
  const [busyId, setBusyId] = useState<string | null>(null);

  const accept = async (id: string) => {
    setBusyId(id);
    try {
      await acceptInvitation(id);
      await refreshUser();
      await mutate();
      await globalMutate(ORGANIZATION_KEY);
      // The org changed — refetch everything scoped to it.
      await globalMutate(() => true, undefined, { revalidate: true });
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (id: string) => {
    setBusyId(id);
    try {
      await declineInvitation(id);
      await mutate();
    } finally {
      setBusyId(null);
    }
  };

  return {
    invitations: data?.invitations ?? [],
    isLoading,
    busyId,
    accept,
    decline,
    refresh: mutate,
  };
}
