import type { TeamRole } from '@/types/auth';

export type { TeamRole };

/** A role that can be assigned to an invitee/member (owner is fixed). */
export type InviteRole = 'admin' | 'member';

/** An organization member (matches the backend MemberResource). */
export type Member = {
  id: string;
  name: string | null;
  email: string;
  initials: string;
  role: TeamRole;
  isMe: boolean;
};

/** A pending invitation the org has sent (owner/admin view). */
export type PendingInvitation = {
  id: string;
  email: string;
  role: TeamRole;
  invitedAgo: string | null;
  organizationName: string | null;
  invitedBy: string | null;
};

/** `GET /organization` payload. */
export type TeamOverview = {
  organization: { id: string; name: string };
  role: TeamRole;
  canManageTeam: boolean;
  members: Member[];
  invitations?: PendingInvitation[];
};

/** An invitation addressed to the current user (matches `GET /invitations`). */
export type IncomingInvitation = {
  id: string;
  email: string;
  role: TeamRole;
  invitedAgo: string | null;
  organizationName: string | null;
  invitedBy: string | null;
};
