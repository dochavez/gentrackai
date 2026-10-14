import { useLocalSearchParams } from 'expo-router';

import { ProviderProfileScreen } from '@/features/maintenance-requests/provider-profile-screen';

export default function ProviderProfile() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  return <ProviderProfileScreen organizationId={organizationId} />;
}
