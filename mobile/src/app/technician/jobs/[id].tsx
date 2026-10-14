import { useLocalSearchParams } from 'expo-router';

import { TechnicianJobDetailScreen } from '@/features/technician/technician-job-detail-screen';

export default function TechnicianJobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TechnicianJobDetailScreen id={id} />;
}
