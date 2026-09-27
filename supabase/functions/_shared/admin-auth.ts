export interface AdminMembership {
  user_id: string;
  email: string;
  role: string;
  active: boolean;
}

export class AccessDeniedError extends Error {}

export function requireActiveAdmin(
  membership: AdminMembership | null,
  userId: string,
): AdminMembership {
  if (!membership || membership.user_id !== userId ||
      membership.active !== true || membership.role !== 'admin') {
    throw new AccessDeniedError('Acesso admin negado');
  }
  return membership;
}
