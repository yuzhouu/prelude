# Chrome Web Store privacy practices

Use this file as the exact source for the Privacy practices tab. Keep it synchronized with `PRIVACY.md`, the in-product Settings disclosure, and the store descriptions.

## Single purpose

在一个安静的新标签页中集中管理 Chrome 书签和打开的标签页，并把用户选择的页面收集到“待读”。

English reference: Manage Chrome bookmarks and open tabs in a calm new tab, and collect user-selected pages into Read later.

## Permission justifications

### `bookmarks`

读取并展示用户现有的 Chrome 书签树；在用户主动操作时创建、编辑、移动或删除书签与文件夹；检查重复网址，并把用户选择的标签页保存到“待读”。

### `tabs`

读取打开标签页的标题、网址、窗口、固定、活动与音频状态，以在新标签页中展示、搜索、切换和收集标签页；按用户操作关闭标签页、调整顺序或移到其他窗口。收集时，只有用户启用“保存后关闭”且保存成功，才会自动关闭对应标签页。

### `topSites`

读取 Chrome 提供的常访问网站标题和网址，整合进现有搜索框；未输入关键词时按 Chrome 返回的顺序显示，输入后按相关性匹配。列表只在本机内存中使用，隐藏的网址作为本地偏好保存并可在搜索内恢复，不上传；不读取完整浏览历史，不自行统计访问次数。

### `tabGroups`

读取当前标签组的标题和成员关系，以便用户主动把整个标签组按原顺序保存为书签文件夹。

### `webNavigation`

仅监听顶层页面开始导航事件，短暂记录规范化后的来源网址和时间，用于把用户先前创建、等待自动标题的书签与重定向后的最终页面标题关联。信息保存在 `chrome.storage.session`，有效期最长五分钟，并在关联完成、标签页关闭或失效后删除；不读取页面正文、表单、Cookie 或认证信息。

### `storage`

在本地保存语言、主题、侧栏状态、“保存后关闭”偏好、“待读”文件夹标识及等待自动补全标题的书签标记。没有服务器同步或开发者访问。

### `search`

把用户明确提交的普通文本交给 Chrome 当前配置的默认搜索引擎，并在当前标签页打开结果。序幕不保存或上传查询。

### `favicon`

通过 Chrome Extension Favicon API 为用户的书签、打开标签页和常访问网站显示对应站点图标。

### `contextMenus`

提供由用户触发的右键菜单，用于保存当前页面、窗口或标签组，并切换“保存后关闭”偏好。

### `notifications`

在用户通过快捷键或右键菜单执行后台收集后，显示本地成功、重复、不可用或失败结果。通知不用于广告或推广。

## Remote code

Select: **No, I am not using remote code.**

All executable JavaScript and CSS is bundled in the uploaded Manifest V3 package. The extension does not download or evaluate remote code.

## Data usage disclosures

### Data types

- Personally identifiable information: **No**
- Health information: **No**
- Financial and payment information: **No**
- Authentication information: **No**
- Personal communications: **No**
- Location: **No**
- Web history: **Yes** — bookmark URLs and titles, open-tab URLs and titles, frequently visited site URLs and titles provided by Chrome, and short-lived top-level navigation URLs are processed locally for the disclosed features.
- User activity: **No** — no clickstream, keystroke, mouse, scroll, or interaction analytics are collected.
- Website content: **No** — Prelude does not read page bodies, images, forms, cookies, or other page content. Page titles and URLs are disclosed under Web history.

### Certifications

Certify all of the following:

- Data is not sold to third parties outside approved use cases.
- Data is not used or transferred for purposes unrelated to the extension's single purpose.
- Data is not used or transferred to determine creditworthiness or for lending.
- The use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including Limited Use requirements.

## Privacy policy

`https://yuzhouu.github.io/supposed/privacy.html`

## Prominent disclosure

Use this sentence near the beginning of every store description:

> 序幕会读取 Chrome 书签、打开标签页及常访问网站的标题和网址，用于展示、打开、搜索、管理与收集；这些数据仅在本机处理，不上传、不出售，也不用于广告。只有用户主动提交的网页搜索会由 Chrome 交给当前配置的默认搜索引擎。

The same disclosure appears inside Settings → Data and privacy before the link to the full policy.
