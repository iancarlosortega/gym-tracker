'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
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
import { useCreateExercise } from '@/hooks/use-exercises';

interface AddExerciseDialogProps {
	trigger?: React.ReactNode;
}

export function AddExerciseDialog({ trigger }: AddExerciseDialogProps) {
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		type: '',
		equipment: '',
		primaryMuscleGroup: '',
		secondaryMuscleGroups: [] as { id: string; value: string }[],
		instructions: '',
		videoUrl: '',
		imageUrl: '',
	});

	const createExercise = useCreateExercise();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createExercise.mutateAsync({
				...formData,
				type: formData.type as
					| 'strength'
					| 'cardio'
					| 'flexibility'
					| 'balance',
				equipment: formData.equipment as
					| 'barbell'
					| 'dumbbell'
					| 'machine'
					| 'cable'
					| 'bodyweight'
					| 'resistance_band'
					| 'kettlebell'
					| 'medicine_ball'
					| 'treadmill'
					| 'bike'
					| 'rowing_machine'
					| 'other',
				primaryMuscleGroup: formData.primaryMuscleGroup as
					| 'chest'
					| 'back'
					| 'shoulders'
					| 'biceps'
					| 'triceps'
					| 'forearms'
					| 'core'
					| 'glutes'
					| 'quadriceps'
					| 'hamstrings'
					| 'calves'
					| 'full_body',
				secondaryMuscleGroups: formData.secondaryMuscleGroups
					.map((group) => group.value)
					.filter(Boolean),
				videoUrl: formData.videoUrl || undefined,
				imageUrl: formData.imageUrl || undefined,
			});

			// Reset form and close dialog
			setFormData({
				name: '',
				description: '',
				type: '',
				equipment: '',
				primaryMuscleGroup: '',
				secondaryMuscleGroups: [],
				instructions: '',
				videoUrl: '',
				imageUrl: '',
			});
			setOpen(false);
		} catch (error) {
			console.error('Failed to create exercise:', error);
		}
	};

	const handleSecondaryMuscleGroupChange = (value: string, index: number) => {
		const newSecondaryMuscleGroups = [...formData.secondaryMuscleGroups];
		newSecondaryMuscleGroups[index] = {
			...newSecondaryMuscleGroups[index],
			value,
		};
		setFormData({
			...formData,
			secondaryMuscleGroups: newSecondaryMuscleGroups,
		});
	};

	const addSecondaryMuscleGroup = () => {
		setFormData({
			...formData,
			secondaryMuscleGroups: [
				...formData.secondaryMuscleGroups,
				{ id: `secondary-${Date.now()}`, value: '' },
			],
		});
	};

	const removeSecondaryMuscleGroup = (index: number) => {
		const newSecondaryMuscleGroups = formData.secondaryMuscleGroups.filter(
			(_, i) => i !== index
		);
		setFormData({
			...formData,
			secondaryMuscleGroups: newSecondaryMuscleGroups,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className='bg-blue-600 hover:bg-blue-700'>
						<Plus className='w-4 h-4 mr-2' />
						Add Exercise
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='sm:max-w-[600px] bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-white'>Add New Exercise</DialogTitle>
					<DialogDescription className='text-gray-400'>
						Create a new custom exercise for your workout library.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{/* Exercise Name */}
						<div className='space-y-2'>
							<Label htmlFor='name' className='text-gray-300'>
								Exercise Name *
							</Label>
							<Input
								id='name'
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder='e.g., Bench Press'
								className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
								required
							/>
						</div>

						{/* Type */}
						<div className='space-y-2'>
							<Label className='text-gray-300'>Type *</Label>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									setFormData({ ...formData, type: value })
								}
								required>
								<SelectTrigger className='bg-gray-800 border-gray-700 text-white'>
									<SelectValue placeholder='Select type' />
								</SelectTrigger>
								<SelectContent className='bg-gray-800 border-gray-700'>
									<SelectItem
										value='strength'
										className='text-white focus:bg-gray-700'>
										Strength
									</SelectItem>
									<SelectItem
										value='cardio'
										className='text-white focus:bg-gray-700'>
										Cardio
									</SelectItem>
									<SelectItem
										value='flexibility'
										className='text-white focus:bg-gray-700'>
										Flexibility
									</SelectItem>
									<SelectItem
										value='balance'
										className='text-white focus:bg-gray-700'>
										Balance
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Equipment */}
						<div className='space-y-2'>
							<Label className='text-gray-300'>Equipment *</Label>
							<Select
								value={formData.equipment}
								onValueChange={(value) =>
									setFormData({ ...formData, equipment: value })
								}
								required>
								<SelectTrigger className='bg-gray-800 border-gray-700 text-white'>
									<SelectValue placeholder='Select equipment' />
								</SelectTrigger>
								<SelectContent className='bg-gray-800 border-gray-700'>
									<SelectItem
										value='barbell'
										className='text-white focus:bg-gray-700'>
										Barbell
									</SelectItem>
									<SelectItem
										value='dumbbell'
										className='text-white focus:bg-gray-700'>
										Dumbbell
									</SelectItem>
									<SelectItem
										value='machine'
										className='text-white focus:bg-gray-700'>
										Machine
									</SelectItem>
									<SelectItem
										value='cable'
										className='text-white focus:bg-gray-700'>
										Cable
									</SelectItem>
									<SelectItem
										value='bodyweight'
										className='text-white focus:bg-gray-700'>
										Bodyweight
									</SelectItem>
									<SelectItem
										value='resistance_band'
										className='text-white focus:bg-gray-700'>
										Resistance Band
									</SelectItem>
									<SelectItem
										value='kettlebell'
										className='text-white focus:bg-gray-700'>
										Kettlebell
									</SelectItem>
									<SelectItem
										value='medicine_ball'
										className='text-white focus:bg-gray-700'>
										Medicine Ball
									</SelectItem>
									<SelectItem
										value='treadmill'
										className='text-white focus:bg-gray-700'>
										Treadmill
									</SelectItem>
									<SelectItem
										value='bike'
										className='text-white focus:bg-gray-700'>
										Bike
									</SelectItem>
									<SelectItem
										value='rowing_machine'
										className='text-white focus:bg-gray-700'>
										Rowing Machine
									</SelectItem>
									<SelectItem
										value='other'
										className='text-white focus:bg-gray-700'>
										Other
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Primary Muscle Group */}
						<div className='space-y-2'>
							<Label className='text-gray-300'>Primary Muscle Group *</Label>
							<Select
								value={formData.primaryMuscleGroup}
								onValueChange={(value) =>
									setFormData({ ...formData, primaryMuscleGroup: value })
								}
								required>
								<SelectTrigger className='bg-gray-800 border-gray-700 text-white'>
									<SelectValue placeholder='Select muscle group' />
								</SelectTrigger>
								<SelectContent className='bg-gray-800 border-gray-700'>
									<SelectItem
										value='chest'
										className='text-white focus:bg-gray-700'>
										Chest
									</SelectItem>
									<SelectItem
										value='back'
										className='text-white focus:bg-gray-700'>
										Back
									</SelectItem>
									<SelectItem
										value='shoulders'
										className='text-white focus:bg-gray-700'>
										Shoulders
									</SelectItem>
									<SelectItem
										value='biceps'
										className='text-white focus:bg-gray-700'>
										Biceps
									</SelectItem>
									<SelectItem
										value='triceps'
										className='text-white focus:bg-gray-700'>
										Triceps
									</SelectItem>
									<SelectItem
										value='forearms'
										className='text-white focus:bg-gray-700'>
										Forearms
									</SelectItem>
									<SelectItem
										value='core'
										className='text-white focus:bg-gray-700'>
										Core
									</SelectItem>
									<SelectItem
										value='glutes'
										className='text-white focus:bg-gray-700'>
										Glutes
									</SelectItem>
									<SelectItem
										value='quadriceps'
										className='text-white focus:bg-gray-700'>
										Quadriceps
									</SelectItem>
									<SelectItem
										value='hamstrings'
										className='text-white focus:bg-gray-700'>
										Hamstrings
									</SelectItem>
									<SelectItem
										value='calves'
										className='text-white focus:bg-gray-700'>
										Calves
									</SelectItem>
									<SelectItem
										value='full_body'
										className='text-white focus:bg-gray-700'>
										Full Body
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<Label htmlFor='description' className='text-gray-300'>
							Description
						</Label>
						<Input
							id='description'
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder='Brief description of the exercise'
							className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
						/>
					</div>

					{/* Secondary Muscle Groups */}
					<div className='space-y-2'>
						<Label className='text-gray-300'>Secondary Muscle Groups</Label>
						{formData.secondaryMuscleGroups.map((group, index) => (
							<div key={group.id} className='flex gap-2'>
								<Select
									value={group.value}
									onValueChange={(value) =>
										handleSecondaryMuscleGroupChange(value, index)
									}>
									<SelectTrigger className='bg-gray-800 border-gray-700 text-white'>
										<SelectValue placeholder='Select muscle group' />
									</SelectTrigger>
									<SelectContent className='bg-gray-800 border-gray-700'>
										<SelectItem
											value='chest'
											className='text-white focus:bg-gray-700'>
											Chest
										</SelectItem>
										<SelectItem
											value='back'
											className='text-white focus:bg-gray-700'>
											Back
										</SelectItem>
										<SelectItem
											value='shoulders'
											className='text-white focus:bg-gray-700'>
											Shoulders
										</SelectItem>
										<SelectItem
											value='biceps'
											className='text-white focus:bg-gray-700'>
											Biceps
										</SelectItem>
										<SelectItem
											value='triceps'
											className='text-white focus:bg-gray-700'>
											Triceps
										</SelectItem>
										<SelectItem
											value='forearms'
											className='text-white focus:bg-gray-700'>
											Forearms
										</SelectItem>
										<SelectItem
											value='core'
											className='text-white focus:bg-gray-700'>
											Core
										</SelectItem>
										<SelectItem
											value='glutes'
											className='text-white focus:bg-gray-700'>
											Glutes
										</SelectItem>
										<SelectItem
											value='quadriceps'
											className='text-white focus:bg-gray-700'>
											Quadriceps
										</SelectItem>
										<SelectItem
											value='hamstrings'
											className='text-white focus:bg-gray-700'>
											Hamstrings
										</SelectItem>
										<SelectItem
											value='calves'
											className='text-white focus:bg-gray-700'>
											Calves
										</SelectItem>
										<SelectItem
											value='full_body'
											className='text-white focus:bg-gray-700'>
											Full Body
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => removeSecondaryMuscleGroup(index)}
									className='border-gray-700 text-gray-300 hover:bg-gray-800'>
									Remove
								</Button>
							</div>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={addSecondaryMuscleGroup}
							className='border-gray-700 text-gray-300 hover:bg-gray-800'>
							Add Secondary Muscle Group
						</Button>
					</div>

					{/* Instructions */}
					<div className='space-y-2'>
						<Label htmlFor='instructions' className='text-gray-300'>
							Instructions
						</Label>
						<Textarea
							id='instructions'
							value={formData.instructions}
							onChange={(e) =>
								setFormData({ ...formData, instructions: e.target.value })
							}
							placeholder='Step-by-step instructions for performing the exercise'
							className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]'
						/>
					</div>

					{/* URLs */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='videoUrl' className='text-gray-300'>
								Video URL
							</Label>
							<Input
								id='videoUrl'
								type='url'
								value={formData.videoUrl}
								onChange={(e) =>
									setFormData({ ...formData, videoUrl: e.target.value })
								}
								placeholder='https://example.com/video'
								className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='imageUrl' className='text-gray-300'>
								Image URL
							</Label>
							<Input
								id='imageUrl'
								type='url'
								value={formData.imageUrl}
								onChange={(e) =>
									setFormData({ ...formData, imageUrl: e.target.value })
								}
								placeholder='https://example.com/image.jpg'
								className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setOpen(false)}
							className='border-gray-700 text-gray-300 hover:bg-gray-800'>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={createExercise.isPending}
							className='bg-blue-600 hover:bg-blue-700'>
							{createExercise.isPending ? 'Creating...' : 'Create Exercise'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
