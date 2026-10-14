import { useLocalSearchParams } from 'expo-router';

import { RequestDetailScreen } from '@/features/maintenance-requests/request-detail-screen';

export default function MaintenanceRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RequestDetailScreen id={id} />;
}
