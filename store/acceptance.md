# Installed-extension acceptance

Build with `pnpm release:extension` and load `dist/` into a clean Chrome profile. Use disposable bookmarks and tabs; preview/demo data is not evidence of Chrome API behavior.

- New installation: the new-tab override loads, first-run folder creation requires confirmation, and ordinary bookmarks remain accessible.
- Bookmarks: create, edit, move between folders, and delete a test bookmark; confirm each change in Chrome's bookmark tree after reload.
- Tabs: reorder within a window and move between windows; check Chrome's real tab order, pinned boundaries, and grouped-tab restrictions.
- Capture: save a page, window, and group through the popup; verify duplicates are skipped, tab order is preserved, and Close after saving closes only saved tabs.
- Permission: frequently visited sites starts off; accept and reject the real Chrome permission prompt; disable and reload; remove permission externally and confirm the list disappears.
- Background: stop the service worker, then capture again and resolve an automatic bookmark title to verify restart behavior.
- Search and navigation: search real bookmarks/tabs, open an explicit URL, use Chrome's default search provider, and open Prelude from the popup.
- Entry points: invoke capture from the toolbar, context menu, and keyboard shortcut; confirm local notifications and errors.
- Persistence: reload the extension and restart Chrome; verify preferences, bookmark data, and permission state.
- Release: open the public homepage, support and privacy pages without signing in; download the ZIP, validate its SHA-256, and inspect its root manifest.

Automated unit/build checks cover data projection and packaging. They do not replace testing browser permission prompts, OS shortcuts, notifications, or store review.
