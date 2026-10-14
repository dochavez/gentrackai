import { api, getApiErrorMessage } from '@/services/api/client';
import type { MaintenanceRequest } from '@/features/maintenance-requests/types';

/** SWR key for the customer's marketplace requests. */
export const MAINTENANCE_REQUESTS_KEY = '/maintenance-requests';
/** SWR key for a single request (with its offers). */
export const maintenanceRequestKey = (id: string) => `/maintenance-requests/${id}`;
/** SWR key for a technician provider's public profile (rating + reviews). */
export const providerProfileKey = (organizationId: string) => `/providers/${organizationId}/profile`;

export async function createMaintenanceRequest(input: {
  generatorId: string;
  detail: string;
}): Promise<MaintenanceRequest> {
  try {
    const { data } = await api.post<{ request: MaintenanceRequest }>('/maintenance-requests', {
      generator_id: input.generatorId,
      detail: input.detail,
    });
    return data.request;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't create the request."));
  }
}

export async function acceptOffer(requestId: string, offerId: string): Promise<MaintenanceRequest> {
  try {
    const { data } = await api.post<{ request: MaintenanceRequest }>(
      `/maintenance-requests/${requestId}/offers/${offerId}/accept`,
    );
    return data.request;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't accept the offer."));
  }
}

export async function cancelMaintenanceRequest(requestId: string): Promise<MaintenanceRequest> {
  try {
    const { data } = await api.post<{ request: MaintenanceRequest }>(
      `/maintenance-requests/${requestId}/cancel`,
    );
    return data.request;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't cancel the request."));
  }
}

export async function submitReview(
  requestId: string,
  input: { rating: number; comment: string | null },
): Promise<MaintenanceRequest> {
  try {
    const { data } = await api.post<{ request: MaintenanceRequest }>(
      `/maintenance-requests/${requestId}/review`,
      { rating: input.rating, comment: input.comment },
    );
    return data.request;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't submit your review."));
  }
}
