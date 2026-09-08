# Chrome Web Store release pack

This directory contains the product copy and artwork for 序幕 · Prelude, a Chrome new-tab page. The current materials use the vermilion folder icon and the naming and copy defined in [Brand reference](./brand.md).

The Chinese public title is **序幕 · 新标签页**. The brand remains **序幕 · Prelude**; localized listings outside Chinese use **Prelude**.

> 一个安静的新标签页，用来整理 Chrome 书签、当前标签页和待读内容。

## Dashboard values

- Primary language: `zh_CN`
- Primary category: `Productivity`
- Homepage URL: `https://yuzhouu.github.io/prelude/`
- Privacy policy URL: `https://yuzhouu.github.io/prelude/privacy.html`
- Support URL: `https://yuzhouu.github.io/prelude/support.html`
- Store icon: `../public/icons/prelude-128.png`
- Privacy declarations: `./privacy-practices.md`
- Localized descriptions: `./listings/`

The public URLs above are built from `docs/` with `vite.pages.config.ts`. In repository Settings → Pages, choose **GitHub Actions** as the source. The `Validate and publish Prelude` workflow validates the extension, creates its ZIP, builds the website, and deploys it on each push to `main`. Pull requests run the same build without publishing. `workflow_dispatch` supports a manual retry.

## Build and release

```sh
pnpm install --frozen-lockfile
pnpm release:extension
pnpm build:site
pnpm preview:site
```

- `release:extension` runs TypeScript, ESLint, Prettier, all unit tests, the production build, and release checks before creating `release/prelude-<version>.zip` and its SHA-256 file.
- Release checks cover manifest entries, all extension locales, icon and screenshot dimensions/hashes, matching public/in-extension policies, and package file layout. ZIP contents have `manifest.json` at the root and omit hidden files.
- The website build checks local links and assets and includes the ZIP under `downloads/prelude-chrome-extension.zip`. Its relative URLs support both a repository path and a custom domain.
- Actions saves the release files as the `prelude-chrome-extension` artifact and publishes only `dist-site/` to Pages. No personal access token is needed for deployment.

Before submitting to the store, verify the installed extension using [the acceptance checklist](./acceptance.md), confirm that the public policy URL works without signing in, and complete the Store listing, Privacy practices, and Distribution fields in the developer dashboard. Publishing this website does not submit the extension to Chrome Web Store.

## Artwork

- Chinese screenshots: `./assets/screenshots/zh-CN/` — five 1280×800 PNGs
- English screenshots: `./assets/screenshots/en/` — five 1280×800 PNGs
- Small promo tile: `./assets/promo-small-440x280.png`
- Marquee promo tile: `./assets/promo-marquee-1400x560.png`
- Deterministic SVG sources: `./assets/source/`
- Asset manifest and provenance: `./assets/manifest.json`

The screenshots show the actual product UI with the repository's demonstration bookmarks and tabs. User-created bookmark names in that dataset remain Chinese even when the interface is English. Use the matching screenshot set for the Chinese and English listings; Japanese, Spanish, French, and Russian listing text is also provided, but screenshots in those languages have not been captured.

The two promo tiles use Chinese copy. SVG sources reference `/icons/prelude.svg` and `/store/assets/screenshots/zh-CN/01-bookmarks-1280x800.png`, served from the repository's Vite server. Open each SVG as a document at its specified viewport size with a 1× pixel ratio, wait for images and fonts, and export a PNG. Rendering the SVG inside an `<img>` may prevent its external image references from loading.

After changing the interface or icon, recapture the screenshots before exporting the promo tiles. Copy the Chinese bookmark screenshot to `docs/assets/bookmarks-1280x800.png` for the standalone product page, then refresh image dimensions and SHA-256 hashes in `assets/manifest.json`.

These are local release materials. The browser preview validates layout and copy; it does not validate privileged Chrome extension actions or publish the extension, listing, or GitHub Pages site. Confirm requirements in the live store dashboard before submission.
