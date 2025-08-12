'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateExercise } from '@/features/excercises/hooks/use-exercises';
import {
	type AddExerciseFormData,
	equipmentOptions,
	exerciseTypes,
	muscleGroups,
} from '@/features/excercises/schemas/exercise';

interface AddExerciseDialogProps {
	trigger?: React.ReactNode;
}

export function AddExerciseDialog({ trigger }: AddExerciseDialogProps) {
	const [open, setOpen] = useState(false);
	const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<
		{ id: string; value: string }[]
	>([]);

	const createExercise = useCreateExercise();

	const form = useForm<AddExerciseFormData>({
		defaultValues: {
			name: '',
			description: '',
			secondaryMuscleGroups: [],
			instructions: '',
			videoUrl: '',
			imageUrl: '',
		},
		mode: 'onChange',
	});

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isValid },
	} = form;

	const _watchedValues = watch();

	const onSubmit = async (data: AddExerciseFormData) => {
		// Basic validation
		if (!data.name.trim()) {
			console.error('Exercise name is required');
			return;
		}
		if (!data.description.trim()) {
			console.error('Description is required');
			return;
		}
		if (!data.instructions.trim()) {
			console.error('Instructions are required');
			return;
		}
		if (!data.type) {
			console.error('Exercise type is required');
			return;
		}
		if (!data.equipment) {
			console.error('Equipment is required');
			return;
		}
		if (!data.primaryMuscleGroup) {
			console.error('Primary muscle group is required');
			return;
		}

		try {
			await createExercise.mutateAsync({
				...data,
				type: data.type,
				equipment: data.equipment,
				primaryMuscleGroup: data.primaryMuscleGroup,
				secondaryMuscleGroups: data.secondaryMuscleGroups.filter(Boolean),
				videoUrl: data.videoUrl || undefined,
				imageUrl: data.imageUrl || undefined,
			});

			// Reset form and close dialog
			reset();
			setSecondaryMuscleGroups([]);
			setOpen(false);
		} catch (error) {
			console.error('Failed to create exercise:', error);
		}
	};

	const handleSecondaryMuscleGroupChange = (value: string, index: number) => {
		const newSecondaryMuscleGroups = [...secondaryMuscleGroups];
		newSecondaryMuscleGroups[index] = {
			...newSecondaryMuscleGroups[index],
			value,
		};
		setSecondaryMuscleGroups(newSecondaryMuscleGroups);

		// Update form value
		const newValues = newSecondaryMuscleGroups
			.map((group) => group.value)
			.filter(Boolean);
		setValue('secondaryMuscleGroups', newValues);
	};

	const addSecondaryMuscleGroup = () => {
		const newGroup = { id: `secondary-${Date.now()}`, value: '' };
		setSecondaryMuscleGroups([...secondaryMuscleGroups, newGroup]);
	};

	const removeSecondaryMuscleGroup = (index: number) => {
		const newSecondaryMuscleGroups = secondaryMuscleGroups.filter(
			(_, i) => i !== index
		);
		setSecondaryMuscleGroups(newSecondaryMuscleGroups);

		// Update form value
		const newValues = newSecondaryMuscleGroups
			.map((group) => group.value)
			.filter(Boolean);
		setValue('secondaryMuscleGroups', newValues);
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
						Create a new custom exercise for your workout library.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{/* Exercise Name */}
						<div className='space-y-2'>
							<Label htmlFor='name' className='text-foreground'>
								Exercise Name *
							</Label>
							<Input
								id='name'
								{...register('name')}
								placeholder='e.g., Bench Press'
								className='bg-input border-border text-foreground placeholder:text-muted-foreground'
							/>
							{errors.name && (
								<p className='text-sm text-red-500'>{errors.name.message}</p>
							)}
						</div>

						{/* Type */}
						<div className='space-y-2'>
							<Label className='text-foreground'>Type *</Label>
							<Select
								value={_watchedValues.type}
								onValueChange={(value) =>
									setValue('type', value as (typeof exerciseTypes)[number])
								}>
								<SelectTrigger className='bg-input border-border text-foreground'>
									<SelectValue placeholder='Select exercise type' />
								</SelectTrigger>
								<SelectContent className='bg-popover border-border'>
									{exerciseTypes.map((type) => (
										<SelectItem
											key={type}
											value={type}
											className='text-popover-foreground hover:bg-accent hover:text-accent-foreground'>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.type && (
								<p className='text-sm text-red-500'>{errors.type.message}</p>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{/* Equipment */}
						<div className='space-y-2'>
							<Label className='text-foreground'>Equipment *</Label>
							<Select
								value={_watchedValues.equipment}
								onValueChange={(value) =>
									setValue(
										'equipment',
										value as (typeof equipmentOptions)[number]
									)
								}>
								<SelectTrigger className='bg-input border-border text-foreground'>
									<SelectValue placeholder='Select equipment' />
								</SelectTrigger>
								<SelectContent className='bg-popover border-border'>
									{equipmentOptions.map((equipment) => (
										<SelectItem
											key={equipment}
											value={equipment}
											className='text-popover-foreground hover:bg-accent hover:text-accent-foreground'>
											{equipment
												.split('_')
												.map(
													(word) => word.charAt(0).toUpperCase() + word.slice(1)
												)
												.join(' ')}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.equipment && (
								<p className='text-sm text-red-500'>
									{errors.equipment.message}
								</p>
							)}
						</div>

						{/* Primary Muscle Group */}
						<div className='space-y-2'>
							<Label className='text-foreground'>Primary Muscle Group *</Label>
							<Select
								value={_watchedValues.primaryMuscleGroup}
								onValueChange={(value) =>
									setValue(
										'primaryMuscleGroup',
										value as (typeof muscleGroups)[number]
									)
								}>
								<SelectTrigger className='bg-input border-border text-foreground'>
									<SelectValue placeholder='Select primary muscle group' />
								</SelectTrigger>
								<SelectContent className='bg-popover border-border'>
									{muscleGroups.map((group) => (
										<SelectItem
											key={group}
											value={group}
											className='text-popover-foreground hover:bg-accent hover:text-accent-foreground'>
											{group
												.split('_')
												.map(
													(word) => word.charAt(0).toUpperCase() + word.slice(1)
												)
												.join(' ')}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.primaryMuscleGroup && (
								<p className='text-sm text-red-500'>
									{errors.primaryMuscleGroup.message}
								</p>
							)}
						</div>
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<Label htmlFor='description' className='text-foreground'>
							Description *
						</Label>
						<Textarea
							id='description'
							{...register('description')}
							placeholder='Brief description of the exercise'
							className='bg-input border-border text-foreground placeholder:text-muted-foreground'
						/>
						{errors.description && (
							<p className='text-sm text-red-500'>
								{errors.description.message}
							</p>
						)}
					</div>

					{/* Secondary Muscle Groups */}
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<Label className='text-foreground'>Secondary Muscle Groups</Label>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={addSecondaryMuscleGroup}
								className='border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'>
								Add Secondary Group
							</Button>
						</div>
						{secondaryMuscleGroups.map((group, index) => (
							<div key={group.id} className='flex space-x-2'>
								<Select
									value={group.value}
									onValueChange={(value) =>
										handleSecondaryMuscleGroupChange(value, index)
									}>
									<SelectTrigger className='bg-input border-border text-foreground'>
										<SelectValue placeholder='Select muscle group' />
									</SelectTrigger>
									<SelectContent className='bg-popover border-border'>
										{muscleGroups.map((muscle) => (
											<SelectItem
												key={muscle}
												value={muscle}
												className='text-popover-foreground hover:bg-accent hover:text-accent-foreground'>
												{muscle
													.split('_')
													.map(
														(word) =>
															word.charAt(0).toUpperCase() + word.slice(1)
													)
													.join(' ')}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => removeSecondaryMuscleGroup(index)}
									className='border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'>
									Remove
								</Button>
							</div>
						))}
					</div>

					{/* Instructions */}
					<div className='space-y-2'>
						<Label htmlFor='instructions' className='text-foreground'>
							Instructions *
						</Label>
						<Textarea
							id='instructions'
							{...register('instructions')}
							placeholder='Step-by-step instructions for performing the exercise'
							className='bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[100px]'
						/>
						{errors.instructions && (
							<p className='text-sm text-red-500'>
								{errors.instructions.message}
							</p>
						)}
					</div>

					{/* URLs */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='videoUrl' className='text-foreground'>
								Video URL
							</Label>
							<Input
								id='videoUrl'
								type='url'
								{...register('videoUrl')}
								placeholder='https://example.com/video'
								className='bg-input border-border text-foreground placeholder:text-muted-foreground'
							/>
							{errors.videoUrl && (
								<p className='text-sm text-red-500'>
									{errors.videoUrl.message}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='imageUrl' className='text-foreground'>
								Image URL
							</Label>
							<Input
								id='imageUrl'
								type='url'
								{...register('imageUrl')}
								placeholder='https://example.com/image.jpg'
								className='bg-input border-border text-foreground placeholder:text-muted-foreground'
							/>
							{errors.imageUrl && (
								<p className='text-sm text-red-500'>
									{errors.imageUrl.message}
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setOpen(false)}
							className='border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={createExercise.isPending || !isValid}
							className='bg-primary hover:bg-primary/90'>
							{createExercise.isPending ? 'Creating...' : 'Create Exercise'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
