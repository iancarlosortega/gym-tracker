'use client';

import { useForm } from 'react-hook-form';
import { FiLoader, FiSave, FiTrendingUp } from 'react-icons/fi';
import {
	useBodyMeasurements,
	useCreateBodyMeasurement,
} from '@/features/body-measurements/hooks/use-body-measurements';
import type { MeasurementsFormData } from '@/features/body-measurements/schemas/measurements';
import { Button } from '@/features/shared/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/features/shared/components/card';
import { Input } from '@/features/shared/components/input';
import { Label } from '@/features/shared/components/label';

export default function MeasurementsPage() {
	const { data: allMeasurements = [], isLoading } = useBodyMeasurements();
	const createMeasurement = useCreateBodyMeasurement();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<MeasurementsFormData>({
		defaultValues: {
			weight: '',
			bodyFat: '',
			height: '',
			chest: '',
			waist: '',
			hips: '',
			bicep: '',
			thigh: '',
		},
		mode: 'onChange',
	});

	const onSubmit = async (data: MeasurementsFormData) => {
		// Check if at least one measurement is provided
		const hasAnyMeasurement = Object.values(data).some(
			(value) => value !== undefined && value !== ''
		);

		if (!hasAnyMeasurement) {
			console.error('At least one measurement is required');
			return;
		}

		try {
			// Convert string values to numbers and filter out empty values
			const processedData = Object.entries(data).reduce(
				(acc, [key, value]) => {
					if (value && value.trim() !== '') {
						const numValue = parseFloat(value);
						if (!Number.isNaN(numValue)) {
							(acc as Record<string, number>)[key] = numValue;
						}
					}
					return acc;
				},
				{} as Record<string, number>
			);

			await createMeasurement.mutateAsync(processedData);
			reset();
		} catch (error) {
			console.error('Failed to create measurement:', error);
		}
	};

	const latestMeasurement = allMeasurements[0];

	return (
		<div className='space-y-8'>
			<header className='bg-gradient-to-br from-primary to-primary/80 text-muted shadow-sm border-b'>
				<div className='container mx-auto'>
					<div className='flex items-center justify-between py-6'>
						<div>
							<h1 className='text-3xl font-bold'>Body Measurements</h1>
							<p className='mt-1 text-sm'>
								Track your body measurements over time
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className='container mx-auto'>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Latest Measurement Overview */}
					{latestMeasurement && (
						<div className='lg:col-span-1'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center'>
										<FiTrendingUp className='w-5 h-5 mr-2' />
										Latest Measurements
									</CardTitle>
									<CardDescription className='text-muted-foreground'>
										Your most recent body measurements
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{latestMeasurement.weight && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Weight:</span>
											<span className='font-medium'>
												{latestMeasurement.weight} lbs
											</span>
										</div>
									)}
									{latestMeasurement.bodyFat && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Body Fat:</span>
											<span className='font-medium'>
												{latestMeasurement.bodyFat}%
											</span>
										</div>
									)}
									{latestMeasurement.height && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Height:</span>
											<span className='font-medium'>
												{latestMeasurement.height} in
											</span>
										</div>
									)}
									{latestMeasurement.chest && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Chest:</span>
											<span className='font-medium'>
												{latestMeasurement.chest} in
											</span>
										</div>
									)}
									{latestMeasurement.waist && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Waist:</span>
											<span className='font-medium'>
												{latestMeasurement.waist} in
											</span>
										</div>
									)}
									{latestMeasurement.hips && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Hips:</span>
											<span className='font-medium'>
												{latestMeasurement.hips} in
											</span>
										</div>
									)}
									{latestMeasurement.bicep && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Bicep:</span>
											<span className='font-medium'>
												{latestMeasurement.bicep} in
											</span>
										</div>
									)}
									{latestMeasurement.thigh && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>Thigh:</span>
											<span className='font-medium'>
												{latestMeasurement.thigh} in
											</span>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					)}

					{/* Add New Measurement */}
					<div
						className={latestMeasurement ? 'lg:col-span-2' : 'lg:col-span-3'}>
						<Card>
							<CardHeader>
								<CardTitle>Add New Measurements</CardTitle>
								<CardDescription className='text-muted-foreground'>
									Enter your current body measurements. You don't need to fill
									all fields.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										{/* Weight */}
										<div className='space-y-2'>
											<Label htmlFor='weight'>Weight (lbs)</Label>
											<Input
												id='weight'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('weight', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.weight && (
												<p className='text-sm text-red-500'>
													{errors.weight.message}
												</p>
											)}
										</div>

										{/* Body Fat */}
										<div className='space-y-2'>
											<Label htmlFor='bodyFat'>Body Fat (%)</Label>
											<Input
												id='bodyFat'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('bodyFat', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.bodyFat && (
												<p className='text-sm text-red-500'>
													{errors.bodyFat.message}
												</p>
											)}
										</div>

										{/* Height */}
										<div className='space-y-2'>
											<Label htmlFor='height'>Height (inches)</Label>
											<Input
												id='height'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('height', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.height && (
												<p className='text-sm text-red-500'>
													{errors.height.message}
												</p>
											)}
										</div>

										{/* Chest */}
										<div className='space-y-2'>
											<Label htmlFor='chest'>Chest (inches)</Label>
											<Input
												id='chest'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('chest', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.chest && (
												<p className='text-sm text-red-500'>
													{errors.chest.message}
												</p>
											)}
										</div>

										{/* Waist */}
										<div className='space-y-2'>
											<Label htmlFor='waist'>Waist (inches)</Label>
											<Input
												id='waist'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('waist', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.waist && (
												<p className='text-sm text-red-500'>
													{errors.waist.message}
												</p>
											)}
										</div>

										{/* Hips */}
										<div className='space-y-2'>
											<Label htmlFor='hips'>Hips (inches)</Label>
											<Input
												id='hips'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('hips', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.hips && (
												<p className='text-sm text-red-500'>
													{errors.hips.message}
												</p>
											)}
										</div>

										{/* Bicep */}
										<div className='space-y-2'>
											<Label htmlFor='bicep'>Bicep (inches)</Label>
											<Input
												id='bicep'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('bicep', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.bicep && (
												<p className='text-sm text-red-500'>
													{errors.bicep.message}
												</p>
											)}
										</div>

										{/* Thigh */}
										<div className='space-y-2'>
											<Label htmlFor='thigh'>Thigh (inches)</Label>
											<Input
												id='thigh'
												type='number'
												step='0.1'
												placeholder='0.0'
												{...register('thigh', {
													pattern: {
														value: /^\d*\.?\d*$/,
														message: 'Please enter a valid number',
													},
												})}
											/>
											{errors.thigh && (
												<p className='text-sm text-red-500'>
													{errors.thigh.message}
												</p>
											)}
										</div>
									</div>

									<div className='flex justify-end pt-4'>
										<Button
											type='submit'
											disabled={createMeasurement.isPending || isSubmitting}>
											{createMeasurement.isPending || isSubmitting ? (
												<>
													<FiLoader className='w-4 h-4 animate-spin' />
													Saving...
												</>
											) : (
												<>
													<FiSave className='w-4 h-4 mr-2' />
													Save Measurements
												</>
											)}
										</Button>
									</div>

									{createMeasurement.error && (
										<div className='p-4 bg-red-900/50 border border-red-700 rounded-md'>
											<p className='text-red-200 text-sm'>
												Failed to save measurements. Please try again.
											</p>
										</div>
									)}
								</form>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Measurement History */}
				{allMeasurements.length > 0 && (
					<div className='mt-8'>
						<Card>
							<CardHeader>
								<CardTitle>Measurement History</CardTitle>
								<CardDescription className='text-muted-foreground'>
									Your body measurement records over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<div className='flex items-center justify-center py-8'>
										<FiLoader className='w-6 h-6 animate-spin text-gray-400' />
									</div>
								) : (
									<div className='space-y-4'>
										{allMeasurements.map((measurement, index) => (
											<div
												key={measurement.id}
												className='p-4 bg-gray-800 rounded-lg border border-gray-700'>
												<div className='flex items-center justify-between mb-3'>
													<span className='text-white font-medium'>
														{index === 0
															? 'Latest'
															: `${index + 1} measurements ago`}
													</span>
													<span className='text-gray-400 text-sm'>
														{new Date(
															measurement.createdAt
														).toLocaleDateString()}
													</span>
												</div>
												<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
													{measurement.weight && (
														<div>
															<span className='text-gray-400'>Weight:</span>
															<span className='text-white ml-1'>
																{measurement.weight} lbs
															</span>
														</div>
													)}
													{measurement.bodyFat && (
														<div>
															<span className='text-gray-400'>Body Fat:</span>
															<span className='text-white ml-1'>
																{measurement.bodyFat}%
															</span>
														</div>
													)}
													{measurement.height && (
														<div>
															<span className='text-gray-400'>Height:</span>
															<span className='text-white ml-1'>
																{measurement.height} in
															</span>
														</div>
													)}
													{measurement.chest && (
														<div>
															<span className='text-gray-400'>Chest:</span>
															<span className='text-white ml-1'>
																{measurement.chest} in
															</span>
														</div>
													)}
													{measurement.waist && (
														<div>
															<span className='text-gray-400'>Waist:</span>
															<span className='text-white ml-1'>
																{measurement.waist} in
															</span>
														</div>
													)}
													{measurement.hips && (
														<div>
															<span className='text-gray-400'>Hips:</span>
															<span className='text-white ml-1'>
																{measurement.hips} in
															</span>
														</div>
													)}
													{measurement.bicep && (
														<div>
															<span className='text-gray-400'>Bicep:</span>
															<span className='text-white ml-1'>
																{measurement.bicep} in
															</span>
														</div>
													)}
													{measurement.thigh && (
														<div>
															<span className='text-gray-400'>Thigh:</span>
															<span className='text-white ml-1'>
																{measurement.thigh} in
															</span>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</main>
		</div>
	);
}
