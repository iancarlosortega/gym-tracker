import { FcGoogle } from 'react-icons/fc';
import { LoginButton } from '@/features/auth/components/login-button';
import { Logo } from '@/features/shared/components/logo';

export default async function Home() {
	return (
		<main className='flex min-h-screen flex-col items-center justify-center'>
			<div className='w-full max-w-md space-y-8 flex flex-col items-center'>
				<Logo size={50} />
				<div className='text-center space-y-2 mt-4'>
					<h1 className='text-3xl font-bold'>Gym Tracker</h1>
					<p className='text-gray-500 text-sm'>
						Login to your account to start tracking your workouts
					</p>
				</div>

				<div className='w-full mt-8'>
					<LoginButton
						name='google'
						label='Login with Google'
						icon={<FcGoogle />}
					/>
				</div>
			</div>
		</main>
	);
}
