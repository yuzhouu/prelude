// Website copy only. The extension keeps its own locale catalog and preferences.
export const messages = {
  'zh-CN': {},
  en: {
    brand: 'Prelude',
    skip: 'Skip to content',
    homeLabel: 'Prelude home',
    navigation: 'Site navigation',
    related: 'Related links',
    features: 'Features',
    privacy: 'Privacy',
    support: 'Help',
    policy: 'Privacy policy',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    auto: 'Browser language',
    homeTitle: 'Prelude · New tab',
    slogan:
      'A quiet new tab for organizing Chrome bookmarks, open tabs, and things to read later.',
    getExtension: 'Get the extension',
    installHelp: 'Installation guide ↓',
    caption:
      'Works directly with your Chrome bookmarks. No import needed. Demo data shown.',
    previewAlt:
      'Prelude bookmarks view: folders on the left and the Chrome bookmark hierarchy on the right, with controls to add, edit, and organize.',
    featuresTitle: 'Your favorites and open tabs, all in view.',
    featuresIntro:
      'From finding a page to putting it in order. Keep everyday browsing connected.',
    bookmarksTitle: 'Bookmarks, just as you know them',
    bookmarksBody:
      'Keep your Chrome folders. Add, edit, and drag bookmarks in your new tab. Today and Recently added help you find what matters.',
    tabsTitle: 'See every window together',
    tabsBody:
      'Find open tabs, switch to them, reorder them, or move them between windows. Enable frequently visited sites and grant permission to find them in the sidebar and search, too.',
    laterTitle: 'No time now? Save it for later',
    laterBody:
      'Collect pages, windows, and tab groups from the toolbar or context menu. Duplicates are checked automatically. With Close after saving enabled, only successfully saved tabs close.',
    privacyTitle: 'Your browsing space, in your hands.',
    privacyBody:
      'No account, ads, or analytics. Bookmarks, tabs, and frequently visited sites are handled locally. Only web searches you submit go to Chrome’s default search provider.',
    privacyLink: 'Learn how your data is used ↗',
    installTitle: 'Make room for Prelude in Chrome',
    installIntro:
      'Download and extract the extension, then load it into Chrome. Installation currently uses developer mode.',
    download: 'Download extension ZIP',
    checksum: 'SHA-256 checksum',
    step1:
      'Download and extract the ZIP. Check that the folder contains <code>manifest.json</code>.',
    step2:
      'Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>.',
    step3:
      'Click <strong>Load unpacked</strong> and select the extracted folder.',
    step4:
      'Open a new tab to use Prelude. Pin its toolbar icon for quick access to capture.',
    supportTitle: 'Get comfortable with Prelude',
    supportIntro:
      'Help with bookmarks, tabs, Read later, and everyday browsing.',
    installHeading: 'Download and install',
    installPackage:
      'A Chrome extension ZIP is available. Extract it to a permanent folder and load it into Chrome. This is not a one-click Chrome Web Store installation.',
    update:
      'To update, replace the contents of the original folder with the new package and click Reload on Chrome’s extensions page. Keep the folder path so you do not need to uninstall and lose preferences.',
    daily: 'Everyday use',
    importQuestion: 'Do I need to import my bookmarks again?',
    importAnswer:
      'No. Prelude uses your existing Chrome bookmarks and folder hierarchy. Adding, editing, moving, or deleting a bookmark in Prelude also changes it in Chrome.',
    captureQuestion: 'How do I save something to read later?',
    captureAnswer:
      'Use Prelude’s toolbar icon or the page context menu to save a page, window, or tab group. The default shortcut <code>Alt + Shift + S</code> saves the current page to Read later. You can change it in Chrome’s extension shortcut settings.',
    closeQuestion: 'Will saved tabs close?',
    closeAnswer:
      'Only when Close after saving is enabled. Only tabs successfully saved in this operation close. Skipped duplicates and tabs that failed to save stay open.',
    searchQuestion: 'Which search engine is used?',
    searchAnswer:
      'Search first shows matching bookmarks and open tabs. Submitted web searches use your configured default search provider in Chrome. Prelude does not change your search settings.',
    sitesQuestion: 'How do I show or hide frequently visited sites?',
    sitesAnswer:
      'Turn on Frequently visited sites in settings and allow access when Chrome asks. Sites then appear in the sidebar and search. This is off by default; declining permission does not affect bookmarks or tabs.',
    sitesRetention:
      'Turning the setting off stops access and display while retaining the granted Chrome permission. Hidden sites can be restored in search. Prelude does not read full browsing history or count visits.',
    syncQuestion: 'Do bookmarks sync? What happens if I uninstall?',
    syncAnswer:
      'Chrome continues to store and manage bookmarks; syncing follows your Chrome settings. Prelude has no remote account or backup service. Ordinary Chrome bookmarks and folders remain after uninstalling Prelude.',
    troubleHeading: 'When something goes wrong',
    troubleFirst:
      'At <code>chrome://extensions</code>, check that Prelude is enabled and has the required permissions. After an update, open a new tab and try again.',
    troubleReport:
      'Include your Chrome version, Prelude version, reproduction steps, and expected behavior in a report. Hide private bookmarks, URLs, and other sensitive information in screenshots.',
    reportIssue: 'Report an issue',
    policyIntro:
      'Prelude has no remote service, account system, analytics, or advertising. Bookmark, tab, frequently visited site, navigation metadata, and preference data remain in your browser. Only a web search you explicitly submit is passed by Chrome to the configured default search provider.',
    updated: 'Last updated: 2026-09-08',
    policyNotice:
      'Prelude processes only the data needed to manage Chrome bookmarks, open tabs, and Read later. Bookmark and tab data are not uploaded, sold, or used for advertising. Only a submitted web search goes to the default search provider.',
    dataHeading: 'Data handled',
    dataBookmarks:
      '<strong>Chrome bookmarks:</strong> titles, URLs, folder hierarchy, identifiers, and sync properties exposed by Chrome. Changes happen only when you add, edit, move, delete, or capture.',
    dataTabs:
      '<strong>Open tabs:</strong> titles, URLs, windows, tab groups, pinned, active, and audio state for display, search, activation, and capture.',
    dataSites:
      '<strong>Frequently visited sites:</strong> off by default. Only after you enable the setting and grant Chrome’s optional topSites permission are site titles and URLs used for the sidebar, local search, and opening. Disabling stops access and display while retaining the granted permission. With no query, Chrome’s order is preserved. Hidden URLs are stored as local preferences and can be restored in search. The list is not uploaded; Prelude does not read full browsing history or count visits.',
    dataNavigation:
      '<strong>Navigation metadata:</strong> the source URL, final URL, and title of top-level pages are handled briefly to match redirects for automatic bookmark titles. Page bodies, forms, cookies, and authentication information are not read.',
    dataPreferences:
      '<strong>Local preferences:</strong> language, theme, sidebar state, Close after saving, Read later folder identifier, and pending automatic-title markers.',
    dataSearch:
      '<strong>Search input:</strong> submitted web searches go directly to Chrome’s configured default search provider. Prelude does not store or upload queries.',
    retentionHeading: 'Use, retention, and sharing',
    retentionStorage:
      'Data is used only for the visible bookmark, tab, frequently visited site, search, and capture features. Bookmarks stay in Chrome’s bookmark system and may be synced by Chrome according to your settings. Extension preferences and automatic-title markers are stored in the browser’s extension storage.',
    retentionSharing:
      'Navigation association data is session-only, valid for no more than five minutes, and removed after resolution, tab closure, or expiration. Except for a submitted web search passed by Chrome to the default provider, Prelude does not transmit data to the developer, advertisers, data brokers, or other third parties, and no personnel can view your data.',
    controlHeading: 'Your control',
    controlBody:
      'You can view, edit, and delete bookmarks in Chrome at any time. Uninstalling Prelude or clearing its data removes preferences and temporary markers. Bookmarks and folders created through Prelude are ordinary Chrome bookmarks and remain unless you delete them.',
    limitedHeading: 'Chrome Web Store Limited Use',
    limitedBody:
      'Prelude’s use of information received from Chrome APIs follows the Chrome Web Store User Data Policy, including Limited Use requirements. All access is limited to providing or improving the extension’s disclosed single purpose.',
    changesHeading: 'Changes and contact',
    changesBody:
      'If data handling changes, Prelude will clearly disclose the change in the extension and store listing and update this policy. Questions and privacy requests can be submitted through GitHub Issues.',
    contact: 'Contact and privacy requests',
  },
  ja: {
    brand: 'Prelude',
    skip: '本文へスキップ',
    homeLabel: 'Prelude ホーム',
    navigation: 'サイトナビゲーション',
    related: '関連リンク',
    features: '機能',
    privacy: 'プライバシー',
    support: 'ヘルプ',
    policy: 'プライバシーポリシー',
    theme: 'テーマ',
    language: '言語',
    light: 'ライト',
    dark: 'ダーク',
    system: 'システム設定',
    auto: 'ブラウザの言語',
    homeTitle: 'Prelude · 新しいタブ',
    slogan:
      'Chrome のブックマーク、開いているタブ、あとで読むページを整理する、静かな新しいタブ。',
    getExtension: '拡張機能を入手',
    installHelp: 'インストール方法 ↓',
    caption:
      'Chrome のブックマークをそのまま使用。再インポートは不要です。画像はデモデータです。',
    previewAlt:
      'Prelude のブックマーク画面。左にフォルダ、右に Chrome のブックマーク階層と追加・編集・整理の操作を表示。',
    featuresTitle: 'よく使うページも、開いたタブも、ひと目で。',
    featuresIntro:
      'ページを見つけて、整理するまで。日々のブラウジングを自然につなぎます。',
    bookmarksTitle: 'ブックマークは、いつものまま',
    bookmarksBody:
      'Chrome のフォルダを使って、新しいタブから追加・編集・ドラッグで整理。「今日」と「最近追加」で必要なページが見つかります。',
    tabsTitle: '複数のウィンドウをまとめて確認',
    tabsBody:
      '開いているタブを探して切り替え、並べ替え、別のウィンドウへ移動できます。「よくアクセスするサイト」を有効にして権限を許可すると、サイドバーと検索にも表示されます。',
    laterTitle: '今は時間がない？ あとで読むへ',
    laterBody:
      'ツールバーや右クリックメニューからページ、ウィンドウ、タブグループを保存。重複を自動確認し、「保存後に閉じる」が有効な場合は、保存に成功したタブだけを閉じます。',
    privacyTitle: 'あなたのブラウジング空間を、あなたの手で。',
    privacyBody:
      'アカウント、広告、アクセス解析はありません。ブックマーク、タブ、よくアクセスするサイトは端末内で処理します。明示的に送信したウェブ検索だけが Chrome の既定の検索エンジンに渡されます。',
    privacyLink: 'データの取り扱いを見る ↗',
    installTitle: 'Chrome に Prelude を追加',
    installIntro:
      '拡張機能をダウンロードして解凍し、Chrome に読み込みます。現在はデベロッパーモードでインストールします。',
    download: '拡張機能の ZIP をダウンロード',
    checksum: 'SHA-256 チェックサム',
    step1:
      'ZIP をダウンロードして解凍し、フォルダ内の <code>manifest.json</code> を確認します。',
    step2:
      '<code>chrome://extensions</code> を開き、<strong>デベロッパー モード</strong>をオンにします。',
    step3:
      '<strong>パッケージ化されていない拡張機能を読み込む</strong>をクリックし、解凍したフォルダを選びます。',
    step4:
      '新しいタブを開くと Prelude を使えます。保存しやすいよう、ツールバーのアイコンを固定することもできます。',
    supportTitle: 'Prelude をもっと使いやすく',
    supportIntro:
      'ブックマーク、タブ、あとで読む、日々の使い方についてのヘルプです。',
    installHeading: '入手とインストール',
    installPackage:
      'Chrome 拡張機能の ZIP を提供しています。固定の場所に解凍して Chrome に読み込んでください。Chrome ウェブストアのワンクリックインストールではありません。',
    update:
      '更新時は元のフォルダの内容を新しいパッケージに置き換え、拡張機能の管理画面で「再読み込み」を押してください。フォルダの場所を変えずに更新すると、アンインストールによる設定の消失を避けられます。',
    daily: '日常の使い方',
    importQuestion: 'ブックマークを再インポートする必要はありますか？',
    importAnswer:
      'いいえ。Chrome の既存のブックマークとフォルダ階層をそのまま使います。Prelude で追加・編集・移動・削除した内容は Chrome にも反映されます。',
    captureQuestion: 'あとで読むページを保存するには？',
    captureAnswer:
      'ツールバーのアイコンまたはページの右クリックメニューで、ページ、ウィンドウ、タブグループを保存できます。既定の <code>Alt + Shift + S</code> は現在のページを「あとで読む」に保存します。Chrome の拡張機能のショートカット設定で変更できます。',
    closeQuestion: '保存したタブは閉じますか？',
    closeAnswer:
      '「保存後に閉じる」が有効な場合だけです。今回の保存に成功したタブだけを閉じ、重複でスキップしたページや保存に失敗したタブは開いたままにします。',
    searchQuestion: 'どの検索エンジンを使いますか？',
    searchAnswer:
      'まず一致するブックマークと開いているタブを表示します。ウェブ検索を送信すると Chrome に設定された既定の検索エンジンを使います。検索設定は変更しません。',
    sitesQuestion: 'よくアクセスするサイトを表示・非表示にするには？',
    sitesAnswer:
      '設定で「よくアクセスするサイト」をオンにして、Chrome の権限リクエストを許可すると、サイドバーと検索に表示されます。既定ではオフです。許可しなくてもブックマークやタブの機能に影響はありません。',
    sitesRetention:
      'オフにすると読み取りと表示を停止しますが、許可済みの Chrome 権限は保持します。非表示にしたサイトは検索から復元できます。閲覧履歴全体の読み取りや訪問回数の集計は行いません。',
    syncQuestion: '同期されますか？ アンインストールするとどうなりますか？',
    syncAnswer:
      'ブックマークは Chrome が保存・管理し、同期は Chrome の設定に従います。Prelude にリモートアカウントやバックアップサービスはありません。アンインストール後も通常の Chrome ブックマークとフォルダは残ります。',
    troubleHeading: '問題が発生したとき',
    troubleFirst:
      '<code>chrome://extensions</code> で Prelude が有効で、必要な権限があることを確認してください。更新後は新しいタブを開いて再度お試しください。',
    troubleReport:
      '報告には Chrome と Prelude のバージョン、再現手順、期待する動作を含めてください。スクリーンショットの個人用ブックマーク、URL、機密情報は隠してください。',
    reportIssue: '問題を報告',
    policyIntro:
      'Prelude にリモートサービス、アカウント、アクセス解析、広告システムはありません。ブックマーク、タブ、よくアクセスするサイト、ナビゲーションのメタデータ、設定はブラウザ内に留まります。ユーザーが明示的に送信したウェブ検索だけが Chrome から設定済みの既定の検索エンジンに渡されます。',
    updated: '最終更新：2026-09-08',
    policyNotice:
      'Chrome のブックマーク、開いているタブ、「あとで読む」の管理に必要なデータのみを処理します。ブックマークやタブのデータをアップロード、販売、広告利用することはありません。送信したウェブ検索だけが既定の検索エンジンに渡されます。',
    dataHeading: '取り扱うデータ',
    dataBookmarks:
      '<strong>Chrome ブックマーク：</strong>タイトル、URL、フォルダ階層、識別子、Chrome が提供する同期属性。ユーザーによる追加・編集・移動・削除・保存操作があった場合のみ変更します。',
    dataTabs:
      '<strong>開いているタブ：</strong>タイトル、URL、ウィンドウ、タブグループ、固定・アクティブ・音声の状態。表示、検索、切り替え、保存に使用します。',
    dataSites:
      '<strong>よくアクセスするサイト：</strong>既定ではオフです。設定で有効にし、Chrome の任意の topSites 権限を許可した場合のみ、サイトのタイトルと URL をサイドバー表示、端末内検索、ページを開くために使用します。オフにすると読み取りと表示を停止し、許可済みの権限は保持します。検索語がない場合は Chrome の順序で表示します。非表示にした URL はローカル設定に保存され、検索から復元できます。リストをアップロードせず、閲覧履歴全体の読み取りや訪問回数の集計も行いません。',
    dataNavigation:
      '<strong>ナビゲーションのメタデータ：</strong>ブックマークのタイトルを自動補完する際、リダイレクトを対応付けるため、最上位ページの元の URL、最終 URL、タイトルを短時間処理します。ページ本文、フォーム、Cookie、認証情報は読み取りません。',
    dataPreferences:
      '<strong>ローカル設定：</strong>言語、テーマ、サイドバーの状態、「保存後に閉じる」、「あとで読む」フォルダの識別子、タイトルの自動補完を待つマーカー。',
    dataSearch:
      '<strong>検索入力：</strong>送信したウェブ検索は Chrome の既定の検索エンジンに直接渡されます。Prelude は検索語を保存・アップロードしません。',
    retentionHeading: '目的、保存、共有',
    retentionStorage:
      'データは公開されたブックマーク、タブ、よくアクセスするサイト、検索、保存機能にのみ使用します。ブックマークは Chrome のブックマークシステムに保存され、ユーザーの Chrome 設定に応じて Chrome が同期する場合があります。拡張機能の設定と自動タイトルのマーカーはブラウザの拡張機能ストレージに保存します。',
    retentionSharing:
      'ナビゲーションの関連付け情報は現在のブラウザセッション内でのみ使い、有効期間は最大 5 分です。関連付けの完了、タブの閉鎖、期限切れで削除します。送信したウェブ検索を Chrome が既定の検索エンジンに渡す場合を除き、開発者、広告主、データブローカーなどの第三者にデータを送信せず、担当者がユーザーデータを閲覧することもありません。',
    controlHeading: 'ユーザーによる管理',
    controlBody:
      'ブックマークは Chrome でいつでも確認、編集、削除できます。拡張機能のアンインストールやデータの消去により、設定と一時マーカーが削除されます。Prelude で作成したブックマークやフォルダは通常の Chrome ブックマークであり、ユーザーが削除するまで残ります。',
    limitedHeading: 'Chrome Web Store Limited Use',
    limitedBody:
      'Chrome API から取得する情報の使用は、Limited Use 要件を含む Chrome ウェブストアのユーザーデータポリシーに従います。すべてのアクセスは、拡張機能が公開した単一の目的を提供・改善することに限定します。',
    changesHeading: '変更とお問い合わせ',
    changesBody:
      'データの取り扱いが変わる場合、拡張機能とストア掲載ページで明確に説明し、本ポリシーを更新します。質問やプライバシーに関する依頼は GitHub Issues からお送りください。',
    contact: 'お問い合わせ・プライバシーの依頼',
  },
  es: {
    brand: 'Prelude',
    skip: 'Saltar al contenido',
    homeLabel: 'Inicio de Prelude',
    navigation: 'Navegación del sitio',
    related: 'Enlaces relacionados',
    features: 'Funciones',
    privacy: 'Privacidad',
    support: 'Ayuda',
    policy: 'Política de privacidad',
    theme: 'Tema',
    language: 'Idioma',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    auto: 'Idioma del navegador',
    homeTitle: 'Prelude · Nueva pestaña',
    slogan:
      'Una nueva pestaña tranquila para organizar los marcadores de Chrome, las pestañas abiertas y lo que quieres leer más tarde.',
    getExtension: 'Obtener la extensión',
    installHelp: 'Cómo instalar ↓',
    caption:
      'Usa directamente tus marcadores de Chrome, sin importarlos de nuevo. La imagen muestra datos de demostración.',
    previewAlt:
      'Vista de marcadores de Prelude: carpetas a la izquierda y la jerarquía de marcadores de Chrome a la derecha, con opciones para añadir, editar y organizar.',
    featuresTitle: 'Tus favoritos y pestañas abiertas, a la vista.',
    featuresIntro:
      'De encontrar una página a ponerla en orden. Conecta tu navegación diaria.',
    bookmarksTitle: 'Tus marcadores, como siempre',
    bookmarksBody:
      'Conserva tus carpetas de Chrome. Añade, edita y arrastra marcadores desde la nueva pestaña. Hoy y Añadidos recientemente te ayudan a encontrar lo importante.',
    tabsTitle: 'Todas tus ventanas juntas',
    tabsBody:
      'Busca pestañas abiertas, cambia a ellas, reordénalas o muévelas entre ventanas. Activa los sitios frecuentes y concede el permiso para encontrarlos también en la barra lateral y la búsqueda.',
    laterTitle: '¿Sin tiempo? Guárdalo para después',
    laterBody:
      'Guarda páginas, ventanas y grupos de pestañas desde la barra de herramientas o el menú contextual. Los duplicados se comprueban automáticamente. Con Cerrar después de guardar activado, solo se cierran las pestañas guardadas correctamente.',
    privacyTitle: 'Tu espacio de navegación, en tus manos.',
    privacyBody:
      'Sin cuenta, anuncios ni analítica. Los marcadores, las pestañas y los sitios frecuentes se procesan localmente. Solo las búsquedas web que envías se pasan al buscador predeterminado de Chrome.',
    privacyLink: 'Cómo se utilizan tus datos ↗',
    installTitle: 'Añade Prelude a Chrome',
    installIntro:
      'Descarga y descomprime la extensión y cárgala en Chrome. Por ahora, se instala mediante el modo de desarrollador.',
    download: 'Descargar ZIP de la extensión',
    checksum: 'Suma de verificación SHA-256',
    step1:
      'Descarga y descomprime el ZIP. Comprueba que la carpeta contiene <code>manifest.json</code>.',
    step2:
      'Abre <code>chrome://extensions</code> y activa el <strong>Modo de desarrollador</strong>.',
    step3:
      'Pulsa <strong>Cargar descomprimida</strong> y selecciona la carpeta extraída.',
    step4:
      'Abre una nueva pestaña para usar Prelude. Fija su icono en la barra de herramientas para guardar páginas con facilidad.',
    supportTitle: 'Sácale partido a Prelude',
    supportIntro:
      'Ayuda con marcadores, pestañas, Leer más tarde y la navegación diaria.',
    installHeading: 'Descarga e instalación',
    installPackage:
      'La extensión de Chrome está disponible en un ZIP. Extráelo a una carpeta permanente y cárgalo en Chrome. No es una instalación con un clic desde Chrome Web Store.',
    update:
      'Para actualizar, sustituye el contenido de la carpeta original por el nuevo paquete y pulsa Recargar en la página de extensiones de Chrome. Conserva la ruta para evitar desinstalar y perder preferencias.',
    daily: 'Uso diario',
    importQuestion: '¿Tengo que importar otra vez mis marcadores?',
    importAnswer:
      'No. Prelude usa tus marcadores y carpetas actuales de Chrome. Al añadir, editar, mover o eliminar un marcador en Prelude, también cambia en Chrome.',
    captureQuestion: '¿Cómo guardo una página para leerla después?',
    captureAnswer:
      'Usa el icono de la barra de herramientas o el menú contextual para guardar una página, una ventana o un grupo de pestañas. El atajo predeterminado <code>Alt + Shift + S</code> guarda la página actual en Leer más tarde. Puedes cambiarlo en los atajos de extensiones de Chrome.',
    closeQuestion: '¿Se cierran las pestañas guardadas?',
    closeAnswer:
      'Solo si activas Cerrar después de guardar. Se cierran únicamente las pestañas guardadas correctamente en esa operación. Los duplicados omitidos y las pestañas que no se pudieron guardar permanecen abiertos.',
    searchQuestion: '¿Qué buscador se utiliza?',
    searchAnswer:
      'Primero se muestran los marcadores y las pestañas que coinciden. Las búsquedas web que envías usan el buscador predeterminado configurado en Chrome. Prelude no cambia esa configuración.',
    sitesQuestion: '¿Cómo muestro u oculto los sitios frecuentes?',
    sitesAnswer:
      'Activa Sitios frecuentes en los ajustes y permite el acceso cuando Chrome lo solicite. Aparecerán en la barra lateral y en la búsqueda. Está desactivado por defecto; rechazar el permiso no afecta a marcadores ni pestañas.',
    sitesRetention:
      'Al desactivarlo, se detienen la lectura y la visualización, pero se conserva el permiso concedido en Chrome. Los sitios ocultos se pueden restaurar desde la búsqueda. Prelude no lee todo el historial ni cuenta visitas.',
    syncQuestion: '¿Se sincronizan los marcadores? ¿Qué pasa al desinstalar?',
    syncAnswer:
      'Chrome sigue almacenando y gestionando los marcadores; la sincronización depende de sus ajustes. Prelude no ofrece cuentas remotas ni copias de seguridad. Los marcadores y las carpetas normales de Chrome se conservan al desinstalar.',
    troubleHeading: 'Si algo falla',
    troubleFirst:
      'En <code>chrome://extensions</code>, comprueba que Prelude está activado y tiene los permisos necesarios. Después de actualizar, abre una nueva pestaña y vuelve a probar.',
    troubleReport:
      'Incluye las versiones de Chrome y Prelude, los pasos para reproducir el problema y el resultado esperado. Oculta los marcadores privados, las URL y otros datos sensibles en las capturas.',
    reportIssue: 'Informar de un problema',
    policyIntro:
      'Prelude no tiene servicios remotos, cuentas, analítica ni publicidad. Los datos de marcadores, pestañas, sitios frecuentes, metadatos de navegación y preferencias permanecen en tu navegador. Solo una búsqueda web que envíes explícitamente se pasa mediante Chrome al buscador predeterminado configurado.',
    updated: 'Última actualización: 2026-09-08',
    policyNotice:
      'Prelude trata únicamente los datos necesarios para gestionar marcadores de Chrome, pestañas abiertas y Leer más tarde. Los datos de marcadores y pestañas no se suben, venden ni utilizan para publicidad. Solo las búsquedas web enviadas se pasan al buscador predeterminado.',
    dataHeading: 'Datos tratados',
    dataBookmarks:
      '<strong>Marcadores de Chrome:</strong> títulos, URL, jerarquía de carpetas, identificadores y propiedades de sincronización expuestas por Chrome. Solo se modifican cuando añades, editas, mueves, eliminas o guardas contenido.',
    dataTabs:
      '<strong>Pestañas abiertas:</strong> títulos, URL, ventanas, grupos de pestañas y estados de fijación, actividad y audio, para mostrar, buscar, activar y guardar.',
    dataSites:
      '<strong>Sitios frecuentes:</strong> desactivados por defecto. Solo tras activar el ajuste y conceder el permiso opcional topSites de Chrome se usan títulos y URL para la barra lateral, la búsqueda local y la apertura de páginas. Al desactivarlo se detienen la lectura y la visualización, conservando el permiso. Sin consulta se mantiene el orden de Chrome. Las URL ocultas se guardan como preferencias locales y se pueden restaurar desde la búsqueda. La lista no se sube; no se lee todo el historial ni se cuentan visitas.',
    dataNavigation:
      '<strong>Metadatos de navegación:</strong> la URL de origen, la URL final y el título de páginas de nivel superior se procesan brevemente para asociar redirecciones al completar títulos de marcadores. No se leen el cuerpo de las páginas, formularios, cookies ni información de autenticación.',
    dataPreferences:
      '<strong>Preferencias locales:</strong> idioma, tema, estado de la barra lateral, Cerrar después de guardar, identificador de la carpeta Leer más tarde y marcadores pendientes de título automático.',
    dataSearch:
      '<strong>Entrada de búsqueda:</strong> las búsquedas web enviadas se pasan directamente al buscador predeterminado de Chrome. Prelude no almacena ni sube las consultas.',
    retentionHeading: 'Uso, conservación y comunicación',
    retentionStorage:
      'Los datos se usan únicamente para las funciones visibles de marcadores, pestañas, sitios frecuentes, búsqueda y guardado. Los marcadores permanecen en el sistema de Chrome y Chrome puede sincronizarlos según tus ajustes. Las preferencias y los indicadores de títulos automáticos se guardan en el almacenamiento de extensiones del navegador.',
    retentionSharing:
      'Los datos que asocian la navegación se usan solo durante la sesión actual, durante un máximo de cinco minutos, y se eliminan al resolver la asociación, cerrar la pestaña o caducar. Salvo las búsquedas web que Chrome pasa al buscador predeterminado, Prelude no transmite datos al desarrollador, anunciantes, intermediarios de datos ni otros terceros, y ningún personal puede ver tus datos.',
    controlHeading: 'Tu control',
    controlBody:
      'Puedes ver, editar y eliminar marcadores en Chrome en cualquier momento. Desinstalar Prelude o borrar sus datos elimina las preferencias y los indicadores temporales. Los marcadores y las carpetas creados con Prelude son marcadores normales de Chrome y permanecen hasta que los elimines.',
    limitedHeading: 'Chrome Web Store Limited Use',
    limitedBody:
      'El uso de información recibida de las API de Chrome cumple la Política de Datos de Usuarios de Chrome Web Store, incluidos los requisitos de Limited Use. Todo acceso se limita a proporcionar o mejorar el único propósito declarado de la extensión.',
    changesHeading: 'Cambios y contacto',
    changesBody:
      'Si cambia el tratamiento de datos, Prelude lo indicará claramente en la extensión y en su ficha de la tienda y actualizará esta política. Puedes enviar preguntas o solicitudes de privacidad mediante GitHub Issues.',
    contact: 'Contacto y solicitudes de privacidad',
  },
  fr: {
    brand: 'Prelude',
    skip: 'Aller au contenu',
    homeLabel: 'Accueil de Prelude',
    navigation: 'Navigation du site',
    related: 'Liens utiles',
    features: 'Fonctions',
    privacy: 'Confidentialité',
    support: 'Aide',
    policy: 'Politique de confidentialité',
    theme: 'Thème',
    language: 'Langue',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    auto: 'Langue du navigateur',
    homeTitle: 'Prelude · Nouvel onglet',
    slogan:
      'Un nouvel onglet paisible pour organiser les favoris Chrome, les onglets ouverts et vos lectures à venir.',
    getExtension: 'Obtenir l’extension',
    installHelp: 'Guide d’installation ↓',
    caption:
      'Utilise directement vos favoris Chrome, sans nouvel import. L’image présente des données de démonstration.',
    previewAlt:
      'Vue des favoris de Prelude : dossiers à gauche, arborescence des favoris Chrome à droite, avec des commandes pour ajouter, modifier et organiser.',
    featuresTitle: 'Vos favoris et onglets ouverts, sous les yeux.',
    featuresIntro:
      'De la découverte d’une page à son rangement. Retrouvez le fil de votre navigation.',
    bookmarksTitle: 'Vos favoris, comme d’habitude',
    bookmarksBody:
      'Conservez vos dossiers Chrome. Ajoutez, modifiez et déplacez vos favoris dans le nouvel onglet. Aujourd’hui et Ajouts récents vous aident à retrouver l’essentiel.',
    tabsTitle: 'Toutes vos fenêtres réunies',
    tabsBody:
      'Trouvez vos onglets ouverts, activez-les, réorganisez-les ou déplacez-les entre fenêtres. Activez les sites fréquents et accordez l’autorisation pour les retrouver aussi dans la barre latérale et la recherche.',
    laterTitle: 'Pas le temps ? Gardez-le pour plus tard',
    laterBody:
      'Enregistrez des pages, fenêtres et groupes d’onglets depuis la barre d’outils ou le menu contextuel. Les doublons sont vérifiés automatiquement. Avec Fermer après l’enregistrement, seuls les onglets enregistrés avec succès se ferment.',
    privacyTitle: 'Votre espace de navigation, entre vos mains.',
    privacyBody:
      'Sans compte, publicité ni outil d’analyse. Favoris, onglets et sites fréquents sont traités localement. Seules les recherches web que vous envoyez sont transmises au moteur de recherche par défaut de Chrome.',
    privacyLink: 'Comprendre l’utilisation des données ↗',
    installTitle: 'Installez Prelude dans Chrome',
    installIntro:
      'Téléchargez et décompressez l’extension, puis chargez-la dans Chrome. L’installation utilise actuellement le mode développeur.',
    download: 'Télécharger le ZIP de l’extension',
    checksum: 'Somme de contrôle SHA-256',
    step1:
      'Téléchargez et décompressez le ZIP. Vérifiez que le dossier contient <code>manifest.json</code>.',
    step2:
      'Ouvrez <code>chrome://extensions</code> et activez le <strong>Mode développeur</strong>.',
    step3:
      'Cliquez sur <strong>Charger l’extension non empaquetée</strong> et sélectionnez le dossier décompressé.',
    step4:
      'Ouvrez un nouvel onglet pour utiliser Prelude. Épinglez son icône dans la barre d’outils pour enregistrer facilement des pages.',
    supportTitle: 'Prenez vos habitudes avec Prelude',
    supportIntro:
      'De l’aide pour les favoris, les onglets, À lire plus tard et la navigation quotidienne.',
    installHeading: 'Téléchargement et installation',
    installPackage:
      'L’extension Chrome est disponible au format ZIP. Décompressez-la dans un dossier permanent, puis chargez-la dans Chrome. Il ne s’agit pas d’une installation en un clic depuis le Chrome Web Store.',
    update:
      'Pour mettre à jour, remplacez le contenu du dossier d’origine par le nouveau paquet et cliquez sur Actualiser sur la page des extensions Chrome. Conservez le même chemin pour éviter une désinstallation qui effacerait vos préférences.',
    daily: 'Au quotidien',
    importQuestion: 'Faut-il importer à nouveau mes favoris ?',
    importAnswer:
      'Non. Prelude utilise les favoris et les dossiers existants de Chrome. Tout ajout, modification, déplacement ou suppression dans Prelude se répercute aussi dans Chrome.',
    captureQuestion: 'Comment garder une page pour plus tard ?',
    captureAnswer:
      'Utilisez l’icône de la barre d’outils ou le menu contextuel pour enregistrer une page, une fenêtre ou un groupe d’onglets. Le raccourci par défaut <code>Alt + Shift + S</code> ajoute la page actuelle à À lire plus tard. Vous pouvez le modifier dans les raccourcis des extensions Chrome.',
    closeQuestion: 'Les onglets enregistrés se ferment-ils ?',
    closeAnswer:
      'Uniquement si Fermer après l’enregistrement est activé. Seuls les onglets enregistrés avec succès pendant cette opération se ferment. Les doublons ignorés et les onglets dont l’enregistrement a échoué restent ouverts.',
    searchQuestion: 'Quel moteur de recherche est utilisé ?',
    searchAnswer:
      'La recherche affiche d’abord les favoris et les onglets correspondants. Les recherches web envoyées utilisent le moteur par défaut configuré dans Chrome. Prelude ne modifie pas vos réglages de recherche.',
    sitesQuestion: 'Comment afficher ou masquer les sites fréquents ?',
    sitesAnswer:
      'Activez Sites fréquents dans les réglages, puis autorisez l’accès lorsque Chrome le demande. Ils apparaîtront dans la barre latérale et la recherche. Cette fonction est désactivée par défaut ; refuser l’autorisation n’affecte pas les favoris ou les onglets.',
    sitesRetention:
      'La désactivation arrête la lecture et l’affichage tout en conservant l’autorisation Chrome accordée. Les sites masqués peuvent être restaurés depuis la recherche. Prelude ne lit pas l’historique complet et ne compte pas les visites.',
    syncQuestion:
      'Mes favoris sont-ils synchronisés ? Et après désinstallation ?',
    syncAnswer:
      'Chrome continue de stocker et de gérer les favoris ; leur synchronisation dépend de vos réglages Chrome. Prelude ne propose ni compte distant ni sauvegarde distante. Les favoris et dossiers Chrome ordinaires restent après la désinstallation.',
    troubleHeading: 'En cas de problème',
    troubleFirst:
      'Sur <code>chrome://extensions</code>, vérifiez que Prelude est activé et dispose des autorisations nécessaires. Après une mise à jour, ouvrez un nouvel onglet et réessayez.',
    troubleReport:
      'Indiquez les versions de Chrome et de Prelude, les étapes de reproduction et le résultat attendu. Masquez les favoris privés, les URL et toute information sensible sur les captures.',
    reportIssue: 'Signaler un problème',
    policyIntro:
      'Prelude ne possède aucun service distant, système de compte, outil d’analyse ou système publicitaire. Les données des favoris, onglets, sites fréquents, métadonnées de navigation et préférences restent dans votre navigateur. Seule une recherche web explicitement envoyée est transmise par Chrome au moteur de recherche par défaut configuré.',
    updated: 'Dernière mise à jour : 2026-09-08',
    policyNotice:
      'Prelude traite uniquement les données nécessaires à la gestion des favoris Chrome, des onglets ouverts et de À lire plus tard. Les données des favoris et onglets ne sont ni téléversées, ni vendues, ni utilisées pour la publicité. Seules les recherches web envoyées sont transmises au moteur par défaut.',
    dataHeading: 'Données traitées',
    dataBookmarks:
      '<strong>Favoris Chrome :</strong> titres, URL, arborescence des dossiers, identifiants et propriétés de synchronisation exposées par Chrome. Ils ne changent qu’après un ajout, une modification, un déplacement, une suppression ou un enregistrement volontaire.',
    dataTabs:
      '<strong>Onglets ouverts :</strong> titres, URL, fenêtres, groupes et états d’épinglage, d’activité et d’audio, pour l’affichage, la recherche, l’activation et l’enregistrement.',
    dataSites:
      '<strong>Sites fréquents :</strong> désactivés par défaut. Leurs titres et URL servent à la barre latérale, à la recherche locale et à l’ouverture seulement après activation du réglage et octroi de l’autorisation facultative topSites de Chrome. La désactivation arrête la lecture et l’affichage, mais conserve l’autorisation. Sans requête, l’ordre de Chrome est conservé. Les URL masquées sont enregistrées comme préférences locales et peuvent être restaurées dans la recherche. La liste n’est pas téléversée ; Prelude ne lit pas l’historique complet et ne compte pas les visites.',
    dataNavigation:
      '<strong>Métadonnées de navigation :</strong> l’URL d’origine, l’URL finale et le titre des pages principales sont traités brièvement pour associer les redirections lors de la saisie automatique des titres de favoris. Le contenu des pages, les formulaires, les cookies et les informations d’authentification ne sont pas lus.',
    dataPreferences:
      '<strong>Préférences locales :</strong> langue, thème, état de la barre latérale, fermeture après enregistrement, identifiant du dossier À lire plus tard et marqueurs de titre automatique en attente.',
    dataSearch:
      '<strong>Saisie de recherche :</strong> les recherches web envoyées sont directement transmises au moteur par défaut de Chrome. Prelude ne stocke ni ne téléverse les requêtes.',
    retentionHeading: 'Utilisation, conservation et partage',
    retentionStorage:
      'Les données servent uniquement aux fonctions visibles de favoris, onglets, sites fréquents, recherche et enregistrement. Les favoris restent dans le système de Chrome et peuvent être synchronisés par Chrome selon vos réglages. Les préférences de l’extension et les marqueurs de titre automatique sont conservés dans le stockage des extensions du navigateur.',
    retentionSharing:
      'Les données d’association de navigation ne servent que pendant la session actuelle, pour cinq minutes au maximum. Elles sont supprimées après résolution, fermeture de l’onglet ou expiration. Hormis une recherche web envoyée que Chrome transmet au moteur par défaut, Prelude ne transmet aucune donnée au développeur, aux annonceurs, aux courtiers en données ou à d’autres tiers, et aucun membre du personnel ne peut consulter vos données.',
    controlHeading: 'Votre contrôle',
    controlBody:
      'Vous pouvez consulter, modifier et supprimer les favoris dans Chrome à tout moment. Désinstaller Prelude ou effacer ses données supprime les préférences et les marqueurs temporaires. Les favoris et dossiers créés avec Prelude sont des favoris Chrome ordinaires et restent jusqu’à leur suppression par vos soins.',
    limitedHeading: 'Chrome Web Store Limited Use',
    limitedBody:
      'L’utilisation des informations reçues des API Chrome respecte les règles du Chrome Web Store relatives aux données utilisateur, y compris les exigences Limited Use. Tout accès se limite à fournir ou à améliorer l’unique objectif déclaré de l’extension.',
    changesHeading: 'Modifications et contact',
    changesBody:
      'Si le traitement des données change, Prelude l’indiquera clairement dans l’extension et sur sa fiche de la boutique et mettra à jour cette politique. Les questions et demandes de confidentialité peuvent être adressées via GitHub Issues.',
    contact: 'Contact et demandes de confidentialité',
  },
  ru: {
    brand: 'Prelude',
    skip: 'Перейти к содержимому',
    homeLabel: 'Главная Prelude',
    navigation: 'Навигация по сайту',
    related: 'Полезные ссылки',
    features: 'Возможности',
    privacy: 'Приватность',
    support: 'Помощь',
    policy: 'Политика конфиденциальности',
    theme: 'Тема',
    language: 'Язык',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Как в системе',
    auto: 'Язык браузера',
    homeTitle: 'Prelude · Новая вкладка',
    slogan:
      'Спокойная новая вкладка для порядка в закладках Chrome, открытых вкладках и материалах на потом.',
    getExtension: 'Скачать расширение',
    installHelp: 'Как установить ↓',
    caption:
      'Работает прямо с закладками Chrome, без повторного импорта. На изображении — демонстрационные данные.',
    previewAlt:
      'Закладки в Prelude: папки слева, дерево закладок Chrome справа, действия для добавления, редактирования и упорядочивания.',
    featuresTitle: 'Любимые страницы и открытые вкладки — перед глазами.',
    featuresIntro:
      'От поиска страницы до порядка в закладках. Всё для повседневной работы в браузере.',
    bookmarksTitle: 'Привычные закладки',
    bookmarksBody:
      'Сохраняйте папки Chrome. Добавляйте, редактируйте и перетаскивайте закладки на новой вкладке. Разделы «Сегодня» и «Недавно добавленные» помогают найти нужное.',
    tabsTitle: 'Все окна вместе',
    tabsBody:
      'Находите открытые вкладки, переключайтесь на них, меняйте порядок и переносите между окнами. Включите часто посещаемые сайты и предоставьте разрешение, чтобы видеть их в боковой панели и поиске.',
    laterTitle: 'Нет времени? Оставьте на потом',
    laterBody:
      'Сохраняйте страницы, окна и группы вкладок через панель инструментов или контекстное меню. Дубликаты проверяются автоматически. При включённом закрытии после сохранения закрываются только успешно сохранённые вкладки.',
    privacyTitle: 'Ваше пространство в браузере — под вашим контролем.',
    privacyBody:
      'Без аккаунтов, рекламы и аналитики. Закладки, вкладки и часто посещаемые сайты обрабатываются локально. Только отправленные вами веб-запросы передаются поисковой системе Chrome по умолчанию.',
    privacyLink: 'Как используются данные ↗',
    installTitle: 'Добавьте Prelude в Chrome',
    installIntro:
      'Скачайте и распакуйте расширение, затем загрузите его в Chrome. Пока установка выполняется в режиме разработчика.',
    download: 'Скачать ZIP расширения',
    checksum: 'Контрольная сумма SHA-256',
    step1:
      'Скачайте и распакуйте ZIP. Убедитесь, что в папке есть <code>manifest.json</code>.',
    step2:
      'Откройте <code>chrome://extensions</code> и включите <strong>Режим разработчика</strong>.',
    step3:
      'Нажмите <strong>Загрузить распакованное расширение</strong> и выберите распакованную папку.',
    step4:
      'Откройте новую вкладку, чтобы пользоваться Prelude. Закрепите значок на панели инструментов для быстрого сохранения страниц.',
    supportTitle: 'Освойтесь в Prelude',
    supportIntro:
      'Помощь с закладками, вкладками, списком «Прочитать позже» и повседневной работой.',
    installHeading: 'Скачивание и установка',
    installPackage:
      'Расширение Chrome доступно в ZIP-архиве. Распакуйте его в постоянную папку и загрузите в Chrome. Это не установка одним нажатием из Интернет-магазина Chrome.',
    update:
      'Для обновления замените содержимое исходной папки новым пакетом и нажмите «Обновить» на странице расширений Chrome. Сохраните путь к папке, чтобы не удалять расширение и не терять настройки.',
    daily: 'Повседневное использование',
    importQuestion: 'Нужно ли заново импортировать закладки?',
    importAnswer:
      'Нет. Prelude использует существующие закладки и папки Chrome. Добавление, редактирование, перемещение и удаление в Prelude также отражаются в Chrome.',
    captureQuestion: 'Как сохранить страницу на потом?',
    captureAnswer:
      'Используйте значок на панели инструментов или контекстное меню страницы, чтобы сохранить страницу, окно или группу вкладок. По умолчанию <code>Alt + Shift + S</code> сохраняет текущую страницу в «Прочитать позже». Сочетание можно изменить в настройках быстрых клавиш расширений Chrome.',
    closeQuestion: 'Закроются ли сохранённые вкладки?',
    closeAnswer:
      'Только если включено закрытие после сохранения. Закрываются лишь вкладки, успешно сохранённые в этой операции. Пропущенные дубликаты и вкладки, которые не удалось сохранить, остаются открытыми.',
    searchQuestion: 'Какая поисковая система используется?',
    searchAnswer:
      'Сначала показываются подходящие закладки и открытые вкладки. Отправленные веб-запросы используют поисковую систему по умолчанию в Chrome. Prelude не меняет настройки поиска.',
    sitesQuestion: 'Как показать или скрыть часто посещаемые сайты?',
    sitesAnswer:
      'Включите «Часто посещаемые сайты» в настройках и разрешите доступ в запросе Chrome. Сайты появятся в боковой панели и поиске. По умолчанию функция выключена; отказ не влияет на закладки и вкладки.',
    sitesRetention:
      'Выключение прекращает чтение и показ, сохраняя уже предоставленное разрешение Chrome. Скрытые сайты можно восстановить в поиске. Prelude не читает полную историю посещений и не подсчитывает визиты.',
    syncQuestion: 'Синхронизируются ли закладки? Что будет после удаления?',
    syncAnswer:
      'Закладки по-прежнему хранит и обрабатывает Chrome, а синхронизация зависит от его настроек. У Prelude нет удалённых аккаунтов и резервных копий. Обычные закладки и папки Chrome остаются после удаления расширения.',
    troubleHeading: 'Если что-то не работает',
    troubleFirst:
      'На странице <code>chrome://extensions</code> убедитесь, что Prelude включён и имеет необходимые разрешения. После обновления откройте новую вкладку и попробуйте снова.',
    troubleReport:
      'Укажите версии Chrome и Prelude, шаги воспроизведения и ожидаемый результат. Скройте личные закладки, адреса и другие конфиденциальные данные на снимках экрана.',
    reportIssue: 'Сообщить о проблеме',
    policyIntro:
      'У Prelude нет удалённых сервисов, системы аккаунтов, аналитики или рекламы. Данные закладок, вкладок, часто посещаемых сайтов, метаданные навигации и настройки остаются в браузере. Только явно отправленный вами веб-запрос передаётся через Chrome настроенной поисковой системе по умолчанию.',
    updated: 'Последнее обновление: 2026-09-08',
    policyNotice:
      'Prelude обрабатывает только данные, необходимые для управления закладками Chrome, открытыми вкладками и списком «Прочитать позже». Данные закладок и вкладок не выгружаются, не продаются и не используются для рекламы. Только отправленный веб-запрос передаётся поисковой системе по умолчанию.',
    dataHeading: 'Обрабатываемые данные',
    dataBookmarks:
      '<strong>Закладки Chrome:</strong> заголовки, адреса, иерархия папок, идентификаторы и свойства синхронизации, предоставленные Chrome. Изменения выполняются только после вашего добавления, редактирования, перемещения, удаления или сохранения.',
    dataTabs:
      '<strong>Открытые вкладки:</strong> заголовки, адреса, окна, группы вкладок, состояния закрепления, активности и звука для отображения, поиска, переключения и сохранения.',
    dataSites:
      '<strong>Часто посещаемые сайты:</strong> по умолчанию выключены. Заголовки и адреса используются для боковой панели, локального поиска и открытия только после включения настройки и предоставления необязательного разрешения topSites в Chrome. Выключение прекращает чтение и отображение, сохраняя разрешение. Без запроса сохраняется порядок Chrome. Скрытые адреса хранятся как локальные настройки и могут быть восстановлены в поиске. Список не выгружается; полная история не читается, посещения не подсчитываются.',
    dataNavigation:
      '<strong>Метаданные навигации:</strong> исходный адрес, конечный адрес и заголовок страницы верхнего уровня кратковременно обрабатываются для сопоставления перенаправлений при автоматическом заполнении заголовков закладок. Содержимое страниц, формы, cookie и данные аутентификации не читаются.',
    dataPreferences:
      '<strong>Локальные настройки:</strong> язык, тема, состояние боковой панели, закрытие после сохранения, идентификатор папки «Прочитать позже» и метки ожидания автоматического заголовка.',
    dataSearch:
      '<strong>Поисковый ввод:</strong> отправленные веб-запросы передаются напрямую поисковой системе Chrome по умолчанию. Prelude не сохраняет и не выгружает запросы.',
    retentionHeading: 'Использование, хранение и передача',
    retentionStorage:
      'Данные используются только для видимых функций закладок, вкладок, часто посещаемых сайтов, поиска и сохранения. Закладки остаются в системе Chrome и могут синхронизироваться самим Chrome согласно вашим настройкам. Настройки расширения и метки автоматических заголовков хранятся в хранилище расширений браузера.',
    retentionSharing:
      'Данные сопоставления навигации используются только в текущем сеансе браузера, не дольше пяти минут, и удаляются после завершения сопоставления, закрытия вкладки или истечения срока. Кроме отправленного веб-запроса, передаваемого Chrome поисковой системе по умолчанию, Prelude не передаёт данные разработчику, рекламодателям, брокерам данных и другим третьим лицам; сотрудники также не могут просматривать ваши данные.',
    controlHeading: 'Ваш контроль',
    controlBody:
      'Вы можете в любой момент просматривать, редактировать и удалять закладки в Chrome. Удаление расширения или очистка его данных удаляет настройки и временные метки. Созданные через Prelude закладки и папки являются обычными закладками Chrome и остаются, пока вы их не удалите.',
    limitedHeading: 'Chrome Web Store Limited Use',
    limitedBody:
      'Использование информации, полученной через API Chrome, соответствует политике Интернет-магазина Chrome в отношении пользовательских данных, включая требования Limited Use. Весь доступ ограничен предоставлением или улучшением единственного заявленного назначения расширения.',
    changesHeading: 'Изменения и связь',
    changesBody:
      'При изменении обработки данных Prelude явно сообщит об этом в расширении и на странице магазина и обновит эту политику. Вопросы и запросы о конфиденциальности можно отправить через GitHub Issues.',
    contact: 'Связь и запросы о конфиденциальности',
  },
}
