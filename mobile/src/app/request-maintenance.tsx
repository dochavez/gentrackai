import { useLocalSearchParams } from 'expo-router';

import { CreateRequestScreen } from '@/features/maintenance-requests/create-request-screen';

export default function RequestMaintenance() {
  const { generatorId } = useLocalSearchParams<{ generatorId: string }>();
  return <CreateRequestScreen generatorId={generatorId} />;
}
