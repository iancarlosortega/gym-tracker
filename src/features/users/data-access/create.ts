import { db as database } from '@/db/connection';
import { users } from '@/db/schemas';
import type { UserRole } from '@/features/users/types/roles';

export async function createUser(email: string, role?: UserRole) {
	const [user] = await database
		.insert(users)
		.values({
			email,
			role,
		})
		.returning();
	return user;
}
