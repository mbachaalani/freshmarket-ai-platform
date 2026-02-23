import type { Role } from "@/types/domain";

const ROLE_ORDER: Role[] = ["STAFF", "MANAGER", "ADMIN"];

export function isAtLeast(role: Role, required: Role) {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(required);
}

export function canManageInventory(role: Role) {
  return isAtLeast(role, "MANAGER");
}

export function canDeleteInventory(role: Role) {
  return isAtLeast(role, "MANAGER");
}

export function canManageUsers(role: Role) {
  return role === "ADMIN";
}
