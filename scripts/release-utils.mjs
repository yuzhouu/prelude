import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = fileURLToPath(new URL('../', import.meta.url))
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

export function listFiles(directory, prefix = '') {
  return readdirSync(join(directory, prefix), { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .flatMap((entry) => {
      const path = join(prefix, entry.name)
      if (entry.isDirectory()) return listFiles(directory, path)
      if (!entry.isFile()) throw new Error(`Unexpected non-file: ${path}`)
      return [path]
    })
    .sort()
}

export function localReferences(html, filename) {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url))
    .map((url) => {
      if (url.startsWith('/'))
        throw new Error(
          `${filename}: root-relative URL will break project Pages: ${url}`,
        )
      return join(dirname(filename), decodeURIComponent(url.split(/[?#]/)[0]))
    })
}
