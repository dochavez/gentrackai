import type { BillingSource } from '@/features/billing/types';

/** Technician-panel domain types. All labels/status are backend-computed. */

/** A marketplace request/job as the technician sees it (PII-limited pre-accept). */
export type TechnicianRequest = {
  id: string;
  status: string;
  statusLabel: string;
  detail: string | null;
  state: string;
  generatorLabel: string | null;
  customerName: string | null;
  customerInitials: string | null;
  createdAgo: string | null;
  scheduledAt: string | null;
  scheduleLabel: string | null;
  offersCount: number;
  hasMyOffer: boolean;
  myOfferId: string | null;
  myOfferStatus: string | null;
  myOfferPriceLabel: string | null;
  canOffer: boolean;
  needsAssignment: boolean;
  canSchedule: boolean;
  canComplete: boolean;
  assignedTechnicianName: string | null;
  assignedTechnicianInitials: string | null;
  acceptedPriceLabel: string | null;
  review: {
    id: string;
    rating: number;
    ratingLabel: string;
    comment: string | null;
    authorName: string | null;
    createdAgo: string | null;
  } | null;
  hasReview: boolean;
};

/** Technician-panel status (from GET /technician). */
export type TechnicianStatus = {
  isProvider: boolean;
  businessName: string | null;
  phone: string | null;
  bio: string | null;
  logoUrl: string | null;
  serviceStates: string[];
  paymentReady: boolean;
  subscribed: boolean;
  panelUnlocked: boolean;
  ratingLabel: string | null;
  ratingsCount: number;
  jobsCompleted: number;
  trial: { limit: number; used: number; remaining: number };
  subscriptionStatusLabel: string;
  canManageBilling: boolean;
};

/** Technician billing status (GET /technician/billing) — status + pricing. */
export type TechnicianBilling = TechnicianStatus & {
  onGracePeriod: boolean;
  endsAt: string | null;
  /** Which channel bills the plan; anything but `stripe` is a store purchase. */
  source: BillingSource | null;
  pricing: { monthlyLabel: string; yearlyLabel: string; yearlyNote: string };
};
