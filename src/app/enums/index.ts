export const USER_ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  USER: "USER",
} as const;
export type TUserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
