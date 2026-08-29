import type { MessageCatalog } from './zh-CN'

export const en = {
  app: {
    name: 'Prelude',
    description: 'A calm beginning for everything ahead.',
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
    quickFolders: 'Quick folders',
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
  },
  settings: {
    open: 'Open settings',
    close: 'Close settings',
    title: 'Settings',
    description: 'Manage your interface preferences for Prelude.',
  },
  search: {
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
      sortFailed: 'Could not reorder the items. Try again.',
    },
  },
  defaultFolders: {
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
