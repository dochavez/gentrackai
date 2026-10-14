/** Shared auth domain types (used by services, context, and features). */

/** Which mechanism authenticated the current user. */
export type AuthProviderId = 'google' | 'email';

/** A user's role within their organization. */
export type TeamRole = 'owner' | 'admin' | 'member';

/** One organization the user belongs to (backend-driven, presentation-ready). */
export type OrganizationMembership = {
  id: string;
  name: string;
  role: TeamRole;
  /** Whether this is the user's active organization. */
  isCurrent: boolean;
};

/**
 * Provider-agnostic user model used across the app. The Google SDK user and the
 * backend user both map onto this shape.
 */
export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  /** Presentation values computed by the backend (never derived in the app). */
  firstName: string | null;
  initials: string;
  photoUrl: string | null;
  provider: AuthProviderId;
  /** Whether the user's email is verified (email signups must verify; social is trusted). */
  emailVerified: boolean;
  /** Role/name/id for the user's *active* organization (backend-driven). */
  role: TeamRole | null;
  canManageTeam: boolean;
  organizationId: string | null;
  organizationName: string | null;
  /** Every organization the user belongs to (for the in-app switcher). */
  organizations: OrganizationMembership[];
  /**
   * The active organization's RevenueCat "app user id" (`org_{id}`), built by the
   * backend. Store purchases are identified with this so an In-App Purchase lands
   * on the organization rather than an anonymous device. Null without an org.
   */
  iapAppUserId: string | null;
  /** Service address (maintenance marketplace). All backend-driven. */
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  /** Backend-computed: the address is complete enough to request a maintenance. */
  hasAddress: boolean;
  /** Backend-computed: the active org is a technician provider (panel usable now). */
  isTechnician: boolean;
};
