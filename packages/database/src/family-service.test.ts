import { describe, expect, it } from "vitest";
import {
  isFamilyRole,
  canInvite,
  canManageMembers,
  canRemoveMember,
  canEditSharedResources,
  canAdminWorkspace,
  type FamilyRole,
} from "./family-roles";

describe("isFamilyRole", () => {
  it.each(["owner", "admin", "member"] as FamilyRole[])("%s is valid", (role) => {
    expect(isFamilyRole(role)).toBe(true);
  });

  it.each(["guest", "superadmin", "", "OWNER", "viewer"])("%s is not valid", (role) => {
    expect(isFamilyRole(role)).toBe(false);
  });
});

describe("canInvite", () => {
  it("owner can invite", () => {
    expect(canInvite("owner")).toBe(true);
  });
  it("admin can invite", () => {
    expect(canInvite("admin")).toBe(true);
  });
  it("member cannot invite", () => {
    expect(canInvite("member")).toBe(false);
  });
});

describe("canManageMembers", () => {
  it("owner can manage", () => {
    expect(canManageMembers("owner")).toBe(true);
  });
  it("admin can manage", () => {
    expect(canManageMembers("admin")).toBe(true);
  });
  it("member cannot manage", () => {
    expect(canManageMembers("member")).toBe(false);
  });
});

describe("canRemoveMember", () => {
  it("owner can remove admin", () => {
    expect(canRemoveMember("owner", "admin")).toBe(true);
  });
  it("owner can remove member", () => {
    expect(canRemoveMember("owner", "member")).toBe(true);
  });
  it("owner cannot remove owner", () => {
    expect(canRemoveMember("owner", "owner")).toBe(false);
  });
  it("admin cannot remove admin", () => {
    expect(canRemoveMember("admin", "admin")).toBe(false);
  });
  it("admin cannot remove owner", () => {
    expect(canRemoveMember("admin", "owner")).toBe(false);
  });
  it("member cannot remove member", () => {
    expect(canRemoveMember("member", "member")).toBe(false);
  });
});

describe("canEditSharedResources", () => {
  it("all roles can edit shared resources", () => {
    expect(canEditSharedResources("owner")).toBe(true);
    expect(canEditSharedResources("admin")).toBe(true);
    expect(canEditSharedResources("member")).toBe(true);
  });
});

describe("canAdminWorkspace", () => {
  it("owner and admin can admin", () => {
    expect(canAdminWorkspace("owner")).toBe(true);
    expect(canAdminWorkspace("admin")).toBe(true);
  });
  it("member cannot admin", () => {
    expect(canAdminWorkspace("member")).toBe(false);
  });
});
