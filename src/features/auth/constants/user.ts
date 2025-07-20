export const USER_ROLES_ARRAY = [
	'USER',
	'CUSTOMER',
	'EMPLOYEE',
	'ADMIN',
] as const;

export const USER_ROLES = {
	USER: { value: 'USER', translation: 'Usuario' },
	CUSTOMER: { value: 'CUSTOMER', translation: 'Cliente' },
	EMPLOYEE: { value: 'EMPLOYEE', translation: 'Empleado' },
	ADMIN: { value: 'ADMIN', translation: 'Admin' },
} as const;
