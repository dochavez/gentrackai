import { useRouter } from 'expo-router';

/**
 * Switches between the app's two top-level sections (personas): the Fleet app
 * (`(app)` — Home/Fleet/Tasks/Insights) and the Technician panel (`technician`
 * — Requests/My jobs/Profile).
 *
 * Both are sibling shells at the root, so switching `replace`s one for the other
 * (a clean section swap, not a pushed "portal"). Any open modal is dismissed
 * first so the swap works from Home, the Account modal, or the Technician
 * profile alike.
 */
export function useAppSection() {
  const router = useRouter();

  const swap = (href: '/technician/requests' | '/') => {
    // Close any open modal so we replace the base shell (not stack on it). Only
    // when there's actually something to dismiss — calling dismissAll at a base
    // tab dispatches an unhandled POP_TO_TOP warning.
    if (typeof router.canDismiss === 'function' && router.canDismiss()) {
      router.dismissAll();
    }
    router.replace(href);
  };

  return {
    /** Enter the Technician section. */
    goToTechnician: () => swap('/technician/requests'),
    /** Return to the Fleet (customer) section. */
    goToFleet: () => swap('/'),
  };
}
