import { useState } from 'react';
import { mutate as globalMutate } from 'swr';

import { useAuth } from '@/hooks/use-auth';

/**
 * The user's organizations plus the ability to switch the active one. Switching
 * re-scopes every feature to the new org, so we revalidate all cached fleet data
 * (the same broad revalidation the accept-invitation flow uses).
 */
export function useOrganizationSwitcher() {
  const { user, switchOrganization } = useAuth();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Fall back to a single synthesized membership when the API hasn't yet been
  // upgraded to return `organizations` (keeps the current org visible/usable
  // against an older backend).
  const fromApi = user?.organizations ?? [];
  const organizations =
    fromApi.length > 0
      ? fromApi
      : user?.organizationId && user?.organizationName
        ? [
            {
              id: user.organizationId,
              name: user.organizationName,
              role: user.role ?? 'member',
              isCurrent: true,
            },
          ]
        : [];
  const currentId = organizations.find((o) => o.isCurrent)?.id ?? user?.organizationId ?? null;

  const switchTo = async (organizationId: string) => {
    if (organizationId === currentId || switchingId !== null) return;
    setSwitchingId(organizationId);
    try {
      await switchOrganization(organizationId);
      await globalMutate(() => true, undefined, { revalidate: true });
    } finally {
      setSwitchingId(null);
    }
  };

  return { organizations, currentId, switchingId, switchTo };
}
