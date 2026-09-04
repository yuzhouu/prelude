import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  AppWindow,
  CheckCircle2,
  Inbox,
  Keyboard,
  Layers3,
  LoaderCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCaptureCommandShortcut } from '../shortcuts/chrome-commands'
import { formatChromeCommandShortcut } from '../shortcuts/shortcut-preferences'
import type { OpenTabWindow } from '../tabs/model'
import {
  executeCapture,
  getCaptureSnapshot,
  getCloseAfterCapturePreference,
  prepareCapture,
  setCloseAfterCapturePreference,
} from './chrome-capture'
import type {
  CaptureKind,
  CapturePlan,
  CaptureResult,
  CaptureSnapshot,
  DuplicatePolicy,
} from './model'

type CaptureStatus =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'success'; result: CaptureResult; skippedDuplicates: boolean }
  | { type: 'error' }

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url
  } catch {
    return url
  }
}

function getFallbackSnapshot(windows: Array<OpenTabWindow>): CaptureSnapshot {
  const focusedWindow =
    windows.find((window) => window.focused) ?? windows.at(0)
  const currentPage =
    focusedWindow?.tabs.find((tab) => tab.active) ?? focusedWindow?.tabs.at(0)

  return {
    currentPage: currentPage
      ? {
          ...currentPage,
          groupId: -1,
          index: 0,
          lastAccessed: 0,
        }
      : undefined,
    currentWindowTabCount: focusedWindow?.tabs.length ?? 0,
  }
}

function CaptureOption({
  description,
  disabled,
  icon,
  label,
  meta,
  onClick,
  title,
}: {
  description: string
  disabled: boolean
  icon: ReactNode
  label: string
  meta?: string
  onClick: () => void
  title: string
}) {
  return (
    <button
      className="capture-option"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="capture-option-icon">{icon}</span>
      <span className="capture-option-copy">
        <span className="capture-option-heading">
          <strong>{title}</strong>
          {meta ? <span>{meta}</span> : null}
        </span>
        <span>{description}</span>
      </span>
      <span className="capture-option-action">{label}</span>
    </button>
  )
}

