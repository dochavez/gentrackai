import { useLocalSearchParams } from 'expo-router';

import { LogReadingScreen } from '@/features/generators/log-reading-screen';
import type { ReadingMetric } from '@/features/generators/types';

export default function LogReading() {
  const { generatorId, metric } = useLocalSearchParams<{ generatorId: string; metric?: ReadingMetric }>();
  return <LogReadingScreen generatorId={generatorId} metric={metric} />;
}
