import { eq } from 'drizzle-orm';
import { db as database } from '@/db/connection';
import { accounts, users } from '@/db/schemas';

export async function getAccountByGoogleId(googleId: string) {
	return await database
		.select({
			id: users.id,
			isActive: users.isActive,
			role: users.role,
		})
		.from(users)
		.innerJoin(accounts, eq(accounts.userId, users.id))
		.where(eq(accounts.googleId, googleId));
}
