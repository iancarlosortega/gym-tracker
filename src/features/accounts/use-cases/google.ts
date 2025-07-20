import { getAccountByGoogleId } from '@/features/accounts/data-access/google';

export async function getAccountByGoogleIdUseCase(googleId: string) {
	return await getAccountByGoogleId(googleId);
}