export function CapturePanel({
  closeButton,
  fallbackWindows,
  isActive,
  isChromeSource,
}: {
  closeButton?: ReactNode
  fallbackWindows: Array<OpenTabWindow>
  isActive: boolean
  isChromeSource: boolean
}) {
  const { t } = useTranslation()
  const captureCommand = useCaptureCommandShortcut()
  const [snapshot, setSnapshot] = useState<CaptureSnapshot>(() =>
    getFallbackSnapshot(fallbackWindows),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [closeAfterCapture, setCloseAfterCapture] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<CapturePlan>()
  const [status, setStatus] = useState<CaptureStatus>({ type: 'idle' })

  useEffect(() => {
    if (!isActive || !isChromeSource) return

    setPendingPlan(undefined)
    setStatus({ type: 'idle' })
    let active = true
    setIsLoading(true)
    void Promise.all([getCaptureSnapshot(), getCloseAfterCapturePreference()])
      .then(([nextSnapshot, nextCloseAfterCapture]) => {
        if (!active) return
        setSnapshot(nextSnapshot)
        setCloseAfterCapture(nextCloseAfterCapture)
      })
      .catch(() => {
        if (active) setStatus({ type: 'error' })
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isActive, isChromeSource])

  useEffect(() => {
    if (!isActive || isChromeSource) return
    setPendingPlan(undefined)
    setStatus({ type: 'idle' })
    setSnapshot(getFallbackSnapshot(fallbackWindows))
  }, [fallbackWindows, isActive, isChromeSource])

  const savePlan = async (
    plan: CapturePlan,
    duplicatePolicy: DuplicatePolicy,
  ) => {
    setPendingPlan(undefined)
    setStatus({ type: 'saving' })
    try {
      const result = await executeCapture({
        closeAfterCapture,
        duplicatePolicy,
        plan,
      })
      setStatus({
        type: 'success',
        result,
        skippedDuplicates: duplicatePolicy === 'skip',
      })
      setSnapshot(await getCaptureSnapshot())
    } catch {
      setStatus({ type: 'error' })
    }
  }

  const startCapture = async (kind: CaptureKind) => {
    if (!isChromeSource || status.type === 'saving') return

    setStatus({ type: 'saving' })
    try {
      const plan = await prepareCapture(kind)
      if (!plan.items.length) {
        setStatus({ type: 'error' })
        return
      }

      if (plan.duplicateCount > 0) {
        setPendingPlan(plan)
        setStatus({ type: 'idle' })
        return
      }

      await savePlan(plan, 'skip')
    } catch {
      setStatus({ type: 'error' })
    }
  }

  const handleCloseAfterChange = (checked: boolean) => {
    setCloseAfterCapture(checked)
    if (!isChromeSource) return

    void setCloseAfterCapturePreference(checked).catch(() => {
      setCloseAfterCapture(!checked)
      setStatus({ type: 'error' })
    })
  }

  const resultMessage =
    status.type === 'success'
      ? status.result.savedCount === 0 && status.result.duplicateCount > 0
        ? t('capture.result.allDuplicates')
        : status.result.closeFailed
          ? t('capture.result.savedCloseFailed', {
              count: status.result.savedCount,
            })
          : status.skippedDuplicates && status.result.duplicateCount > 0
            ? t('capture.result.savedWithSkipped', {
                count: status.result.savedCount,
                skipped: status.result.duplicateCount,
              })
            : status.result.closedCount > 0
              ? t('capture.result.savedAndClosed', {
                  count: status.result.savedCount,
                  closed: status.result.closedCount,
                })
              : t('capture.result.saved', { count: status.result.savedCount })
      : undefined
  const isSaving = status.type === 'saving'

  return (
    <>
      <header className="capture-dialog-header">
        <div>
          <div className="capture-dialog-eyebrow">
            <Inbox />
            <span>{t('capture.eyebrow')}</span>
          </div>
          <h1 className="capture-dialog-title">{t('capture.title')}</h1>
          <p className="capture-dialog-description">
            {t('capture.description')}
          </p>
        </div>
        {closeButton}
      </header>

      <div className="capture-options" aria-busy={isLoading || isSaving}>
        <CaptureOption
          icon={<Inbox />}
          title={t('capture.currentPage.title')}
          description={
            snapshot.currentPage
              ? snapshot.currentPage.title
              : t('capture.currentPage.empty')
          }
          meta={
            snapshot.currentPage
              ? getHostname(snapshot.currentPage.url)
              : undefined
          }
          label={t('capture.currentPage.action')}
          disabled={
            !isChromeSource || !snapshot.currentPage || isLoading || isSaving
          }
          onClick={() => void startCapture('page')}
        />
        <CaptureOption
          icon={<AppWindow />}
          title={t('capture.currentWindow.title')}
          description={t('capture.currentWindow.description', {
            count: snapshot.currentWindowTabCount,
          })}
          label={t('capture.currentWindow.action')}
          disabled={
            !isChromeSource ||
            snapshot.currentWindowTabCount === 0 ||
            isLoading ||
            isSaving
          }
          onClick={() => void startCapture('window')}
        />
        <CaptureOption
          icon={<Layers3 />}
          title={t('capture.currentGroup.title')}
          description={
            snapshot.currentGroup
              ? t('capture.currentGroup.description', {
                  count: snapshot.currentGroup.tabCount,
                  title: snapshot.currentGroup.title,
                })
              : t('capture.currentGroup.empty')
          }
          label={t('capture.currentGroup.action')}
          disabled={
            !isChromeSource || !snapshot.currentGroup || isLoading || isSaving
          }
          onClick={() => void startCapture('group')}
        />
      </div>

      {pendingPlan ? (
        <section className="capture-duplicate-panel" role="alert">
          <div className="capture-duplicate-heading">
            <AlertTriangle />
            <div>
              <strong>
                {t('capture.duplicates.title', {
                  count: pendingPlan.duplicateCount,
                })}
              </strong>
              <p>{t('capture.duplicates.description')}</p>
            </div>
          </div>
          <ul>
            {pendingPlan.items
              .filter((item) => item.isDuplicate)
              .slice(0, 3)
              .map(({ tab }) => (
                <li key={tab.id}>
                  <span>{tab.title}</span>
                  <small>{getHostname(tab.url)}</small>
                </li>
              ))}
          </ul>
          <div className="capture-duplicate-actions">
            <button
              type="button"
              onClick={() => void savePlan(pendingPlan, 'skip')}
            >
              {t('capture.duplicates.skip')}
            </button>
            <button
              type="button"
              onClick={() => void savePlan(pendingPlan, 'save')}
            >
              {t('capture.duplicates.saveAnyway')}
            </button>
          </div>
        </section>
      ) : null}

      <label className="capture-close-option">
        <input
          type="checkbox"
          checked={closeAfterCapture}
          disabled={!isChromeSource || isSaving}
          onChange={(event) => handleCloseAfterChange(event.target.checked)}
        />
        <span className="capture-checkbox" aria-hidden="true">
          <CheckCircle2 />
        </span>
        <span>
          <strong>{t('capture.closeAfter.title')}</strong>
          <small>{t('capture.closeAfter.description')}</small>
        </span>
      </label>

      <div className="capture-dialog-status" aria-live="polite">
        {isSaving ? (
          <span>
            <LoaderCircle className="is-spinning" />
            {t('capture.saving')}
          </span>
        ) : resultMessage ? (
          <span className="is-success">
            <CheckCircle2 />
            {resultMessage}
          </span>
        ) : status.type === 'error' ? (
          <span className="is-error">
            <AlertTriangle />
            {t('capture.failed')}
          </span>
        ) : !isChromeSource ? (
          <span>{t('capture.extensionRequired')}</span>
        ) : (
          <span>
            <Keyboard />
            {captureCommand.shortcut
              ? t('capture.shortcutHint', {
                  shortcut: formatChromeCommandShortcut(
                    captureCommand.shortcut,
                  ),
                })
              : t('capture.shortcutUnassignedHint')}
          </span>
        )}
      </div>

      <p className="capture-dialog-note">{t('capture.newTabHint')}</p>
    </>
  )
}
