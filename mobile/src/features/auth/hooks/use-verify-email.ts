import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { resendVerificationEmail } from '@/services/api/auth';

/**
 * Drives the "verify your email" gate: resend the link, re-check verification
 * (the user may have tapped the link elsewhere), and sign out. Refreshes once on
 * mount so a verification completed via the email link is picked up immediately.
 */
export function useVerifyEmail() {
  const { user, refreshUser, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshUser();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend the link.');
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      await refreshUser();
      // If verified, the root gate redirects into the app automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh.');
    } finally {
      setChecking(false);
    }
  };

  return { email: user?.email ?? '', busy, checking, sent, error, resend, check, signOut };
}
