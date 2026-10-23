import { describe, expect, it } from "vitest";
import {
  canInvite,
  canManageMembers,
  canRemoveMember,
  isFamilyRole,
} from "./family-roles";

describe("family roles", () => {
  it("recognizes roles", () => {
    expect(isFamilyRole("owner")).toBe(true);
    expect(isFamilyRole("viewer")).toBe(false);
  });

  it("gates invite/manage", () => {
    expect(canInvite("member")).toBe(false);
    expect(canInvite("admin")).toBe(true);
    expect(canManageMembers("owner")).toBe(true);
  });

  it("prevents removing owners", () => {
    expect(canRemoveMember("owner", "owner")).toBe(false);
    expect(canRemoveMember("owner", "member")).toBe(true);
    expect(canRemoveMember("admin", "admin")).toBe(false);
  });
});
