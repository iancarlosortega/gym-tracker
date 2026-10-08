import { describe, expect, it } from 'vitest'
import { LAUNCH_SIZES, startupImages } from './launch-images'

describe('startupImages', () => {
  it('gives every launch size one image in device pixels', () => {
    const images = startupImages()

    expect(images).toHaveLength(LAUNCH_SIZES.length)
    expect(images).toContainEqual({
      url: '/splash/launch-1179x2556.png',
      media:
        '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    })
  })

  it('tells same-sized screens apart by their pixel ratio', () => {
    const urls = startupImages()
      .filter(({ media }) => media.startsWith('(device-width: 414px)'))
      .map(({ url }) => url)

    expect(urls).toEqual(['/splash/launch-828x1792.png', '/splash/launch-1242x2688.png'])
  })

  it('never offers two images for the same screen', () => {
    const media = startupImages().map((image) => image.media)

    expect(new Set(media).size).toBe(media.length)
  })

  it('only describes portrait screens, the one orientation the app runs in', () => {
    for (const { width, height } of LAUNCH_SIZES) {
      expect(height).toBeGreaterThan(width)
    }
  })
})
