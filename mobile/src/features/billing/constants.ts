import { Platform } from 'react-native';

/** Marketing feature bullets for each plan (presentational copy). */
export const FREE_FEATURES: string[] = [
  'Up to 3 generators',
  'Up to 2 team members',
  'Maintenance reminders + email',
  'Photo model scan',
  '5 AI chats per day',
];

export const PRO_FEATURES: string[] = [
  'Unlimited generators',
  'Unlimited team members',
  'Unlimited AI assistant chat',
  'AI insights & forecasts',
];

/**
 * Legal links shown beside the subscribe button. Apple requires a *functional*
 * Terms of Use (EULA) and Privacy Policy link on any screen selling an
 * auto-renewing subscription (guideline 3.1.2) — a missing or dead link is its
 * own rejection, separate from 3.1.1.
 *
 * `terms` points at Apple's standard EULA, which applies by default when a
 * developer supplies none of their own, so it is a valid answer to the
 * requirement. Swap it for gentrackai.com/terms once that page exists — the
 * marketing site's footer "Terms" link currently goes nowhere.
 */
export const LEGAL_URLS = {
  terms: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacy: 'https://gentrackai.com/privacy-policy',
} as const;

/**
 * The renewal terms the stores require next to the price. Named per platform
 * because Apple and Google each expect their own account to be the one called
 * out; purely a copy concern, so it lives here with the rest of the wording.
 */
export const RENEWAL_DISCLOSURE =
  `Billed to your ${Platform.select({
    ios: 'Apple ID',
    android: 'Google Play account',
    default: 'account',
  })} and renews automatically until you cancel. Cancel any time in your ` +
  'subscription settings, at least 24 hours before the period ends.';

/**
 * RevenueCat offering identifiers. Pro and the technician plan are sold as two
 * separate offerings; create them with these ids in the RevenueCat dashboard.
 */
export const IAP_OFFERINGS = {
  pro: 'pro',
  technician: 'technician',
} as const;
