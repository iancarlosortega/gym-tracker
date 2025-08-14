'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
	addExerciseSchema,
	equipmentOptions,
	exerciseTypes,
	muscleGroups,
} from '@/features/excercises/schemas/exercise';

interface AddExerciseFormProps {
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function AddExerciseForm({ onSuccess, onCancel }: AddExerciseFormProps) {
	const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<
		{ id: string; value: string }[]
	>([]);

	const createExercise = useCreateExercise();

	const form = useForm<AddExerciseFormData>({
		resolver: zodResolver(addExerciseSchema),
	});

	const onSubmit: SubmitHandler<AddExerciseFormData> = async (data) => {
		try {
			await createExercise.mutateAsync(data);

			// Reset form and call success callback
			form.reset();
			setSecondaryMuscleGroups([]);
			onSuccess?.();
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
		form.setValue('secondaryMuscleGroups', newValues);
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
		form.setValue('secondaryMuscleGroups', newValues);
	};

	const formatDisplayText = (value: string) => {
		return value
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{/* Exercise Name */}
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Exercise Name <span className='text-red-500'>*</span>
								</FormLabel>
								<FormControl>
									<Input placeholder='e.g., Bench Press' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Type */}
					<FormField
						control={form.control}
						name='type'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Type <span className='text-red-500'>*</span>
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select exercise type' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{exerciseTypes.map((type) => (
											<SelectItem key={type} value={type}>
												{formatDisplayText(type)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{/* Equipment */}
					<FormField
						control={form.control}
						name='equipment'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Equipment <span className='text-red-500'>*</span>
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select equipment' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{equipmentOptions.map((equipment) => (
											<SelectItem key={equipment} value={equipment}>
												{formatDisplayText(equipment)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Primary Muscle Group */}
					<FormField
						control={form.control}
						name='primaryMuscleGroup'
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Primary Muscle Group <span className='text-red-500'>*</span>
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select primary muscle group' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{muscleGroups.map((group) => (
											<SelectItem key={group} value={group}>
												{formatDisplayText(group)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Description */}
				<FormField
					control={form.control}
					name='description'
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Description <span className='text-red-500'>*</span>
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder='Brief description of the exercise'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Secondary Muscle Groups */}
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<FormLabel>Secondary Muscle Groups</FormLabel>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={addSecondaryMuscleGroup}>
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
								<SelectTrigger>
									<SelectValue placeholder='Select muscle group' />
								</SelectTrigger>
								<SelectContent>
									{muscleGroups.map((muscle) => (
										<SelectItem key={muscle} value={muscle}>
											{formatDisplayText(muscle)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => removeSecondaryMuscleGroup(index)}>
								Remove
							</Button>
						</div>
					))}
					<FormField
						control={form.control}
						name='secondaryMuscleGroups'
						render={() => <FormMessage />}
					/>
				</div>

				{/* Instructions */}
				<FormField
					control={form.control}
					name='instructions'
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Instructions <span className='text-red-500'>*</span>
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder='Step-by-step instructions for performing the exercise'
									className='min-h-[100px]'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* URLs */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<FormField
						control={form.control}
						name='videoUrl'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Video URL</FormLabel>
								<FormControl>
									<Input
										type='url'
										placeholder='https://example.com/video'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='imageUrl'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Image URL</FormLabel>
								<FormControl>
									<Input
										type='url'
										placeholder='https://example.com/image.jpg'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Form Actions */}
				<div className='flex justify-end space-x-2'>
					<Button type='button' variant='outline' onClick={onCancel}>
						Cancel
					</Button>
					<Button type='submit' disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? 'Creating...' : 'Create Exercise'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
