import type { MessageCatalog } from './zh-CN'

export const ja = {
  app: {
    name: 'Prelude',
    description:
      'Chromeのブックマーク、開いているタブ、あとで読む項目を静かな新しいタブで管理。ブックマークとタブのデータは端末内で処理します。',
  },
  common: {
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    unnamedFolder: '名称未設定のフォルダ',
    bookmarkCount_one: '{{count}}件のブックマーク',
    bookmarkCount_other: '{{count}}件のブックマーク',
    childFolderCount_one: '{{count}}個のサブフォルダ',
    childFolderCount_other: '{{count}}個のサブフォルダ',
    tabCount_one: '{{count}}個のタブ',
    tabCount_other: '{{count}}個のタブ',
    listSeparator: 'と',
  },
  navigation: {
    quickFolders: '今日',
    currentTabs: '現在のタブ',
    recent: '最近追加した項目',
    allBookmarks: 'すべてのブックマーク',
    bookmarks: 'ブックマーク',
    folders: 'フォルダ',
    bookmarkNavigation: 'ブックマークナビゲーション',
    currentLocation: '現在の場所',
    openFolderNavigation: 'フォルダナビゲーションを開く',
    closeFolderNavigation: 'フォルダナビゲーションを閉じる',
    collapseSidebar: 'サイドバーを折りたたむ',
    expandSidebar: 'サイドバーを展開する',
  },
  sync: {
    previewLabel: 'ウェブプレビュー',
    previewTitle:
      'サンプルデータを表示しています。Chrome 拡張機能では実際のブックマークの同期範囲を表示します。',
    explanation:
      '同期は Chrome が管理します。一部同期はアカウントとローカルのブックマークが混在している状態で、同期エラーではありません。',

    allBookmarksStatus: 'すべてのブックマークの同期状態：{{status}}',
    unknown: {
      label: '状態不明',
      title:
        'このバージョンのChromeでは、すべてのブックマークの同期状態を確認できません',
    },
    synced: {
      label: 'すべて同期済み',
      title: 'すべてのブックマークがChromeアカウントと同期されています',
    },
    partial: {
      label: '一部同期済み',
      title:
        '一部のブックマークはChromeと同期され、残りはローカルに保存されています',
    },
    local: {
      label: 'ローカルのみ',
      title:
        'すべてのブックマークがローカルに保存され、Chromeとは同期されていません',
    },
  },
  theme: {
    groupLabel: '外観テーマ',
    system: 'システム設定を使用',
    light: 'ライト',
    dark: 'ダーク',
  },
  language: {
    label: '言語',
    groupLabel: '表示言語',
    zhCN: '簡体字中国語',
    en: '英語',
    ja: '日本語',
    es: 'スペイン語',
    fr: 'フランス語',
    ru: 'ロシア語',
  },
  settings: {
    open: '設定を開く',
    close: '設定を閉じる',
    title: '設定',
    description:
      '表示言語とショートカットを調整し、Preludeがデータをどのように扱うか確認できます。',
    shortcuts: {
      title: 'キーボードショートカット',
      summary:
        'ページ内操作を変更できます。拡張機能のコマンドはChromeが管理します。',
      reset: '初期設定に戻す',
      change: '変更',
      recording: '新しいショートカットを入力',
      cancelHint: 'Escでキャンセル',
      unassigned: '未設定',
      search: {
        title: 'ブックマークとタブを検索',
        description: 'Preludeのどの画面からでも検索をすぐに開きます。',
      },
      capture: {
        title: '現在のページを収集',
        description:
          'Chromeの任意のページから現在のタブを「後で読む」に追加します。',
        action: 'Chromeで変更',
        extensionRequired: '拡張機能で変更できます',
      },
      errors: {
        modifier: 'Ctrl、Command、またはAltを同時に押してください。',
        reserved:
          'この組み合わせはブラウザが使用します。別のキーを選んでください。',
        conflict:
          '「現在のページを収集」と重複しています。別のキーを選んでください。',
      },
    },
    privacy: {
      details: 'データの利用方法',

      title: 'データとプライバシー',
      summary:
        'Preludeは、ブックマーク、タブ、「後で読む」の管理に必要なブラウザデータだけを処理します。',
      bookmarks:
        'ユーザーが管理するChromeのブックマークとフォルダを読み取り、変更します。',
      tabs: '表示、検索、収集のために、開いているタブのタイトルとURLを読み取ります。',
      local:
        'ブックマークとタブのデータは端末内で処理され、アップロード、販売、広告利用は行いません。',
      search:
        'ユーザーが実行したウェブ検索だけが、Chromeから既定の検索プロバイダへ渡されます。',
      action: 'プライバシーポリシーを読む',
    },
    about: {
      summary: '製品の説明、バージョン、プロジェクトリンクを確認します。',
      action: '概要を開く',
    },
  },
  about: {
    title: 'Preludeについて',
    introduction:
      'Chromeのブックマーク、開いているタブ、あとで読む項目を整理するための静かな新しいタブです。',
    privacyTitle: 'あなたのブラウジング空間',
    privacyStatement:
      'アカウント、広告、分析ツールはありません。ブックマークとタブのデータはブラウザ内にとどまり、あなたが管理できます。',
    links: {
      label: 'プロジェクトリンク',
      github: 'GitHub',
      support: 'サポートとフィードバック',
      privacy: 'プライバシーポリシー',
    },
    version: 'Prelude {{version}}',
  },
  capture: {
    open: '収集',
    openPrelude: 'Preludeを開く',
    close: '収集パネルを閉じる',
    eyebrow: '収集メニュー',
    title: '「後で読む」に収集',
    description:
      '気になるページをいったん集め、毎日の閲覧時に整理・保存できます。',
    currentPage: {
      title: '現在のタブ',
      empty: 'このウィンドウには収集できるページがありません',
      action: '「後で読む」に追加',
    },
    currentWindow: {
      title: '現在のウィンドウ',
      description_one: 'このウィンドウの{{count}}ページを保存',
      description_other: 'このウィンドウの{{count}}ページを保存',
      action: 'ウィンドウを保存',
    },
    currentGroup: {
      title: '現在のタブグループ',
      description_one: '「{{title}}」内の{{count}}ページ',
      description_other: '「{{title}}」内の{{count}}ページ',
      empty: '最後に表示したページはタブグループに属していません',
      action: 'タブグループを保存',
    },
    duplicates: {
      title_one: '{{count}}件の重複URLが見つかりました',
      title_other: '{{count}}件の重複URLが見つかりました',
      description:
        'これらのページはすでにブックマークされています。スキップするか、別のコピーを保存できます。',
      skip: '重複を除いて保存',
      saveAnyway: 'すべて保存',
    },
    closeAfter: {
      title: '保存後に元のタブを閉じる',
      description:
        '今回正常に保存されたページだけを閉じ、この設定を記憶します。',
    },
    saving: '保存中…',
    failed:
      '保存できませんでした。拡張機能にブックマークとタブの権限があることを確認してください。',
    extensionRequired:
      '実際の収集機能を使用するには、Chrome拡張機能として読み込んでください。',
    shortcutHint:
      '{{shortcut}}、またはページのコンテキストメニューから収集できます。',
    shortcutUnassignedHint:
      'ショートカットは未設定です。ページのコンテキストメニューから収集できます。',
    newTabHint:
      'Preludeの新しいタブページでは、「現在のタブ」に直前に表示したページが使われます。',
    result: {
      saved_one: '{{count}}ページを「後で読む」に追加しました。',
      saved_other: '{{count}}ページを「後で読む」に追加しました。',
      savedAndClosed_one:
        '{{count}}ページを保存し、元のタブを{{closed}}個閉じました。',
      savedAndClosed_other:
        '{{count}}ページを保存し、元のタブを{{closed}}個閉じました。',
      savedWithSkipped_one:
        '{{count}}ページを保存し、重複URLを{{skipped}}件スキップしました。',
      savedWithSkipped_other:
        '{{count}}ページを保存し、重複URLを{{skipped}}件スキップしました。',
      savedCloseFailed_one:
        '{{count}}ページを保存しましたが、元のタブを閉じられませんでした。',
      savedCloseFailed_other:
        '{{count}}ページを保存しましたが、元のタブを閉じられませんでした。',
      allDuplicates:
        'これらのURLはすでにブックマークされているため、コピーは作成されませんでした。',
    },
  },
  search: {
    recentTitle: '最近追加したブックマーク',
    actionBookmark: 'ブックマークを開く',
    actionTab: 'タブに切り替え',
    actionSearch: 'ウェブを検索',
    actionNavigate: 'URLに移動',
    enterAction: 'Enter · {{action}}',

    trigger: '検索',
    triggerLabel: 'ブックマークとタブを検索',
    dialogTitle: '検索またはアドレスを入力',
    close: '検索を閉じる',
    suggestions: '検索候補',
    hintTitle: 'ブックマーク、タブ、ウェブを検索',
    hintDescription:
      'アドレスを入力すると直接開き、それ以外は既定の検索エンジンで検索します。',
    sources: 'ブックマーク、タブ、Chromeの既定の検索エンジン',
    keyboardHelp: '↑↓ 選択 · Enter 開く · Esc 閉じる',
    visitUrl: 'アドレスを開く',
    searchFor: '「{{query}}」を検索',
    defaultProvider: 'Chromeの既定の検索エンジンを使用',
  },
  tabs: {
    pinned: '固定済み',
    audible: '音声を再生中',
    current: '現在',
    emptyTitle: '一致するタブがありません',
    emptyDescription: '新しいページを開くと、ここに自動的に表示されます。',
    currentWindow: '現在のウィンドウ',
    window: 'ウィンドウ{{number}}',
    errors: {
      sortFailed: 'タブを移動できませんでした。元の順序に戻しました。',
    },
    close: {
      action: '「{{title}}」タブを閉じる',
      closing: '「{{title}}」タブを閉じています',
      failed: '「{{title}}」を閉じられませんでした。クリックして再試行',
      extensionRequired:
        'タブを閉じるには、Chrome拡張機能として読み込んでください',
    },
    capture: {
      action: '「{{title}}」を「後で読む」に収集',
      saving: '「{{title}}」を収集中',
      saved: '「{{title}}」を「後で読む」に収集しました',
      failed: '「{{title}}」を収集できませんでした。クリックして再試行',
      bookmarked:
        '「{{title}}」はすでにブックマークされています。クリックすると再度収集できます',
      extensionRequired:
        'このページを収集するには、Chrome拡張機能として読み込んでください',
      unsupported: 'この種類のページはブックマークとして収集できません',
      duplicateTitle: 'このアドレスはすでにブックマークされています',
      duplicateDescription:
        '「{{title}}」にはすでにブックマークがあります。もう一度収集すると、「後で読む」に別のコピーが保存されます。',
      saveAnyway: 'そのまま収集',
    },
  },
  bookmarks: {
    addFolder: {
      action: 'フォルダを追加',
      actionIn: '{{parent}}にフォルダを追加',
      name: 'フォルダ名',
      extensionRequired:
        'フォルダを追加するには、Chrome拡張機能として読み込んでください',
    },
    addBookmark: {
      action: 'ブックマークを追加',
      shortAction: '追加',
      actionIn: '{{folder}}にブックマークを追加',
      url: 'ブックマークのアドレス',
      urlPlaceholder: 'アドレスを貼り付け',
      title: 'ブックマークのタイトル',
      titlePlaceholder: 'タイトル（空欄の場合は自動取得）',
      extensionRequired:
        'ブックマークを追加するには、Chrome拡張機能として読み込んでください',
    },
    actions: {
      copied: 'リンクをコピーしました',
      copiedShort: 'コピー済み',
      copy: '{{title}}のリンクをコピー',
      copyShort: 'リンクをコピー',
      openNewTab: '{{title}}を新しいタブで開く',
      openNewTabShort: '新しいタブで開く',
      switchToOpenTab: '開いている{{title}}のタブに切り替える',
      switchToOpenTabShort: '開いているタブに切り替える',
      openTabStatus: '開いている',
      edit: '{{title}}を編集',
      editShort: '編集',
      delete: '{{title}}を削除',
      deleteShort: '削除',
      extensionRequiredModify:
        '変更するには、Chrome拡張機能として読み込んでください',
    },
    editDialog: {
      title: 'ブックマークを編集',
      description:
        'タイトルまたはアドレスを変更します。保存するとChromeブックマークが更新されます。',
      titleLabel: 'タイトル',
      urlLabel: 'アドレス',
    },
    deleteDialog: {
      title: 'ブックマークを削除しますか？',
      description:
        '「{{title}}」はChromeブックマークから削除されます。この操作は元に戻せません。',
    },
    folder: {
      collapse: '{{title}}を折りたたむ',
      expand: '{{title}}を展開する',
      delete: 'フォルダ「{{title}}」を削除',
      deleteShort: 'フォルダを削除',
      extensionRequiredDelete:
        'フォルダを削除するには、Chrome拡張機能として読み込んでください',
      deleteTitle: 'フォルダ「{{title}}」を削除しますか？',
      deleteWithContents:
        '中にある{{summary}}も削除されます。この操作は元に戻せません。',
      deleteEmpty: 'このフォルダは空です。削除すると元に戻せません。',
      deleteWithContentsAction: 'フォルダと内容を削除',
    },
    empty: {
      title: '一致するブックマークがありません',
      description: 'タイトル、ドメイン、フォルダ名で検索してみてください。',
    },
    errors: {
      folderNameRequired: 'フォルダ名を入力してください',
      invalidUrl: '有効なアドレスを入力してください',
      addFailed: '追加できませんでした。もう一度お試しください。',
      saveFailed: '変更を保存できませんでした。もう一度お試しください。',
      deleteFailed:
        'ブックマークを削除できませんでした。もう一度お試しください。',
      deleteFolderFailed:
        'フォルダを削除できませんでした。もう一度お試しください。',
      sortFailed: 'ブックマークを移動できませんでした。元の順序に戻しました。',
    },
  },
  defaultFolders: {
    browseTabs: '先に現在のタブを見る',
    benefit:
      'よく使うページ、後で読むページ、お気に入りを「今日」から開けます。',

    names: {
      container: 'Prelude',
      pinned: '固定',
      readLater: '後で読む',
      favorites: 'お気に入り',
    },
    readyTitle: 'クイックフォルダの準備ができました',
    setupTitle: 'クイックフォルダを設定',
    readyDescription:
      'フォルダがChromeブックマークに追加されました。いつでも名前変更、移動、削除できます。',
    setupDescription:
      '確認すると、Chromeの「その他のブックマーク」に以下のフォルダが作成されます。確認するまで変更は行われません。',
    previewLabel: '作成されるフォルダ',
    containerDescription: '「その他のブックマーク」に作成',
    pinnedDescription: 'よく見るページをまとめて保存',
    readLaterDescription: 'あとで読みたいページを保存',
    favoritesDescription: '何度も見返したいページを保存',
    readyNote: '作成しました。サイドバーから使用・管理できます。',
    creating: '作成中…',
    retry: '再試行',
    confirm: 'フォルダを作成',
    extensionRequired: '作成するには、Chrome拡張機能として読み込んでください。',
    createFailed:
      '作成できませんでした。拡張機能にブックマークの権限があることを確認して、もう一度お試しください。',
    privacyNote:
      '作成後にフォルダを追跡することはありません。名前変更、移動、削除は自由に行えます。',
  },
} satisfies MessageCatalog
