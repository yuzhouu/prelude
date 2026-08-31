# Chrome Web Store release pack

This directory contains the copy and artwork prepared for the first public release of 开篇 · Prelude.

## Dashboard values

- Primary language: `zh_CN`
- Primary category: `Productivity`
- Homepage URL: `https://yuzhouu.github.io/supposed/`
- Privacy policy URL: `https://yuzhouu.github.io/supposed/privacy.html`
- Support URL: `https://yuzhouu.github.io/supposed/support.html`
- Store icon: `../public/icons/prelude-128.png`
- Privacy declarations: `./privacy-practices.md`
- Localized descriptions: `./listings/`

The public URLs above are served from `docs/`. Before submission, push these files and enable GitHub Pages with the `main` branch `/docs` directory as its source, then open all three URLs without signing in.

## Artwork

- Screenshots: `./assets/screenshots/zh-CN/` — 1280×800 PNG, real rendered product UI
- Small promo tile: `./assets/promo-small-440x280.png`
- Marquee promo tile: `./assets/promo-marquee-1400x560.png`
- Deterministic SVG sources: `./assets/source/`
- Asset manifest and provenance: `./assets/manifest.json`

The screenshots are suitable as global screenshots. The listing copy is localized for every locale shipped in the extension. The promo video field can remain empty unless the live dashboard marks it as required; if a video is later added, it should show the same product behavior and privacy statement as these assets.
