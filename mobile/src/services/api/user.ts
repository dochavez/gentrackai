import { api, getApiErrorMessage } from '@/services/api/client';
import type { AppUser } from '@/types/auth';

/** Editable profile fields (camelCase in the app; mapped to the API's snake_case). */
export type ProfileInput = {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

/**
 * Updates the signed-in user's profile (name + service address). Returns the
 * refreshed user; callers should also `refreshUser()` so the Redux-held user
 * reflects the change.
 */
export async function updateUserProfile(input: ProfileInput): Promise<AppUser> {
  try {
    const { data } = await api.patch<{ user: AppUser }>('/user/profile', {
      name: input.name,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      country: input.country,
      phone: input.phone,
    });
    return data.user;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't save your profile."));
  }
}
