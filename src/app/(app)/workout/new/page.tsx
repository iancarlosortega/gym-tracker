'use client';

import { useRouter } from 'next/navigation';
import { AddWorkoutForm } from '@/features/workouts/components/add-workout-form';

export default function NewWorkoutPage() {
	const router = useRouter();

	const handleSuccess = (workoutId: string) => {
		router.push(`/workout/${workoutId}`);
	};

	const handleCancel = () => {
		router.push('/dashboard');
	};

	return (
		<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-foreground'>New Workout</h1>
				<p className='mt-1 text-sm text-muted-foreground'>
					Create a new training session
				</p>
			</div>

			<AddWorkoutForm onSuccess={handleSuccess} onCancel={handleCancel} />
		</div>
	);
}
