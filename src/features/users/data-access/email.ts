import { eq } from 'drizzle-orm';
import { db as database } from '@/db/connection';
import { users } from '@/db/schemas';

export async function getUserByEmail(email: string) {
	const user = await database.query.users.findFirst({
		where: eq(users.email, email),
	});

	return user;
}
