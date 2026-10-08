import type { CSSProperties } from 'react'

/** Where the launch is in its story; the motion itself lives in globals.css (Splash). */
export type SplashPhase = 'rise' | 'dock' | 'vanish' | 'fade'

/** The centre of the button the tile lands on, and its width over the tile's. */
export interface SplashDock {
  readonly x: number
  readonly y: number
  readonly scale: number
}

export interface SplashScreenProps {
  /** Null until the app has hydrated; without a phase the CSS cap clears it on its own. */
  readonly phase: SplashPhase | null
  readonly dock?: SplashDock | undefined
}

const dockVars = (dock: SplashDock): CSSProperties =>
  ({
    '--dock-x': `${dock.x}px`,
    '--dock-y': `${dock.y}px`,
    '--dock-scale': String(dock.scale),
  }) as CSSProperties

/**
 * The installed app's launch: the icon, full screen. Its first frame is the
 * iOS launch image (scripts/launch-images.mts), so the geometry here and there
 * must stay the same: the icon's 512 art drawn into a centred 300px box.
 */
export const SplashScreen = ({ phase, dock }: SplashScreenProps) => (
  <div
    className="splash"
    aria-hidden="true"
    data-phase={phase ?? undefined}
    style={dock ? dockVars(dock) : undefined}
  >
    <div className="splash-tile">
      <svg className="splash-art" viewBox="0 0 512 512" aria-hidden="true">
        <g fill="#dc9c2c">
          <rect className="splash-bar" x="50" y="342" width="52" height="210" rx="18" />
          <rect className="splash-bar" x="110" y="262" width="52" height="290" rx="18" />
          <rect className="splash-bar" x="170" y="297" width="52" height="255" rx="18" />
          <rect className="splash-bar" x="230" y="212" width="52" height="340" rx="18" />
          <rect className="splash-bar" x="290" y="152" width="52" height="400" rx="18" />
          <rect className="splash-bar" x="350" y="187" width="52" height="365" rx="18" />
          <rect className="splash-bar" x="410" y="82" width="52" height="470" rx="18" />
        </g>
        <g className="splash-lift">
          <g
            fill="#141418"
            transform="translate(256 256) scale(1.14) translate(-256 -256) rotate(-45 256 256)"
          >
            <rect x="166" y="236" width="180" height="40" rx="14" />
            <rect x="96" y="166" width="56" height="180" rx="18" />
            <rect x="140" y="190" width="34" height="132" rx="12" />
            <rect x="360" y="166" width="56" height="180" rx="18" />
            <rect x="338" y="190" width="34" height="132" rx="12" />
          </g>
        </g>
      </svg>
    </div>
  </div>
)
