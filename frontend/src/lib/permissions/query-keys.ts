export const permissionKeys = {
  all: ["permissions"] as const,
  lists: () => [...permissionKeys.all, "list"] as const,
  list: () => [...permissionKeys.lists()] as const,
  details: () => [...permissionKeys.all, "detail"] as const,
  detail: (id: string) => [...permissionKeys.details(), id] as const,
  roleGrants: (roleId: string) => [...permissionKeys.all, "role-grants", roleId] as const,
};
