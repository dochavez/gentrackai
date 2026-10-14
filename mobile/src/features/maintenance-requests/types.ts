/** Maintenance marketplace domain types (customer side). All presentation
 * values (labels, relative times, currency) are backend-computed. */

export type MaintenanceRequestStatus =
  | 'open'
  | 'accepted'
  | 'scheduled'
  | 'completed'
  | 'cancelled';

/** A technician's price bid, as the customer sees it. */
export type MaintenanceOffer = {
  id: string;
  priceLabel: string;
  message: string | null;
  status: string;
  accepted: boolean;
  providerId: string | null;
  providerName: string | null;
  providerLogoUrl: string | null;
  providerRating: number | null;
  ratingLabel: string | null;
  ratingsCount: number;
  jobsCompleted: number;
  submittedBy: string | null;
  createdAgo: string | null;
};

/** A completed job's review. */
export type MaintenanceReview = {
  id: string;
  rating: number;
  ratingLabel: string;
  comment: string | null;
  authorName: string | null;
  authorInitials: string | null;
  createdAgo: string | null;
};

/** A technician provider's public profile (viewed from an offer). */
export type ProviderReview = {
  id: string;
  rating: number;
  ratingLabel: string;
  comment: string | null;
  authorName: string | null;
  authorInitials: string | null;
  createdAgo: string | null;
};

export type ProviderPublicProfile = {
  id: string;
  organizationId: string;
  businessName: string | null;
  bio: string | null;
  phone: string | null;
  logoUrl: string | null;
  ratingAvg: number | null;
  ratingLabel: string | null;
  ratingsCount: number;
  jobsCompleted: number;
  serviceStates: string[];
  reviews: ProviderReview[];
};

export type MaintenanceRequest = {
  id: string;
  status: MaintenanceRequestStatus;
  statusLabel: string;
  detail: string | null;
  state: string;
  generatorId: string | null;
  generatorName: string | null;
  generatorLabel: string | null;
  createdAgo: string | null;
  scheduledAt: string | null;
  scheduleLabel: string | null;
  completedAt: string | null;
  offersCount: number;
  /** Present on the detail response only. */
  offers?: MaintenanceOffer[];
  providerName: string | null;
  providerRating: number | null;
  assignedTechnicianName: string | null;
  assignedTechnicianInitials: string | null;
  acceptedPriceLabel: string | null;
  review: MaintenanceReview | null;
  hasReview: boolean;
  canReview: boolean;
  canCancel: boolean;
};
