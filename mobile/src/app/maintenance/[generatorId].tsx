import { useLocalSearchParams } from 'expo-router';

import { MaintenanceScreen } from '@/features/maintenance/maintenance-screen';

export default function Maintenance() {
  const { generatorId } = useLocalSearchParams<{ generatorId: string }>();
  return <MaintenanceScreen generatorId={generatorId} />;
}
