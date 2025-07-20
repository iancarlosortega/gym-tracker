import { db as database } from '@/db/connection';
import { accounts } from '@/db/schemas';

export async function createAccountViaGoogle(userId: string, googleId: string) {
	await database
		.insert(accounts)
		.values({
			userId: userId,
			accountType: 'google',
			googleId,
		})
		.onConflictDoNothing()
		.returning();
}
