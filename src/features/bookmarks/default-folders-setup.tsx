import { useState } from 'react'
import {
  BookOpen,
  Check,
  Folder,
  FolderPlus,
  LoaderCircle,
  Pin,
  Star,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  createDefaultBookmarkFolders,
  getDefaultBookmarkFolderTitles,
} from './chrome-bookmarks'

type CreationStatus = 'idle' | 'creating' | 'created' | 'error'

export function DefaultFoldersSetup({
  isChromeSource,
}: {
  isChromeSource: boolean
}) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<CreationStatus>('idle')
  const isCreated = status === 'created'
  const folderTitles = getDefaultBookmarkFolderTitles()

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

        <h3>
          {t(
            isCreated
              ? 'defaultFolders.readyTitle'
              : 'defaultFolders.setupTitle',
          )}
        </h3>
        <p className="default-folders-intro">
          {t(
            isCreated
              ? 'defaultFolders.readyDescription'
              : 'defaultFolders.setupDescription',
          )}
        </p>

        <div
          className="default-folders-preview"
          aria-label={t('defaultFolders.previewLabel')}
        >
          <div className="default-folder-preview-row is-root">
            <Folder />
            <div>
              <strong>{folderTitles.container}</strong>
              <span>{t('defaultFolders.containerDescription')}</span>
            </div>
          </div>
          <div className="default-folder-preview-row is-child">
            <Pin />
            <div>
              <strong>{folderTitles.pinned}</strong>
              <span>{t('defaultFolders.pinnedDescription')}</span>
            </div>
          </div>
          <div className="default-folder-preview-row is-child">
            <BookOpen />
            <div>
              <strong>{folderTitles.readLater}</strong>
              <span>{t('defaultFolders.readLaterDescription')}</span>
            </div>
          </div>
          <div className="default-folder-preview-row is-child">
            <Star />
            <div>
              <strong>{folderTitles.favorites}</strong>
              <span>{t('defaultFolders.favoritesDescription')}</span>
            </div>
          </div>
        </div>

        <div className="default-folders-actions" aria-live="polite">
          {isCreated ? (
            <p className="default-folders-note">
              {t('defaultFolders.readyNote')}
            </p>
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
              {t(
                status === 'creating'
                  ? 'defaultFolders.creating'
                  : status === 'error'
                    ? 'defaultFolders.retry'
                    : 'defaultFolders.confirm',
              )}
            </button>
          )}

          {!isChromeSource && !isCreated ? (
            <p className="default-folders-note">
              {t('defaultFolders.extensionRequired')}
            </p>
          ) : status === 'error' ? (
            <p className="default-folders-error" role="alert">
              {t('defaultFolders.createFailed')}
            </p>
          ) : !isCreated ? (
            <p className="default-folders-note">
              {t('defaultFolders.privacyNote')}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
