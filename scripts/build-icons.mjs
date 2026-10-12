// Builds the web icons and logos from the brand masters in public/brand/.
//   npm run icons
// Uses the @4x PNGs: the brand SVGs draw the tulip gradient with an embedded
// HTML element (Figma export), which favicons and home-screen icons don't render.

import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const BRAND = 'public/brand'
const OUT = 'public'
const TRANS = `${BRAND}/BoA-trans@4x.png` // tulip on transparent
const TILE = `${BRAND}/BoA-dark@4x.png` // tulip on navy, full bleed
const LOCKUP = `${BRAND}/BoA lockup@4x.png` // tulip over navy "Bank of Allen"
const NAVY = [0x12, 0x1e, 0x3d]
const IVORY = [0xff, 0xfc, 0xf4]

const png = (src, size, name) =>
  sharp(src).resize(size, size).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}`).then(() => console.log(name))

await png(TRANS, 32, 'favicon-32.png')
await png(TRANS, 64, 'brand-mark.png') // sidebar mark, shown at 32px
await png(TILE, 180, 'apple-touch-icon.png') // iOS rounds the corners itself
await png(TILE, 192, 'icon-192.png')
await png(TILE, 512, 'icon-512.png')

// Lockup at 2× of its ~220px display width, plus a dark-mode copy with ivory lettering
// (the navy wordmark is the only navy in the file, so recolor pixels close to it).
const width = 660
await sharp(LOCKUP).resize({ width }).png({ compressionLevel: 9 }).toFile(`${OUT}/lockup.png`)
console.log('lockup.png')
const { data, info } = await sharp(LOCKUP).resize({ width }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
for (let i = 0; i < data.length; i += 4) {
  const d = Math.abs(data[i] - NAVY[0]) + Math.abs(data[i + 1] - NAVY[1]) + Math.abs(data[i + 2] - NAVY[2])
  if (d < 60) [data[i], data[i + 1], data[i + 2]] = IVORY
}
await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(`${OUT}/lockup-dark.png`)
console.log('lockup-dark.png')

writeFileSync(`${OUT}/site.webmanifest`, JSON.stringify({
  name: 'Bank of Allen',
  short_name: 'Bank of Allen',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#121E3D',
  background_color: '#FFFCF4',
  display: 'standalone',
  start_url: '/',
}, null, 2) + '\n')
console.log('site.webmanifest')
