/**
 * Renders the iOS launch images: one amber frame with the icon's dumbbell per
 * screen in LAUNCH_SIZES, written to public/splash.
 *
 * Each frame must match the first frame of the in-app splash exactly (the
 * dumbbell centred in a 300px art box), or the hand-off from the system launch
 * to the web splash shows a jump. Run once after changing the table or the
 * icon, and commit the PNGs; it needs ImageMagick's `magick` and is never part
 * of a build.
 *
 *   node scripts/launch-images.mts
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LAUNCH_SIZES, launchImagePath } from '../src/features/splash/launch-images.ts'

/** The splash's art box, in CSS pixels; the icon's 512 viewBox is drawn into it. */
const ART_BOX = 300

const publicDir = fileURLToPath(new URL('../public', import.meta.url))

const frame = (width: number, height: number, ratio: number): string => {
  const box = ART_BOX * ratio
  const left = (width * ratio - box) / 2
  const top = (height * ratio - box) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * ratio}" height="${height * ratio}">
  <rect width="100%" height="100%" fill="#f2b544" />
  <g transform="translate(${left} ${top}) scale(${box / 512})">
    <g fill="#141418" transform="translate(256 256) scale(1.14) translate(-256 -256) rotate(-45 256 256)">
      <rect x="166" y="236" width="180" height="40" rx="14" />
      <rect x="96" y="166" width="56" height="180" rx="18" />
      <rect x="140" y="190" width="34" height="132" rx="12" />
      <rect x="360" y="166" width="56" height="180" rx="18" />
      <rect x="338" y="190" width="34" height="132" rx="12" />
    </g>
  </g>
</svg>`
}

mkdirSync(`${publicDir}/splash`, { recursive: true })

for (const size of LAUNCH_SIZES) {
  const out = `${publicDir}${launchImagePath(size)}`
  execFileSync('magick', ['svg:-', '-strip', `png:${out}`], {
    input: frame(size.width, size.height, size.ratio),
  })
  console.log(out)
}
