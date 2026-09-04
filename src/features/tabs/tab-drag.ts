import type { OpenTab, OpenTabWindow } from './model'

export type OpenTabDropMode = 'after' | 'before' | 'boundary'

export type OpenTabDropTarget =
  | {
      type: 'tab'
      id: number
      mode?: Exclude<OpenTabDropMode, 'boundary'>
    }
  | {
      type: 'window'
      edge: 'end' | 'start'
      windowId: number
    }

export interface OpenTabPosition {
  index: number
  windowId: number
}

export interface OpenTabMoveDestination {
  index: number
  windowId: number
}

export interface OpenTabDropProjection {
  destination: OpenTabMoveDestination
  isNoop: boolean
  mode: OpenTabDropMode
  position: OpenTabPosition
  targetId?: number
  windows: Array<OpenTabWindow>
}

export interface OpenTabDropRectangle {
  height: number
  top: number
}

interface OpenTabEntry {
  index: number
  tab: OpenTab
  window: OpenTabWindow
}

function getOpenTabEntry(
  windows: ReadonlyArray<OpenTabWindow>,
  id: number,
): OpenTabEntry | undefined {
  for (const window of windows) {
    const index = window.tabs.findIndex((tab) => tab.id === id)
    if (index >= 0) return { index, tab: window.tabs[index], window }
  }

  return undefined
}

export function getOpenTabPosition(
  windows: ReadonlyArray<OpenTabWindow>,
  id: number,
): OpenTabPosition | undefined {
  const entry = getOpenTabEntry(windows, id)
  return entry ? { index: entry.index, windowId: entry.window.id } : undefined
}

export function isSameOpenTabPosition(
  first: OpenTabPosition,
  second: OpenTabPosition,
) {
  return first.index === second.index && first.windowId === second.windowId
}

/**
 * Chrome keeps grouped tabs contiguous. Since this view does not render group
 * boundaries, grouped tabs only expose destinations inside their existing
 * group in the same window. Across windows, they can move beside ungrouped
 * tabs or to a window boundary, where Chrome detaches the individual tab from
 * its original group.
 */
export function canUseOpenTabDropTarget(
  windows: ReadonlyArray<OpenTabWindow>,
  draggedId: number,
  target: OpenTabDropTarget,
) {
  const source = getOpenTabEntry(windows, draggedId)
  if (!source) return false

  if (target.type === 'window') {
    const destinationWindowExists = windows.some(
      (window) => window.id === target.windowId,
    )
    return (
      destinationWindowExists &&
      (source.tab.groupId < 0 || target.windowId !== source.window.id)
    )
  }

  if (target.id === draggedId) return true

  const destination = getOpenTabEntry(windows, target.id)
  if (!destination || destination.tab.pinned !== source.tab.pinned) {
    return false
  }

  if (source.tab.groupId >= 0) {
    return destination.window.id === source.window.id
      ? destination.tab.groupId === source.tab.groupId
      : destination.tab.groupId < 0
  }

  return destination.tab.groupId < 0
}

function getTabDropMode(
  pointerY: number,
  rectangle: OpenTabDropRectangle,
): Exclude<OpenTabDropMode, 'boundary'> {
  const progress = rectangle.height
    ? (pointerY - rectangle.top) / rectangle.height
    : 0.5
  return progress < 0.5 ? 'before' : 'after'
}

function normalizeTabs(windowId: number, tabs: ReadonlyArray<OpenTab>) {
  return tabs.map((tab, nativeIndex) => ({
    ...tab,
    nativeIndex,
    windowId,
  }))
}

function getWindowBoundaryIndex(
  tabs: ReadonlyArray<OpenTab>,
  source: OpenTab,
  edge: 'end' | 'start',
) {
  if (edge === 'start') {
    return source.pinned ? 0 : tabs.findIndex((tab) => !tab.pinned)
  }

  if (!source.pinned) return tabs.length

  const firstUnpinnedIndex = tabs.findIndex((tab) => !tab.pinned)
  return firstUnpinnedIndex < 0 ? tabs.length : firstUnpinnedIndex
}

function getChromeMoveIndex(
  source: OpenTab,
  destinationTabs: ReadonlyArray<OpenTab>,
  destinationWindowId: number,
) {
  const sourceIndex = destinationTabs.findIndex((tab) => tab.id === source.id)
  if (sourceIndex < 0) return source.nativeIndex

  const isSameWindow = source.windowId === destinationWindowId
  const nextTab = destinationTabs.at(sourceIndex + 1)
  if (nextTab) {
    return (
      nextTab.nativeIndex -
      (isSameWindow && source.nativeIndex < nextTab.nativeIndex ? 1 : 0)
    )
  }

  const previousTab = destinationTabs.at(sourceIndex - 1)
  if (previousTab) {
    return (
      previousTab.nativeIndex -
      (isSameWindow && source.nativeIndex < previousTab.nativeIndex ? 1 : 0) +
      1
    )
  }

  return isSameWindow ? source.nativeIndex : 0
}

