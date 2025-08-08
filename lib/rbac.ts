export type UserRole = "admin" | "manager" | "staff";

export function canAccessModule(role: UserRole, module: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    admin: ["dashboard", "inventory", "sales", "finance", "customers"],
    manager: ["dashboard", "inventory", "sales", "finance", "customers"],
    staff: ["inventory", "sales", "customers"],
  };
  return permissions[role]?.includes(module) ?? false;
}

export function requireRole<T>(role: UserRole, allowed: UserRole[], action: () => Promise<T>) {
  if (!allowed.includes(role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return action();
} 