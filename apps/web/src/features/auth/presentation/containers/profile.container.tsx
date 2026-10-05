'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { QueryState } from '@/components/query-state'
import { RollbackNotice } from '@/components/rollback-notice'
import { EnablePocketedAlertsUseCase } from '../../../push/application/enable-pocketed-alerts.use-case'
import { PushSubscriber } from '../../../push/infrastructure/browser-push.subscriber'
import { pushApi } from '../../../push/infrastructure/push.api'
import { PocketedAlertsContainer } from '../../../push/presentation/containers/pocketed-alerts.container'
import { usePendingSetCount } from '../../../workouts/presentation/queries'
import { SIGN_IN_PATH } from '../../application/sign-in-redirect'
import { SignOutUseCase } from '../../application/sign-out.use-case'
import { signOut } from '../../infrastructure/auth.api'
import { ProfileDetails } from '../components/profile-details'
import { useChangeDisplayUnit, useDisplayUnit, useMe } from '../queries'

export const ProfileContainer = () => {
  const client = useQueryClient()
  const me = useMe()
  const pendingSets = usePendingSetCount().data ?? 0
  const displayUnit = useDisplayUnit()
  const changeUnit = useChangeDisplayUnit()
  const enableAlerts = useMemo(
    () => new EnablePocketedAlertsUseCase(new PushSubscriber(), pushApi),
    [],
  )

  const signOutOfThisPhone = useMutation({
    // Fail at once with no network rather than pause: the user is waiting on the button.
    networkMode: 'always',
    mutationFn: () =>
      new SignOutUseCase(
        () => signOut(),
        () => client.clear(),
        // A full navigation, so nothing signed-in stays in memory.
        () => window.location.assign(SIGN_IN_PATH),
      ).execute(),
  })

  return (
    <div className="grid gap-6">
      <QueryState
        query={me}
        pending={<ListSkeleton label="Loading your account" rows={2} />}
        failed={<p role="alert">Could not reach the server, so your account cannot be shown.</p>}
      >
        {(account) => (
          <ProfileDetails
            email={account.email}
            pendingSets={pendingSets}
            signingOut={signOutOfThisPhone.isPending}
            signOutFailed={signOutOfThisPhone.isError}
            displayUnit={displayUnit}
            onChangeUnit={(unit) => changeUnit.mutate(unit)}
            unitNotice={<RollbackNotice mutation={changeUnit} className="justify-end" />}
            onSignOut={() => signOutOfThisPhone.mutate()}
          />
        )}
      </QueryState>

      <section className="grid gap-2">
        <h2 className="font-semibold text-base">Rest alerts</h2>
        <PocketedAlertsContainer gateway={pushApi} enableAlerts={enableAlerts} />
      </section>
    </div>
  )
}
