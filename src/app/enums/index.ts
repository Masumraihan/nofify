export const USER_ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  USER: "USER",
} as const;
export type TUserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const GENDER = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;
export type TGender = (typeof GENDER)[keyof typeof GENDER];
