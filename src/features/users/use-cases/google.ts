import { createAccountViaGoogle } from '@/features/accounts/data-access/create';
import type { GoogleUser } from '@/features/auth/utils/google-auth';
import { createProfile } from '@/features/profiles/data-access/create';
import { createUser } from '@/features/users/data-access/create';
import { getUserByEmail } from '@/features/users/data-access/email';

export async function createGoogleUserUseCase(googleUser: GoogleUser) {
	let existingUser = await getUserByEmail(googleUser.email);

	if (!existingUser) {
		existingUser = await createUser(googleUser.email);
	}

	await createAccountViaGoogle(existingUser.id, googleUser.sub);

	await createProfile(existingUser.id, {
		displayName: googleUser.name,
		image: googleUser.picture,
	});

	return existingUser;
}
