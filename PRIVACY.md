# 序幕 · Prelude 隐私政策 / Privacy Policy

最后更新 / Last updated: 2026-08-31

序幕（Prelude）是一款在 Chrome 新标签页中管理书签、打开的标签页与“待读”内容的扩展。序幕没有远程服务、账号系统、分析工具或广告系统。书签、标签页、导航元数据和偏好数据均留在用户的浏览器中；只有用户主动提交的网页搜索会由 Chrome 交给当前配置的默认搜索引擎。

Prelude is a Chrome new-tab extension for managing bookmarks, open tabs, and Read later items. Prelude has no remote service, account system, analytics, or advertising system. Bookmark, tab, navigation metadata, and preference data remain in the user's browser; only a web search explicitly submitted by the user is passed by Chrome to the configured default search provider.

## 处理的数据 / Data handled

- **Chrome 书签 / Chrome bookmarks**：读取书签和文件夹的标题、网址、层级、标识及 Chrome 提供的同步属性；仅在用户执行添加、编辑、移动、删除或收集操作时修改书签。
- **打开的标签页 / Open tabs**：读取打开标签页的标题、网址、窗口、标签组、固定、活动与音频状态，用于展示、搜索、切换和收集标签页。
- **导航元数据 / Navigation metadata**：在自动补全书签标题时，短暂处理顶层页面的来源网址、最终网址和标题，用于关联重定向前后的页面。不读取页面正文、表单、Cookie 或认证信息。
- **本地偏好 / Local preferences**：保存语言、主题、侧栏状态、“保存后关闭标签页”偏好、“待读”文件夹标识以及等待自动补全标题的书签标记。
- **搜索输入 / Search input**：用户提交网页搜索时，查询会直接交给 Chrome 当前配置的默认搜索引擎。序幕不保存或上传查询；搜索引擎按其自身政策处理查询。

- **Chrome bookmarks**: Reads bookmark and folder titles, URLs, hierarchy, identifiers, and sync properties exposed by Chrome. Bookmarks are changed only when the user adds, edits, moves, deletes, or collects an item.
- **Open tabs**: Reads open-tab titles, URLs, window and group identifiers, pinned, active, and audio state to display, search, activate, and collect tabs.
- **Navigation metadata**: While resolving an automatically generated bookmark title, Prelude temporarily handles the top-level source URL, final URL, and page title to associate redirects. It does not read page bodies, forms, cookies, or authentication information.
- **Local preferences**: Stores language, theme, sidebar state, the close-after-save preference, the Read later folder identifier, and pending automatic-title markers.
- **Search input**: When the user submits a web search, the query is passed directly to Chrome's configured default search provider. Prelude does not store or upload the query; the provider handles it under its own policy.

## 数据用途与保存 / Use and retention

序幕只为用户可见的书签、标签页、搜索和收集功能处理上述数据。除用户主动提交的网页搜索由 Chrome 交给默认搜索引擎外，扩展不会将数据发送给开发者或第三方；扩展不会出售数据、用于个性化广告、信用评估或建立浏览画像。

书签保存在 Chrome 的书签系统中，并可能根据用户自己的 Chrome 同步设置由 Chrome 同步。扩展偏好和自动标题标记保存在 `chrome.storage.local`、`chrome.storage.session` 或扩展自己的本地存储中。导航关联信息只在当前浏览器会话中使用，其有效期最长为五分钟，并会在关联完成、标签页关闭或信息失效后清理。

Prelude handles the data above only for the user-facing bookmark, tab, search, and collection features. Except for a user-submitted web search passed by Chrome to the default provider, it does not send data to the developer or third parties. It does not sell data, use data for personalized advertising or credit decisions, or build browsing profiles.

Bookmarks are stored in Chrome's bookmark system and may be synced by Chrome according to the user's own Chrome Sync settings. Extension preferences and automatic-title markers are stored in `chrome.storage.local`, `chrome.storage.session`, or the extension's local storage. Navigation association data is used only in the current browser session, is considered valid for no more than five minutes, and is removed after resolution, tab closure, or expiration.

## 分享与人工访问 / Sharing and human access

除用户主动提交的网页搜索由 Chrome 交给默认搜索引擎外，序幕不向开发者、广告商、数据经纪商或其他第三方传输用户数据。没有任何开发者或工作人员能够查看用户的书签、标签页、网址或偏好。

Except for a user-submitted web search passed by Chrome to the default provider, Prelude does not transmit user data to the developer, advertisers, data brokers, or other third parties. No developer or staff member can view a user's bookmarks, tabs, URLs, or preferences.

## 用户控制 / User control

用户可以随时在 Chrome 中查看、修改或删除书签。卸载扩展或清除扩展数据会移除序幕保存的偏好和临时标记；通过序幕建立的书签和文件夹属于普通 Chrome 书签，除非用户自行删除，否则会继续保留。

Users can view, change, or delete bookmarks in Chrome at any time. Uninstalling the extension or clearing its data removes Prelude's preferences and temporary markers. Bookmarks and folders created through Prelude are ordinary Chrome bookmarks and remain until the user deletes them.

## Chrome Web Store Limited Use

序幕对通过 Chrome API 获得的信息的使用遵守 Chrome Web Store 用户数据政策，包括 Limited Use 要求。所有数据访问都仅用于提供或改进扩展公开说明的单一用途。

Prelude's use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. All data access is limited to providing or improving the extension's disclosed single purpose.

## 政策更新与联系 / Changes and contact

如果数据处理方式发生变化，序幕会在扩展界面和商店页面中显著说明，并在此更新政策。问题或隐私请求可通过 [GitHub Issues](https://github.com/yuzhouu/supposed/issues) 提交。

If data practices change, Prelude will prominently disclose the change in the extension and its store listing and update this policy. Questions or privacy requests can be submitted through [GitHub Issues](https://github.com/yuzhouu/supposed/issues).
