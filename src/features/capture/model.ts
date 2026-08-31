export type CaptureKind = 'page' | 'window' | 'group'

export interface CaptureTab {
  id: number
  windowId: number
  groupId: number
  index: number
  title: string
  url: string
  active: boolean
  pinned: boolean
  lastAccessed: number
}

export interface CaptureGroupPreview {
  id: number
  title: string
  tabCount: number
}

export interface CaptureSnapshot {
  currentPage?: CaptureTab
  currentWindowTabCount: number
  currentGroup?: CaptureGroupPreview
}

export interface CapturePlanItem {
  tab: CaptureTab
  isDuplicate: boolean
}

export interface CapturePlan {
  kind: CaptureKind
  label: string
  items: Array<CapturePlanItem>
  duplicateCount: number
}

export interface CaptureResult {
  savedCount: number
  duplicateCount: number
  closedCount: number
  closeFailed: boolean
}

export type DuplicatePolicy = 'save' | 'skip'

export const CLOSE_AFTER_CAPTURE_STORAGE_KEY = 'prelude:close-after-capture:v1'
export const READ_LATER_FOLDER_STORAGE_KEY = 'prelude:read-later-folder-id:v1'

export function normalizeCapturedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    url.hash = ''
    return url.toString()
  } catch {
    return rawUrl.trim()
  }
}
