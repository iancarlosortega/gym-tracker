import type { USER_ROLES_ARRAY } from '@/features/auth/constants/user';

export type UserRole = (typeof USER_ROLES_ARRAY)[number];
