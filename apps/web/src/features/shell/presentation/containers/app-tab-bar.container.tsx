'use client'

import { usePathname } from 'next/navigation'
import { TabBar } from '../components/tab-bar'

/** The tab bar, told where the user is. */
export const AppTabBarContainer = () => <TabBar pathname={usePathname()} />
