export type BillingPlan = 'free' | 'pro';

/**
 * Which channel bills the organization: Stripe (web Checkout) or one of the app
 * stores (In-App Purchase). Decides where "manage subscription" goes — Apple and
 * Google own their own renewals, so the Stripe portal cannot touch them.
 */
export type BillingSource = 'stripe' | 'app_store' | 'play_store';

/** Matches the backend BillingController@show payload. */
export type Billing = {
  plan: BillingPlan;
  subscribed: boolean;
  /** Null while on Free. */
  source: BillingSource | null;
  onGracePeriod: boolean;
  endsAt: string | null;
  limits: {
    generators: number | null;
    members: number | null;
    insights: boolean;
    chatDaily: number | null;
  };
  usage: {
    generators: number;
    members: number;
  };
  pro: {
    monthlyLabel: string;
    yearlyLabel: string;
    yearlyNote: string | null;
  };
  canManageBilling: boolean;
};
