/**
 * The iPhone screens an installed launch has a picture for, in CSS pixels.
 *
 * iOS shows a home-screen app's launch image only when one matches the
 * screen exactly; any screen missing here opens on a blank frame instead.
 * The generator in scripts/launch-images.mts renders one PNG per row, so a new
 * iPhone is a new row here and a rerun of that script.
 */
export const LAUNCH_SIZES = [
  { width: 375, height: 667, ratio: 2 }, // SE 2nd/3rd gen, 8
  { width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, 12/13 mini
  { width: 414, height: 896, ratio: 2 }, // XR, 11
  { width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { width: 390, height: 844, ratio: 3 }, // 12, 13, 14, 16e
  { width: 428, height: 926, ratio: 3 }, // 12/13 Pro Max, 14 Plus
  { width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { width: 402, height: 874, ratio: 3 }, // 16 Pro, 17, 17 Pro
  { width: 420, height: 912, ratio: 3 }, // Air
  { width: 440, height: 956, ratio: 3 }, // 16 Pro Max, 17 Pro Max
] as const

export type LaunchSize = (typeof LAUNCH_SIZES)[number]

export const launchImagePath = ({ width, height, ratio }: LaunchSize): string =>
  `/splash/launch-${width * ratio}x${height * ratio}.png`

/** Next's appleWebApp.startupImage entries: one picture per screen it fits. */
export const startupImages = (): { url: string; media: string }[] =>
  LAUNCH_SIZES.map((size) => ({
    url: launchImagePath(size),
    media: `(device-width: ${size.width}px) and (device-height: ${size.height}px) and (-webkit-device-pixel-ratio: ${size.ratio}) and (orientation: portrait)`,
  }))