function updateCrossWindowActiveTabs({
  destinationTabs,
  source,
  sourceIndex,
  sourceTabs,
}: {
  destinationTabs: Array<OpenTab>
  source: OpenTab
  sourceIndex: number
  sourceTabs: Array<OpenTab>
}) {
  if (!source.active) return { destinationTabs, sourceTabs }

  const nextSourceActiveIndex = Math.min(sourceIndex, sourceTabs.length - 1)
  return {
    destinationTabs: destinationTabs.map((tab) => ({ ...tab, active: false })),
    sourceTabs: sourceTabs.map((tab, index) => ({
      ...tab,
      active: index === nextSourceActiveIndex,
    })),
  }
}

export function projectOpenTabMove({
  draggedId,
  pointerY,
  rectangle,
  target,
  windows,
}: {
  draggedId: number
  pointerY: number
  rectangle: OpenTabDropRectangle
  target: OpenTabDropTarget
  windows: ReadonlyArray<OpenTabWindow>
}): OpenTabDropProjection | null {
  const source = getOpenTabEntry(windows, draggedId)
  if (!source || !canUseOpenTabDropTarget(windows, draggedId, target)) {
    return null
  }

  const mode =
    target.type === 'window'
      ? 'boundary'
      : (target.mode ?? getTabDropMode(pointerY, rectangle))

  if (target.type === 'tab' && target.id === draggedId) {
    const position = { index: source.index, windowId: source.window.id }
    return {
      destination: {
        index: source.tab.nativeIndex,
        windowId: source.window.id,
      },
      isNoop: true,
      mode,
      position,
      targetId: target.id,
      windows: windows as Array<OpenTabWindow>,
    }
  }

  const destinationWindowId =
    target.type === 'window'
      ? target.windowId
      : getOpenTabEntry(windows, target.id)?.window.id
  if (destinationWindowId === undefined) return null

  let sourceTabs = source.window.tabs.filter((tab) => tab.id !== draggedId)
  const isCrossWindow = source.window.id !== destinationWindowId
  const destinationWindow = windows.find(
    (window) => window.id === destinationWindowId,
  )
  if (!destinationWindow) return null

  let destinationTabs = isCrossWindow ? [...destinationWindow.tabs] : sourceTabs

  if (isCrossWindow) {
    const activeTabs = updateCrossWindowActiveTabs({
      destinationTabs,
      source: source.tab,
      sourceIndex: source.index,
      sourceTabs,
    })
    sourceTabs = activeTabs.sourceTabs
    destinationTabs = activeTabs.destinationTabs
  }

  let insertionIndex: number
  if (target.type === 'window') {
    insertionIndex = getWindowBoundaryIndex(
      destinationTabs,
      source.tab,
      target.edge,
    )
    if (insertionIndex < 0) insertionIndex = destinationTabs.length
  } else {
    const targetIndex = destinationTabs.findIndex((tab) => tab.id === target.id)
    if (targetIndex < 0) return null
    insertionIndex = targetIndex + (mode === 'after' ? 1 : 0)
  }

  const position = { index: insertionIndex, windowId: destinationWindowId }
  const isNoop = isSameOpenTabPosition(
    { index: source.index, windowId: source.window.id },
    position,
  )
  if (isNoop) {
    return {
      destination: {
        index: source.tab.nativeIndex,
        windowId: source.window.id,
      },
      isNoop,
      mode,
      position,
      targetId: target.type === 'tab' ? target.id : undefined,
      windows: windows as Array<OpenTabWindow>,
    }
  }

  destinationTabs.splice(insertionIndex, 0, {
    ...source.tab,
    groupId: isCrossWindow ? -1 : source.tab.groupId,
    windowId: destinationWindowId,
  })
  const destination = {
    index: getChromeMoveIndex(source.tab, destinationTabs, destinationWindowId),
    windowId: destinationWindowId,
  }
  const sourceWindowBecomesEmpty = isCrossWindow && sourceTabs.length === 0

  const projectedWindows = windows.flatMap((window) => {
    if (!isCrossWindow && window.id === source.window.id) {
      return [{ ...window, tabs: normalizeTabs(window.id, destinationTabs) }]
    }

    if (window.id === source.window.id) {
      return sourceTabs.length
        ? [{ ...window, tabs: normalizeTabs(window.id, sourceTabs) }]
        : []
    }

    if (window.id === destinationWindowId) {
      return [
        {
          ...window,
          focused:
            sourceWindowBecomesEmpty && source.window.focused
              ? true
              : window.focused,
          tabs: normalizeTabs(window.id, destinationTabs),
        },
      ]
    }

    return sourceWindowBecomesEmpty && source.window.focused
      ? [{ ...window, focused: false }]
      : [window]
  })

  return {
    destination,
    isNoop,
    mode,
    position,
    targetId: target.type === 'tab' ? target.id : undefined,
    windows: projectedWindows,
  }
}
