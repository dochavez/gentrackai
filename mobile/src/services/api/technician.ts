import { api, getApiErrorMessage } from '@/services/api/client';
import { appendImage, MULTIPART, type ImageFile } from '@/services/api/upload';
import type { AppUser } from '@/types/auth';
import type { TechnicianRequest, TechnicianStatus } from '@/features/technician/types';

/** SWR keys. */
export const TECHNICIAN_KEY = '/technician';
export const TECHNICIAN_REQUESTS_KEY = '/technician/requests';
export const TECHNICIAN_JOBS_KEY = '/technician/jobs';
export const technicianRequestKey = (id: string) => `/technician/requests/${id}`;
export const technicianJobKey = (id: string) => `/technician/jobs/${id}`;

export async function becomeTechnician(input: {
  businessName: string;
  serviceStates: string[];
}): Promise<AppUser> {
  try {
    const { data } = await api.post<{ user: AppUser }>('/technician/onboarding', {
      business_name: input.businessName,
      service_states: input.serviceStates,
    });
    return data.user;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't set up your technician panel."));
  }
}

export type TechnicianProfileInput = {
  businessName: string;
  phone: string | null;
  bio: string | null;
  serviceStates: string[];
};

/**
 * Updates the provider's profile. With a logo we POST multipart with
 * `_method=PATCH` (RN multipart uploads must be POST); otherwise a JSON PATCH.
 */
export async function updateTechnicianProfile(
  input: TechnicianProfileInput,
  logo?: ImageFile,
): Promise<TechnicianStatus> {
  try {
    if (logo) {
      const form = new FormData();
      form.append('_method', 'PATCH');
      form.append('business_name', input.businessName);
      if (input.phone) form.append('phone', input.phone);
      if (input.bio) form.append('bio', input.bio);
      input.serviceStates.forEach((s) => form.append('service_states[]', s));
      appendImage(form, logo, 'logo');
      const { data } = await api.post<{ technician: TechnicianStatus }>('/technician/profile', form, MULTIPART);
      return data.technician;
    }
    const { data } = await api.patch<{ technician: TechnicianStatus }>('/technician/profile', {
      business_name: input.businessName,
      phone: input.phone,
      bio: input.bio,
      service_states: input.serviceStates,
    });
    return data.technician;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't save your profile."));
  }
}

export async function updateServiceAreas(serviceStates: string[]): Promise<void> {
  try {
    await api.put('/technician/service-areas', { service_states: serviceStates });
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't update your service areas."));
  }
}

export async function submitOffer(
  requestId: string,
  input: { price: number; message: string | null },
): Promise<void> {
  try {
    await api.post(`/technician/requests/${requestId}/offers`, {
      price: input.price,
      message: input.message,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't submit your offer."));
  }
}

export async function assignTechnician(jobId: string, technicianId: string): Promise<TechnicianRequest> {
  try {
    const { data } = await api.post<{ job: TechnicianRequest }>(`/technician/jobs/${jobId}/assign`, {
      technician_id: technicianId,
    });
    return data.job;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't assign the technician."));
  }
}

export async function scheduleJob(jobId: string, scheduledAt: string): Promise<TechnicianRequest> {
  try {
    const { data } = await api.patch<{ job: TechnicianRequest }>(`/technician/jobs/${jobId}/schedule`, {
      scheduled_at: scheduledAt,
    });
    return data.job;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't schedule the visit."));
  }
}

export async function completeJob(jobId: string): Promise<TechnicianRequest> {
  try {
    const { data } = await api.patch<{ job: TechnicianRequest }>(`/technician/jobs/${jobId}/complete`);
    return data.job;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't complete the job."));
  }
}

export async function requestReview(jobId: string): Promise<void> {
  try {
    await api.post(`/technician/jobs/${jobId}/request-review`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't request a review."));
  }
}
