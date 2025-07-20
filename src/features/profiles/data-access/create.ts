import { db as database } from '@/db/connection';
import { type Profile, profiles } from '@/db/schemas';

export async function createProfile(userId: string, data: Partial<Profile>) {
	const [profile] = await database
		.insert(profiles)
		.values({
			userId,
			...data,
		})
		.onConflictDoNothing()
		.returning();
	return profile;
}
