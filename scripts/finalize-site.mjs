import assert from 'node:assert/strict'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { listFiles, localReferences, readJson, root } from './release-utils.mjs'
import { messages } from '../docs/site-messages.mjs'

const translationKeys = Object.keys(messages.en).sort()
for (const language of ['en', 'ja', 'es', 'fr', 'ru']) {
  assert.deepEqual(
    Object.keys(messages[language]).sort(),
    translationKeys,
    `${language}: incomplete website translations`,
  )
  for (const key of translationKeys)
    assert.ok(
      messages[language][key].trim(),
      `${language}: empty translation ${key}`,
    )
}

const site = join(root, 'dist-site')
const { version } = readJson(join(root, 'public/manifest.json'))
const archive = join(root, 'release', `prelude-${version}.zip`)
assert.ok(
  existsSync(archive),
  'Run pnpm release:extension before pnpm build:site',
)
mkdirSync(join(site, 'downloads'), { recursive: true })
copyFileSync(archive, join(site, 'downloads/prelude-chrome-extension.zip'))
const checksum = readFileSync(`${archive}.sha256`, 'utf8').split(/\s+/)[0]
writeFileSync(
  join(site, 'downloads/prelude-chrome-extension.zip.sha256'),
  `${checksum}  prelude-chrome-extension.zip\n`,
)
writeFileSync(join(site, '.nojekyll'), '')

for (const filename of listFiles(site).filter((file) =>
  file.endsWith('.html'),
)) {
  const html = readFileSync(join(site, filename), 'utf8')
  for (const [, key] of html.matchAll(
    /data-i18n(?:-alt|-aria-label)?="([^"]+)"/g,
  )) {
    assert.ok(
      translationKeys.includes(key),
      `${filename}: missing translation ${key}`,
    )
  }
  for (const reference of localReferences(html, filename)) {
    const target = resolve(site, reference)
    assert.ok(
      target.startsWith(`${site}${sep}`),
      `${filename}: reference escapes website`,
    )
    assert.ok(
      existsSync(target),
      `${filename}: missing local link or asset ${reference}`,
    )
  }
}
console.log(
  `Website ready in ${site}: three pages, assets, and extension ${version}.`,
)
