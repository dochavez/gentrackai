import { useLocalSearchParams } from 'expo-router';

import { EditGeneratorScreen } from '@/features/generators/edit-generator-screen';

export default function EditGenerator() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditGeneratorScreen id={id} />;
}
