import { ProfileContainer } from '@/features/auth/presentation/containers/profile.container'

const ProfilePage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <h1 className="font-bold text-2xl">Profile</h1>
    <ProfileContainer />
  </main>
)

export default ProfilePage
