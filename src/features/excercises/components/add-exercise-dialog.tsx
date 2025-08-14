'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/features/shared/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/features/shared/components/dialog';
import { AddExerciseForm } from './add-exercise-form';

interface AddExerciseDialogProps {
	trigger?: React.ReactNode;
}

export function AddExerciseDialog({ trigger }: AddExerciseDialogProps) {
	const [open, setOpen] = useState(false);

	const handleFormSuccess = () => {
		setOpen(false);
	};

	const handleFormCancel = () => {
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className='bg-primary hover:bg-primary/90'>
						<Plus className='w-4 h-4 mr-2' />
						Add Exercise
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='sm:max-w-[600px] bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-foreground'>
						Add New Exercise
					</DialogTitle>
					<DialogDescription className='text-muted-foreground'>
						Create a new custom exercise for your workout library. Fields marked
						with <span className='text-red-500'>*</span> are required.
					</DialogDescription>
				</DialogHeader>
				<AddExerciseForm
					onSuccess={handleFormSuccess}
					onCancel={handleFormCancel}
				/>
			</DialogContent>
		</Dialog>
	);
}
