/**
 * Whether the native Sign in with Apple flow can run on this device.
 *
 * `false` everywhere except iOS, and false on iOS versions that predate the
 * feature — so the button is simply not rendered rather than failing on press.
 * Starts `false` and flips once the async check resolves.
 */

import { useEffect, useState } from 'react';

import { isAppleSignInAvailable } from '@/services/auth/apple';

export function useAppleSignInAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    isAppleSignInAvailable()
      .then((result) => {
        if (active) setAvailable(result);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return available;
}
