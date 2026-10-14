import { useLocalSearchParams } from 'expo-router';

import { NewTaskScreen } from '@/features/tasks/new-task-screen';

export default function NewTask() {
  const { generatorId } = useLocalSearchParams<{ generatorId?: string }>();
  return <NewTaskScreen generatorId={generatorId} />;
}
