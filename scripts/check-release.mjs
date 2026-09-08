import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { listFiles, readJson, root } from './release-utils.mjs'

const dist = join(root, 'dist')
const manifest = readJson(join(dist, 'manifest.json'))
assert.deepEqual(manifest, readJson(join(root, 'public/manifest.json')))
assert.equal(manifest.manifest_version, 3)
assert.match(manifest.version, /^\d+(\.\d+){0,3}$/)
assert.equal(manifest.permissions.includes('topSites'), false)
assert.ok(manifest.optional_permissions.includes('topSites'))

const references = [
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  manifest.action.default_popup,
  manifest.background.service_worker,
  manifest.chrome_url_overrides.newtab,
  'privacy.html',
]
for (const path of references)
  assert.ok(existsSync(join(dist, path)), `Missing packaged file: ${path}`)

const defaultMessages = readJson(
  join(dist, '_locales', manifest.default_locale, 'messages.json'),
)
for (const path of listFiles(join(dist, '_locales'))) {
  if (!path.endsWith('messages.json')) continue
  const messages = readJson(join(dist, '_locales', path))
  for (const key of Object.keys(defaultMessages))
    assert.ok(messages[key]?.message, `${path}: missing message ${key}`)
  assert.ok(
    messages.extensionDescription.message.length <= 132,
    `${path}: description too long`,
  )
}

const assets = readJson(join(root, 'store/assets/manifest.json'))
for (const asset of assets.assets) {
  const data = readFileSync(resolve(root, 'store/assets', asset.path))
  assert.equal(
    createHash('sha256').update(data).digest('hex'),
    asset.sha256,
    `${asset.path}: stale hash`,
  )
  assert.equal(data.readUInt32BE(16), asset.width, `${asset.path}: width`)
  assert.equal(data.readUInt32BE(20), asset.height, `${asset.path}: height`)
}

// The two policies differ only in their navigation and packaged icon path.
const normalizePolicy = (html) =>
  html
    .replaceAll('./icons/prelude.svg', './prelude.svg')
    .replaceAll(
      'href="./support.html"',
      'href="https://github.com/yuzhouu/prelude/issues"',
    )
assert.equal(
  normalizePolicy(readFileSync(join(root, 'docs/privacy.html'), 'utf8')),
  normalizePolicy(readFileSync(join(dist, 'privacy.html'), 'utf8')),
  'Public and in-extension privacy policies have diverged',
)

for (const path of listFiles(dist)) {
  assert.ok(!path.endsWith('.map'), `Unexpected source map: ${path}`)
  if (!path.endsWith('.html')) continue
  const html = readFileSync(join(dist, path), 'utf8')
  assert.ok(
    !/<script[^>]+src=["']https?:/i.test(html),
    `${path}: remote script`,
  )
}
console.log(
  `Release checks passed: MV3, localized metadata, policies, ${assets.assets.length} assets.`,
)
