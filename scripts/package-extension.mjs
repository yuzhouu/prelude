import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { listFiles, readJson, root } from './release-utils.mjs'

const dist = join(root, 'dist')
const { version } = readJson(join(dist, 'manifest.json'))
const directory = join(root, 'release')
const filename = `prelude-${version}.zip`
const archive = join(directory, filename)
const files = listFiles(dist)
assert.ok(files.includes('manifest.json'))
mkdirSync(directory, { recursive: true })
rmSync(archive, { force: true })
execFileSync('zip', ['-X', '-q', archive, ...files], { cwd: dist })
const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' })
  .trim()
  .split('\n')
assert.deepEqual(entries.sort(), files)
assert.deepEqual(
  JSON.parse(
    execFileSync('unzip', ['-p', archive, 'manifest.json'], {
      encoding: 'utf8',
    }),
  ),
  readJson(join(dist, 'manifest.json')),
)
const sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex')
writeFileSync(`${archive}.sha256`, `${sha256}  ${filename}\n`)
console.log(`Created ${archive}\nSHA-256 ${sha256}`)
