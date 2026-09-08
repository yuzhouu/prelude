import type { MessageCatalog } from './zh-CN'

export const en = {
  app: {
    name: 'Prelude',
    description:
      'A calm new tab for organizing Chrome bookmarks, open tabs, and Read later.',
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    unnamedFolder: 'Untitled folder',
    bookmarkCount_one: '{{count}} bookmark',
    bookmarkCount_other: '{{count}} bookmarks',
    childFolderCount_one: '{{count}} subfolder',
    childFolderCount_other: '{{count}} subfolders',
    tabCount_one: '{{count}} tab',
    tabCount_other: '{{count}} tabs',
    listSeparator: ' and ',
  },
  navigation: {
    quickFolders: 'Today',
    currentTabs: 'Current tabs',
    recent: 'Recently added',
    allBookmarks: 'All bookmarks',
    bookmarks: 'Bookmarks',
    folders: 'Folders',
    bookmarkNavigation: 'Bookmark navigation',
    currentLocation: 'Current location',
    openFolderNavigation: 'Open folder navigation',
    closeFolderNavigation: 'Close folder navigation',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
  },
  sync: {
    previewLabel: 'Web preview',
    previewTitle:
      'This preview uses sample data. Load the Chrome extension to see the sync scope of your bookmarks.',
    explanation:
      'Chrome manages sync. Partial sync means account and local bookmarks coexist; it does not indicate a sync failure.',

    allBookmarksStatus: 'All-bookmark sync status: {{status}}',
    unknown: {
      label: 'Status unknown',
      title:
        'This Chrome version does not expose the sync status of every bookmark',
    },
    synced: {
      label: 'All synced',
      title: 'All bookmarks are synced with your Chrome account',
    },
    partial: {
      label: 'Partially synced',
      title:
        'Some bookmarks are synced with Chrome and some are stored locally',
    },
    local: {
      label: 'Local only',
      title: 'All bookmarks are stored locally and are not synced with Chrome',
    },
  },
  theme: {
    groupLabel: 'Appearance theme',
    system: 'Use system setting',
    light: 'Light',
    dark: 'Dark',
  },
  language: {
    label: 'Language',
    groupLabel: 'Interface language',
    zhCN: 'Simplified Chinese',
    en: 'English',
    ja: 'Japanese',
    es: 'Spanish',
    fr: 'French',
    ru: 'Russian',
  },
  settings: {
    open: 'Open settings',
    close: 'Close settings',
    title: 'Settings',
    description:
      'Adjust the interface language and shortcuts, and see how Prelude handles your data.',
    shortcuts: {
      title: 'Keyboard shortcuts',
      summary: 'Customize in-page actions; Chrome manages extension commands.',
      reset: 'Restore defaults',
      change: 'Change',
      recording: 'Press a new shortcut',
      cancelHint: 'Esc to cancel',
      unassigned: 'Not set',
      search: {
        title: 'Search bookmarks and tabs',
        description: 'Open search quickly from any Prelude view.',
      },
      capture: {
        title: 'Collect current page',
        description: 'Add the current tab to Read later from any Chrome page.',
        action: 'Change in Chrome',
        extensionRequired: 'Available in the extension',
      },
      errors: {
        modifier: 'Include Ctrl, Command, or Alt in the shortcut.',
        reserved: 'The browser reserves this combination. Choose another.',
        conflict:
          'This conflicts with Collect current page. Choose another shortcut.',
      },
    },
    privacy: {
      details: 'How your data is used',

      title: 'Data and privacy',
      summary:
        'Prelude handles only the browser data needed to manage bookmarks, tabs, and Read later.',
      bookmarks:
        'Reads and changes the Chrome bookmarks and folders you manage.',
      tabs: 'Reads open-tab titles and URLs for display, search, and collection.',
      local:
        'Bookmark and tab data stays local; it is not uploaded, sold, or used for ads.',
      search:
        'Only a web search you submit is passed by Chrome to the default search provider.',
      action: 'Read the full privacy policy',
    },
    about: {
      summary: 'View the product story, version, and project links.',
      action: 'Open About',
    },
  },
  about: {
    title: 'About Prelude',
    introduction:
      'A calm new tab for organizing Chrome bookmarks, open tabs, and Read later.',
    privacyTitle: 'Your browsing space',
    privacyStatement:
      'It has no accounts, ads, or analytics. Bookmark and tab data stays in your browser, under your control.',
    links: {
      label: 'Project links',
      github: 'GitHub',
      support: 'Support and feedback',
      privacy: 'Privacy policy',
    },
    version: 'Prelude {{version}}',
  },
  capture: {
    open: 'Collect',
    openPrelude: 'Open Prelude',
    close: 'Close collection panel',
    eyebrow: 'Collection entry',
    title: 'Collect into Read later',
    description:
      'Gather loose pages first, then process and archive them during your daily review.',
    currentPage: {
      title: 'Current tab',
      empty: 'There is no page to collect in this window',
      action: 'Add to Read later',
    },
    currentWindow: {
      title: 'Current window',
      description_one: 'Save {{count}} page from this window',
      description_other: 'Save {{count}} pages from this window',
      action: 'Save window',
    },
    currentGroup: {
      title: 'Current tab group',
      description_one: '{{count}} page in “{{title}}”',
      description_other: '{{count}} pages in “{{title}}”',
      empty: 'The most recently viewed page is not in a tab group',
      action: 'Save tab group',
    },
    duplicates: {
      title_one: 'Found {{count}} duplicate URL',
      title_other: 'Found {{count}} duplicate URLs',
      description:
        'These pages are already bookmarked. Skip them or keep another copy.',
      skip: 'Skip duplicates and save',
      saveAnyway: 'Save everything anyway',
    },
    closeAfter: {
      title: 'Close original tabs after saving',
      description:
        'Only close pages saved in this capture, and remember this choice.',
    },
    saving: 'Saving…',
    failed:
      'Could not save. Check the extension’s bookmark and tab permissions.',
    extensionRequired:
      'Load this app as a Chrome extension to use the live collection entry.',
    shortcutHint: 'Use {{shortcut}} or the page context menu to collect.',
    shortcutUnassignedHint:
      'No shortcut is assigned; the page context menu is still available.',
    newTabHint:
      'On Prelude’s new tab page, Current tab uses the most recently viewed page.',
    result: {
      saved_one: 'Added {{count}} page to Read later.',
      saved_other: 'Added {{count}} pages to Read later.',
      savedAndClosed_one:
        'Saved {{count}} page and closed {{closed}} original tab.',
      savedAndClosed_other:
        'Saved {{count}} pages and closed {{closed}} original tabs.',
      savedWithSkipped_one:
        'Saved {{count}} page and skipped {{skipped}} duplicate URL.',
      savedWithSkipped_other:
        'Saved {{count}} pages and skipped {{skipped}} duplicate URLs.',
      savedCloseFailed_one:
        'Saved {{count}} page, but could not close the original tab.',
      savedCloseFailed_other:
        'Saved {{count}} pages, but could not close the original tabs.',
      allDuplicates:
        'These URLs are already bookmarked, so no copies were made.',
    },
  },
  search: {
    recentTitle: 'Recently added bookmarks',
    actionBookmark: 'Open bookmark',
    actionTab: 'Switch to tab',
    actionSearch: 'Search the web',
    actionNavigate: 'Visit URL',
    enterAction: 'Enter · {{action}}',

    trigger: 'Search',
    triggerLabel: 'Search bookmarks and tabs',
    dialogTitle: 'Search or enter an address',
    close: 'Close search',
    suggestions: 'Search suggestions',
    hintTitle: 'Search bookmarks, tabs, or the web',
    hintDescription:
      'Enter an address to visit it directly, or search everything else with your default search engine.',
    sources: 'Bookmarks, tabs, and the Chrome default search engine',
    keyboardHelp: '↑↓ Select · Enter Open · Esc Close',
    visitUrl: 'Visit address',
    searchFor: 'Search for “{{query}}”',
    defaultProvider: 'Use the Chrome default search engine',
  },
  tabs: {
    pinned: 'Pinned',
    audible: 'Playing audio',
    current: 'Current',
    emptyTitle: 'No matching tabs',
    emptyDescription:
      'New pages will appear here automatically after you open them.',
    currentWindow: 'Current window',
    window: 'Window {{number}}',
    errors: {
      sortFailed: 'Could not move the tab. The original order was restored.',
    },
    close: {
      action: 'Close the “{{title}}” tab',
      closing: 'Closing the “{{title}}” tab',
      failed: 'Could not close “{{title}}”. Click to try again',
      extensionRequired: 'Load this app as a Chrome extension to close tabs',
    },
    capture: {
      action: 'Collect “{{title}}” into Read later',
      saving: 'Collecting “{{title}}”',
      saved: '“{{title}}” was collected into Read later',
      failed: 'Could not collect “{{title}}”. Click to try again',
      bookmarked:
        '“{{title}}” is already bookmarked. Click to collect it again',
      extensionRequired:
        'Load this app as a Chrome extension to collect this page',
      unsupported: 'This type of page cannot be collected as a bookmark',
      duplicateTitle: 'This address is already bookmarked',
      duplicateDescription:
        '“{{title}}” already has a bookmark. Collecting it again will save another copy in Read later.',
      saveAnyway: 'Collect anyway',
    },
  },
  bookmarks: {
    addFolder: {
      action: 'Add folder',
      actionIn: 'Add a folder in {{parent}}',
      name: 'Folder name',
      extensionRequired: 'Load this app as a Chrome extension to add folders',
    },
    addBookmark: {
      action: 'Add bookmark',
      shortAction: 'Add',
      actionIn: 'Add a bookmark in {{folder}}',
      url: 'Bookmark address',
      urlPlaceholder: 'Paste an address',
      title: 'Bookmark title',
      titlePlaceholder: 'Title (leave blank to fetch automatically)',
      extensionRequired: 'Load this app as a Chrome extension to add bookmarks',
    },
    actions: {
      copied: 'Link copied',
      copiedShort: 'Copied',
      copy: 'Copy the link for {{title}}',
      copyShort: 'Copy link',
      openNewTab: 'Open {{title}} in a new tab',
      openNewTabShort: 'Open in a new tab',
      switchToOpenTab: 'Switch to the open tab for {{title}}',
      switchToOpenTabShort: 'Switch to open tab',
      openTabStatus: 'Open',
      edit: 'Edit {{title}}',
      editShort: 'Edit',
      delete: 'Delete {{title}}',
      deleteShort: 'Delete',
      extensionRequiredModify:
        'Load this app as a Chrome extension to make changes',
    },
    editDialog: {
      title: 'Edit bookmark',
      description:
        'Change the title or address. Saving will update your Chrome bookmarks.',
      titleLabel: 'Title',
      urlLabel: 'Address',
    },
    deleteDialog: {
      title: 'Delete bookmark?',
      description:
        '“{{title}}” will be removed from your Chrome bookmarks. This cannot be undone.',
    },
    folder: {
      collapse: 'Collapse {{title}}',
      expand: 'Expand {{title}}',
      delete: 'Delete folder {{title}}',
      deleteShort: 'Delete folder',
      extensionRequiredDelete:
        'Load this app as a Chrome extension to delete folders',
      deleteTitle: 'Delete folder “{{title}}”?',
      deleteWithContents:
        'This will also delete {{summary}} inside it. This cannot be undone.',
      deleteEmpty: 'This folder is empty. Deleting it cannot be undone.',
      deleteWithContentsAction: 'Delete folder and contents',
    },
    empty: {
      title: 'No matching bookmarks',
      description: 'Try a title, domain, or folder name.',
    },
    errors: {
      folderNameRequired: 'Enter a folder name',
      invalidUrl: 'Enter a valid address',
      addFailed: 'Could not add it. Try again.',
      saveFailed: 'Could not save your changes. Try again.',
      deleteFailed: 'Could not delete the bookmark. Try again.',
      deleteFolderFailed: 'Could not delete the folder. Try again.',
      sortFailed:
        'Could not move the bookmark. The original order was restored.',
    },
  },
  defaultFolders: {
    browseTabs: 'Browse current tabs first',
    benefit:
      'Keep everyday links, reading for later, and favorites together in Today.',

    names: {
      container: 'Prelude',
      pinned: 'Pinned',
      readLater: 'Read later',
      favorites: 'Favorites',
    },
    readyTitle: 'Your quick folders are ready',
    setupTitle: 'Set up your quick folders',
    readyDescription:
      'The folders are now in Chrome bookmarks. You can rename, move, or delete them at any time.',
    setupDescription:
      'After you confirm, these folders will be created under Chrome’s Other bookmarks. Nothing changes until you confirm.',
    previewLabel: 'Folders that will be created',
    containerDescription: 'Created under Other bookmarks',
    pinnedDescription: 'Keep frequently visited pages together',
    readLaterDescription: 'Save things you want to read later',
    favoritesDescription: 'Keep pages worth returning to',
    readyNote: 'Created. You can now use and manage them from the sidebar.',
    creating: 'Creating…',
    retry: 'Try again',
    confirm: 'Create folders',
    extensionRequired: 'Load this app as a Chrome extension to create folders.',
    createFailed:
      'Creation failed. Make sure the extension still has bookmark permission and try again.',
    privacyNote:
      'The folders are not tracked after creation; renaming, moving, and deleting remain under your control.',
  },
} satisfies MessageCatalog
