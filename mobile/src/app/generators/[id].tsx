import { useLocalSearchParams } from 'expo-router';

import { GeneratorDetailScreen } from '@/features/generators/generator-detail-screen';

export default function GeneratorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GeneratorDetailScreen id={id} />;
}
