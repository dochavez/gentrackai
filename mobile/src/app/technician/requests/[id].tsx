import { useLocalSearchParams } from 'expo-router';

import { TechnicianRequestDetailScreen } from '@/features/technician/technician-request-detail-screen';

export default function TechnicianRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TechnicianRequestDetailScreen id={id} />;
}
