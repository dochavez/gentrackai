import { useLocalSearchParams } from 'expo-router';

import { ResetPasswordScreen } from '@/features/auth/reset-password-screen';

/** Deep-link target for the emailed reset link: /reset-password?token=…&email=… */
export default function ResetPassword() {
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();

  return <ResetPasswordScreen token={token ?? ''} email={email ?? ''} />;
}
