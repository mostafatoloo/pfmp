export type FamilyRole = "owner" | "admin" | "member";
/** @deprecated alias — prefer FamilyRole */
export type WorkspaceRole = FamilyRole;

const RANK: Record<FamilyRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function isFamilyRole(value: string): value is FamilyRole {
  return value === "owner" || value === "admin" || value === "member";
}

export function isValidRole(value: string): value is FamilyRole {
  return isFamilyRole(value);
}

export function hasRoleAtLeast(actor: string, required: FamilyRole): boolean {
  if (!isFamilyRole(actor)) return false;
  return RANK[actor] >= RANK[required];
}

export function canManageMembers(role: FamilyRole): boolean {
  return RANK[role] >= RANK.admin;
}

export function canInvite(role: FamilyRole): boolean {
  return RANK[role] >= RANK.admin;
}

export function canEditSharedResources(role: FamilyRole): boolean {
  return RANK[role] >= RANK.member;
}

export function canAdminWorkspace(role: FamilyRole): boolean {
  return RANK[role] >= RANK.admin;
}

export function canRemoveMember(actor: FamilyRole, target: FamilyRole): boolean {
  if (target === "owner") return false;
  return RANK[actor] > RANK[target];
}
