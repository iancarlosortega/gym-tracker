import { CatalogSegments } from '@/features/catalog/presentation/components/catalog-segments'
import { ExercisesContainer } from '@/features/catalog/presentation/containers/exercises.container'

const ExercisesPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <h1 className="font-bold text-2xl">Exercises</h1>
    <CatalogSegments pathname="/exercises" />
    <ExercisesContainer />
  </main>
)

export default ExercisesPage
