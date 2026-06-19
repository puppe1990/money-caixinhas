import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import defaultAttributes from 'lucide-react/dist/esm/defaultAttributes.js'
import sharp from 'sharp'
import toIco from 'to-ico'

const { __iconNode } = await import('lucide-react/dist/esm/icons/piggy-bank.js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

type IconNode = Array<[string, Record<string, string>]>

function serializeIconPaths(iconNode: IconNode) {
  return iconNode
    .map(([tag, attrs]) => {
      const attributes = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')

      return `<${tag} ${attributes} />`
    })
    .join('\n    ')
}

function buildLucideSvg(options: {
  size: number
  background: string
  stroke: string
  padding: number
  cornerRadius: number
}) {
  const iconSize = options.size - options.padding * 2
  const scale = iconSize / 24
  const offset = options.padding
  const { strokeLinecap, strokeLinejoin, strokeWidth } = defaultAttributes

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" viewBox="0 0 ${options.size} ${options.size}">
  <rect width="${options.size}" height="${options.size}" rx="${options.cornerRadius}" fill="${options.background}" />
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${options.stroke}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}">
    ${serializeIconPaths(__iconNode)}
  </g>
</svg>`
}

async function writePng(path: string, svg: string, size: number) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path)
}

async function main() {
  mkdirSync(publicDir, { recursive: true })

  const appIconSvg = buildLucideSvg({
    size: 512,
    background: '#059669',
    stroke: '#ffffff',
    padding: 96,
    cornerRadius: 96,
  })

  const faviconSvg = buildLucideSvg({
    size: 32,
    background: '#059669',
    stroke: '#ffffff',
    padding: 6,
    cornerRadius: 6,
  })

  await writePng(join(publicDir, 'logo512.png'), appIconSvg, 512)
  await writePng(join(publicDir, 'logo192.png'), appIconSvg, 192)
  await writePng(join(publicDir, 'apple-touch-icon.png'), appIconSvg, 180)

  const favicon16 = await sharp(Buffer.from(faviconSvg))
    .resize(16, 16)
    .png()
    .toBuffer()
  const favicon32 = await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toBuffer()
  const favicon48 = await sharp(Buffer.from(faviconSvg))
    .resize(48, 48)
    .png()
    .toBuffer()

  writeFileSync(
    join(publicDir, 'favicon.ico'),
    await toIco([favicon16, favicon32, favicon48]),
  )

  writeFileSync(join(publicDir, 'favicon-32.png'), favicon32)

  console.log('✓ logo512.png')
  console.log('✓ logo192.png')
  console.log('✓ apple-touch-icon.png')
  console.log('✓ favicon.ico')
  console.log('✓ favicon-32.png')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
