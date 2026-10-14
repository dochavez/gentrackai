import useSWR from 'swr';

import type { ProviderPublicProfile } from '@/features/maintenance-requests/types';
import { providerProfileKey } from '@/services/api/maintenance-requests';

/** A technician provider's public profile (rating + recent reviews). */
export function useProviderProfile(organizationId: string) {
  const { data, isLoading } = useSWR<{ profile: ProviderPublicProfile }>(
    providerProfileKey(organizationId),
  );

  return { profile: data?.profile, isLoading };
}
