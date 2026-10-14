import type { InviteRole } from '@/features/team/types';
import { api, getApiErrorMessage } from '@/services/api/client';

export const ORGANIZATION_KEY = '/organization';
export const INVITATIONS_KEY = '/invitations';

/** Invite someone by email. Returns the backend's generic confirmation message. */
export async function inviteMember(email: string, role: InviteRole): Promise<string> {
  try {
    const { data } = await api.post<{ message: string }>(`${ORGANIZATION_KEY}/invitations`, { email, role });
    return data.message;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't send the invitation."));
  }
}

export async function updateMemberRole(userId: string, role: InviteRole): Promise<void> {
  try {
    await api.patch(`${ORGANIZATION_KEY}/members/${userId}`, { role });
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't update the role."));
  }
}

export async function removeMember(userId: string): Promise<void> {
  try {
    await api.delete(`${ORGANIZATION_KEY}/members/${userId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't remove the member."));
  }
}

export async function cancelInvitation(id: string): Promise<void> {
  try {
    await api.delete(`${INVITATIONS_KEY}/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't cancel the invitation."));
  }
}

export async function acceptInvitation(id: string): Promise<void> {
  try {
    await api.patch(`${INVITATIONS_KEY}/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't accept the invitation."));
  }
}

export async function declineInvitation(id: string): Promise<void> {
  try {
    await api.delete(`${INVITATIONS_KEY}/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't decline the invitation."));
  }
}
