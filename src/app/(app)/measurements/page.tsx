'use client';

import { useState } from 'react';
import { FiLoader, FiSave, FiTrendingUp } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	useBodyMeasurements,
	useCreateBodyMeasurement,
} from '@/features/body-measurements/hooks/use-body-measurements';

export default function MeasurementsPage() {
	const [measurements, setMeasurements] = useState({
		weight: '',
		bodyFat: '',
		height: '',
		chest: '',
		waist: '',
		hips: '',
		bicep: '',
		thigh: '',
	});

	const { data: allMeasurements = [], isLoading } = useBodyMeasurements();
	const createMeasurement = useCreateBodyMeasurement();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const hasAnyMeasurement = Object.values(measurements).some(
			(value) => value.trim() !== ''
		);
		if (!hasAnyMeasurement) {
			return;
		}

		try {
			const data = Object.entries(measurements).reduce(
				(acc, [key, value]) => {
					if (value.trim() !== '') {
						(acc as Record<string, number>)[key] = parseFloat(value);
					}
					return acc;
				},
				{} as Record<string, number>
			);

			await createMeasurement.mutateAsync(data);

			// Reset form
			setMeasurements({
				weight: '',
				bodyFat: '',
				height: '',
				chest: '',
				waist: '',
				hips: '',
				bicep: '',
				thigh: '',
			});
		} catch (error) {
			console.error('Failed to create measurement:', error);
		}
	};

	const handleInputChange =
		(field: keyof typeof measurements) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			// Allow empty string or valid decimal numbers
			if (value === '' || /^\d*\.?\d*$/.test(value)) {
				setMeasurements((prev) => ({ ...prev, [field]: value }));
			}
		};

	const latestMeasurement = allMeasurements[0];

	return (
		<div className='min-h-screen bg-gray-950'>
			<header className='bg-gray-900 shadow-sm border-b border-gray-800'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between py-6'>
						<div>
							<h1 className='text-3xl font-bold text-white'>
								Body Measurements
							</h1>
							<p className='mt-1 text-sm text-gray-400'>
								Track your body measurements over time
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Add New Measurement */}
					<Card className='bg-gray-900 border-gray-800'>
						<CardHeader>
							<CardTitle className='flex items-center text-white'>
								<FiSave className='w-5 h-5 mr-2' />
								Add New Measurement
							</CardTitle>
							<CardDescription className='text-gray-400'>
								Record your current body measurements. You don't need to fill in
								all fields.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className='space-y-4'>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='weight' className='text-gray-300'>
											Weight (kg)
										</Label>
										<Input
											id='weight'
											type='text'
											value={measurements.weight}
											onChange={handleInputChange('weight')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='height' className='text-gray-300'>
											Height (cm)
										</Label>
										<Input
											id='height'
											type='text'
											value={measurements.height}
											onChange={handleInputChange('height')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='bodyFat' className='text-gray-300'>
											Body Fat (%)
										</Label>
										<Input
											id='bodyFat'
											type='text'
											value={measurements.bodyFat}
											onChange={handleInputChange('bodyFat')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='chest' className='text-gray-300'>
											Chest (cm)
										</Label>
										<Input
											id='chest'
											type='text'
											value={measurements.chest}
											onChange={handleInputChange('chest')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='waist' className='text-gray-300'>
											Waist (cm)
										</Label>
										<Input
											id='waist'
											type='text'
											value={measurements.waist}
											onChange={handleInputChange('waist')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='hips' className='text-gray-300'>
											Hips (cm)
										</Label>
										<Input
											id='hips'
											type='text'
											value={measurements.hips}
											onChange={handleInputChange('hips')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='bicep' className='text-gray-300'>
											Bicep (cm)
										</Label>
										<Input
											id='bicep'
											type='text'
											value={measurements.bicep}
											onChange={handleInputChange('bicep')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='thigh' className='text-gray-300'>
											Thigh (cm)
										</Label>
										<Input
											id='thigh'
											type='text'
											value={measurements.thigh}
											onChange={handleInputChange('thigh')}
											placeholder='0.0'
											className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
										/>
									</div>
								</div>

								<Button
									type='submit'
									disabled={createMeasurement.isPending}
									className='w-full bg-blue-600 hover:bg-blue-700 text-white'>
									{createMeasurement.isPending ? (
										<>
											<FiLoader className='w-4 h-4 mr-2 animate-spin' />
											Saving...
										</>
									) : (
										<>
											<FiSave className='w-4 h-4 mr-2' />
											Save Measurement
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Latest Measurement & History */}
					<div className='space-y-6'>
						{latestMeasurement && (
							<Card className='bg-gray-900 border-gray-800'>
								<CardHeader>
									<CardTitle className='flex items-center text-white'>
										<FiTrendingUp className='w-5 h-5 mr-2' />
										Latest Measurement
									</CardTitle>
									<CardDescription className='text-gray-400'>
										Recorded on{' '}
										{new Date(latestMeasurement.createdAt).toLocaleDateString()}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-2 gap-4 text-sm'>
										{latestMeasurement.weight && (
											<div>
												<span className='font-medium text-gray-400'>
													Weight:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.weight} kg
												</span>
											</div>
										)}
										{latestMeasurement.height && (
											<div>
												<span className='font-medium text-gray-400'>
													Height:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.height} cm
												</span>
											</div>
										)}
										{latestMeasurement.bodyFat && (
											<div>
												<span className='font-medium text-gray-400'>
													Body Fat:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.bodyFat}%
												</span>
											</div>
										)}
										{latestMeasurement.chest && (
											<div>
												<span className='font-medium text-gray-400'>
													Chest:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.chest} cm
												</span>
											</div>
										)}
										{latestMeasurement.waist && (
											<div>
												<span className='font-medium text-gray-400'>
													Waist:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.waist} cm
												</span>
											</div>
										)}
										{latestMeasurement.hips && (
											<div>
												<span className='font-medium text-gray-400'>Hips:</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.hips} cm
												</span>
											</div>
										)}
										{latestMeasurement.bicep && (
											<div>
												<span className='font-medium text-gray-400'>
													Bicep:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.bicep} cm
												</span>
											</div>
										)}
										{latestMeasurement.thigh && (
											<div>
												<span className='font-medium text-gray-400'>
													Thigh:
												</span>
												<span className='ml-2 text-white'>
													{latestMeasurement.thigh} cm
												</span>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Measurement History */}
						<Card className='bg-gray-900 border-gray-800'>
							<CardHeader>
								<CardTitle className='text-white'>
									Measurement History
								</CardTitle>
								<CardDescription className='text-gray-400'>
									Your recent body measurements
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<div className='text-center py-4'>
										<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
										<p className='mt-2 text-sm text-gray-400'>
											Loading measurements...
										</p>
									</div>
								) : allMeasurements.length === 0 ? (
									<p className='text-center text-gray-400 py-8'>
										No measurements recorded yet. Add your first measurement
										above!
									</p>
								) : (
									<div className='space-y-4 max-h-96 overflow-y-auto'>
										{allMeasurements.slice(0, 10).map((measurement, index) => (
											<div
												key={measurement.id}
												className='p-4 border border-gray-700 rounded-lg bg-gray-800'>
												<div className='flex items-center justify-between mb-2'>
													<span className='text-sm font-medium text-white'>
														Entry #{allMeasurements.length - index}
													</span>
													<span className='text-xs text-gray-400'>
														{new Date(
															measurement.createdAt
														).toLocaleDateString()}
													</span>
												</div>
												<div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-300'>
													{measurement.weight && (
														<span>Weight: {measurement.weight}kg</span>
													)}
													{measurement.bodyFat && (
														<span>BF: {measurement.bodyFat}%</span>
													)}
													{measurement.chest && (
														<span>Chest: {measurement.chest}cm</span>
													)}
													{measurement.waist && (
														<span>Waist: {measurement.waist}cm</span>
													)}
													{measurement.hips && (
														<span>Hips: {measurement.hips}cm</span>
													)}
													{measurement.bicep && (
														<span>Bicep: {measurement.bicep}cm</span>
													)}
													{measurement.thigh && (
														<span>Thigh: {measurement.thigh}cm</span>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
