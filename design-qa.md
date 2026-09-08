# Prelude brand and release-material QA

Reviewed: 2026-09-08.

## Approved identity

The brand remains **序幕 · Prelude**. Chinese public headings and the extension listing use **序幕 · 新标签页**. The original slogan is preserved verbatim:

> 一个安静的新标签页，用来整理 Chrome 书签、当前标签页和待读内容。

The current icon is a vermilion stack of folders with a white rounded plus. Its upper-left tab, short shoulder, and vertical sides follow the approved folder silhouette. `public/icons/prelude.svg` is the vector source; the website copy and all four extension PNG sizes come from that source. This review supersedes the earlier red P/bookmark design review.

## Visual review

- Product: white and warm-gray surfaces with vermilion selection, focus, links, and primary actions. Destructive actions and validation errors retain separate red tokens.
- Themes: light, dark, and system appearance; desktop at 1280×800 and narrow-screen checks at 390×844.
- Website: desktop and mobile, light and dark; loaded directly from `docs/` to verify its independent stylesheet, icon, and screenshot references.
- Screenshots: actual rendered product UI with existing repository demo bookmarks and tabs, in Chinese and English. No private browser data or fabricated UI.
- Promotional tiles: 440×280 and 1400×560 PNGs. Both show the vermilion icon, public title, and full original slogan. The larger tile includes the actual Chinese bookmark screenshot.

Reviewable assets:

- [Chinese screenshots](./store/assets/screenshots/zh-CN/)
- [English screenshots](./store/assets/screenshots/en/)
- [Small promo tile](./store/assets/promo-small-440x280.png)
- [Marquee promo tile](./store/assets/promo-marquee-1400x560.png)
- [Asset dimensions, source hashes, and provenance](./store/assets/manifest.json)
- [Naming, color, and copy reference](./store/brand.md)

## Verification

The browser material checks passed 29 assertions covering language, vermilion selection, expanded privacy disclosure, the unchanged About slogan, text bounds in both SVGs, responsive overflow, image loading, feature anchors, and support/privacy navigation. Product pages and standalone documentation had no runtime or console errors.

Opening the small promotional SVG as a standalone browser document also triggers an automatic request for an absent `/favicon.ico`. This export-only 404 was recorded separately; the SVG icon and product image load, and the exported artwork is complete.

The 23 theme checks verified readable primary/selected text, theme persistence, search, settings validation, bookmark edit and delete dialogs, mobile navigation, the capture popup, and privacy pages. Primary actions are vermilion; errors and deletion controls remain red.

Additional checks passed:

- Production Vite build and ESLint for the changed locale files.
- Formatting for changed supported text files and `git diff --check`.
- PNG dimensions, SVG XML parsing, and SHA-256 asset records.
- Matching source/built icons and Chrome locale messages.
- Matching product/website SVGs and public/website stylesheets.
- Matching homepage screenshot and its Chinese source capture.
- Six-language agreement between About copy, app descriptions, extension descriptions, and store summaries.
- Local README links and extension name/description length bounds.

## Known limits

Full-project TypeScript checking reports two existing errors: a possibly null `regular` in `src/features/tabs/tab-drag.test.ts:169`, and the `mode` union property in `src/features/tabs/tab-sortable-windows.tsx:155`. Both reproduce in an unchanged HEAD checkout. This branding change does not modify those files.

The browser captures exercise the preview and its existing demonstration dataset. They do not establish live Chrome extension API behavior or Chrome Web Store approval. Japanese, Spanish, French, and Russian descriptions are included, but screenshots are provided only in Chinese and English. No site, extension, or store listing has been published by this update.
