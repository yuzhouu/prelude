import { useState } from 'react'
import {
  BookOpen,
  Check,
  Folder,
  FolderPlus,
  LoaderCircle,
  Pin,
} from 'lucide-react'

import {
  createDefaultBookmarkFolders,
  DEFAULT_BOOKMARK_CONTAINER_TITLE,
  DEFAULT_PINNED_FOLDER_TITLE,
  DEFAULT_READ_LATER_FOLDER_TITLE,
  openBookmarkManager,
} from './chrome-bookmarks'

type CreationStatus = 'idle' | 'creating' | 'created' | 'error'

export function DefaultFoldersSetup({
  isChromeSource,
  hasDefaultFolders,
}: {
  isChromeSource: boolean
  hasDefaultFolders: boolean
}) {
  const [status, setStatus] = useState<CreationStatus>('idle')
  const isCreated = hasDefaultFolders || status === 'created'

  const handleConfirm = async () => {
    setStatus('creating')

    try {
      await createDefaultBookmarkFolders()
      setStatus('created')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="default-folders-page">
      <section className="default-folders-card">
        <div
          className={`default-folders-icon${isCreated ? ' is-created' : ''}`}
        >
          {isCreated ? <Check /> : <FolderPlus />}
        </div>

        <h3>{isCreated ? '快捷文件夹已准备好' : '建立你的快捷文件夹'}</h3>
        <p className="default-folders-intro">
          {isCreated
            ? '目录已经加入 Chrome 书签，你可以随时改名、移动或删除。'
            : '确认后，我们会在 Chrome 的「其他书签」中新建下面的目录。未经确认不会修改你的书签。'}
        </p>

        <div
          className="default-folders-preview"
          aria-label="将创建的文件夹结构"
        >
          <div className="default-folder-preview-row is-root">
            <Folder />
            <div>
              <strong>{DEFAULT_BOOKMARK_CONTAINER_TITLE}</strong>
              <span>创建在「其他书签」中</span>
            </div>
          </div>
          <div className="default-folder-preview-row is-child">
            <Pin />
            <div>
              <strong>{DEFAULT_PINNED_FOLDER_TITLE}</strong>
              <span>集中保存经常访问的页面</span>
            </div>
          </div>
          <div className="default-folder-preview-row is-child">
            <BookOpen />
            <div>
              <strong>{DEFAULT_READ_LATER_FOLDER_TITLE}</strong>
              <span>收纳准备稍后阅读的内容</span>
            </div>
          </div>
        </div>

        <div className="default-folders-actions" aria-live="polite">
          {isCreated ? (
            <button
              className="default-folders-secondary-button"
              type="button"
              onClick={openBookmarkManager}
            >
              管理这些文件夹
            </button>
          ) : (
            <button
              className="default-folders-confirm-button"
              type="button"
              disabled={!isChromeSource || status === 'creating'}
              onClick={() => void handleConfirm()}
            >
              {status === 'creating' ? (
                <LoaderCircle className="is-spinning" />
              ) : (
                <FolderPlus />
              )}
              {status === 'creating'
                ? '正在创建…'
                : status === 'error'
                  ? '重新尝试'
                  : '确认创建'}
            </button>
          )}

          {!isChromeSource && !isCreated ? (
            <p className="default-folders-note">
              加载为 Chrome 扩展后即可创建。
            </p>
          ) : status === 'error' ? (
            <p className="default-folders-error" role="alert">
              创建失败，请确认扩展仍拥有书签权限后重试。
            </p>
          ) : !isCreated ? (
            <p className="default-folders-note">
              创建后不持续追踪；改名、移动或删除均由你控制。
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
