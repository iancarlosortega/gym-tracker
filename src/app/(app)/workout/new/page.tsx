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
		<div className='container mx-auto py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold'>New Workout</h1>
				<p className='mt-1 text-sm text-muted-foreground'>
					Create a new training session
				</p>
			</div>

			<AddWorkoutForm onSuccess={handleSuccess} onCancel={handleCancel} />
		</div>
	);
}
