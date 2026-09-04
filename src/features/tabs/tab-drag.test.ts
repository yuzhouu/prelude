import assert from 'node:assert/strict'
import test from 'node:test'

import type { OpenTab, OpenTabWindow } from './model.ts'
import {
  canUseOpenTabDropTarget,
  getOpenTabPosition,
  projectOpenTabMove,
} from './tab-drag.ts'

function tab(
  id: number,
  windowId: number,
  nativeIndex: number,
  overrides: Partial<OpenTab> = {},
): OpenTab {
  return {
    active: false,
    audible: false,
    groupId: -1,
    id,
    nativeIndex,
    pinned: false,
    title: `Tab ${id}`,
    url: `https://example.com/${id}`,
    windowId,
    ...overrides,
  }
}

function project(
  windows: Array<OpenTabWindow>,
  draggedId: number,
  targetId: number,
  mode: 'after' | 'before',
) {
  return projectOpenTabMove({
    draggedId,
    pointerY: mode === 'before' ? 1 : 9,
    rectangle: { height: 10, top: 0 },
    target: { type: 'tab', id: targetId },
    windows,
  })
}

test('moves upward after removing the source first', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [tab(1, 1, 0), tab(2, 1, 1), tab(3, 1, 2), tab(4, 1, 3)],
    },
  ]
  const result = project(windows, 4, 2, 'before')

  assert.deepEqual(
    result?.windows[0].tabs.map(({ id }) => id),
    [1, 4, 2, 3],
  )
  assert.deepEqual(result.position, { index: 1, windowId: 1 })
  assert.deepEqual(result.destination, { index: 1, windowId: 1 })
})

test('moves downward without an off-by-one destination', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [tab(1, 1, 0), tab(2, 1, 1), tab(3, 1, 2), tab(4, 1, 3)],
    },
  ]
  const result = project(windows, 2, 3, 'after')

  assert.deepEqual(
    result?.windows[0].tabs.map(({ id }) => id),
    [1, 3, 2, 4],
  )
  assert.deepEqual(result.position, { index: 2, windowId: 1 })
  assert.deepEqual(result.destination, { index: 2, windowId: 1 })
})

test('recognizes both adjacent forms of the original position as no-ops', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [tab(1, 1, 0), tab(2, 1, 1), tab(3, 1, 2)],
    },
  ]

  assert.equal(project(windows, 2, 1, 'after')?.isNoop, true)
  assert.equal(project(windows, 2, 3, 'before')?.isNoop, true)
})

test('projects a tab across windows and normalizes both lists', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [tab(1, 1, 0, { active: true }), tab(2, 1, 1)],
    },
    {
      id: 2,
      focused: false,
      tabs: [tab(3, 2, 0, { active: true }), tab(4, 2, 1)],
    },
  ]
  const result = project(windows, 1, 4, 'before')

  assert.deepEqual(
    result?.windows[0].tabs.map(({ id }) => id),
    [2],
  )
  assert.equal(result.windows[0].tabs[0].active, true)
  assert.deepEqual(
    result.windows[1].tabs.map(({ id }) => id),
    [3, 1, 4],
  )
  assert.deepEqual(
    result.windows[1].tabs.map(({ nativeIndex }) => nativeIndex),
    [0, 1, 2],
  )
  assert.deepEqual(result.position, { index: 1, windowId: 2 })
  assert.deepEqual(result.destination, { index: 1, windowId: 2 })
})

test('window boundaries respect the pinned partition', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [tab(1, 1, 0, { pinned: true }), tab(2, 1, 1)],
    },
    {
      id: 2,
      focused: false,
      tabs: [
        tab(3, 2, 0, { pinned: true }),
        tab(4, 2, 1, { pinned: true }),
        tab(5, 2, 2),
      ],
    },
  ]

  const pinned = projectOpenTabMove({
    draggedId: 1,
    pointerY: 0,
    rectangle: { height: 18, top: 0 },
    target: { type: 'window', edge: 'end', windowId: 2 },
    windows,
  })
  const regular = projectOpenTabMove({
    draggedId: 2,
    pointerY: 0,
    rectangle: { height: 18, top: 0 },
    target: { type: 'window', edge: 'start', windowId: 2 },
    windows,
  })

  assert.deepEqual(
    pinned?.windows[0].tabs.map(({ id }) => id),
    [2],
  )
  assert.deepEqual(
    pinned.windows[1].tabs.map(({ id }) => id),
    [3, 4, 1, 5],
  )
  assert.deepEqual(
    regular.windows[1].tabs.map(({ id }) => id),
    [3, 4, 2, 5],
  )
})

test('rejects hidden group boundary crossings but permits safe cross-window destinations', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [
        tab(1, 1, 0, { pinned: true }),
        tab(2, 1, 1, { groupId: 8 }),
        tab(3, 1, 2, { groupId: 8 }),
        tab(4, 1, 3),
      ],
    },
    { id: 2, focused: false, tabs: [tab(5, 2, 0)] },
  ]

  assert.equal(
    canUseOpenTabDropTarget(windows, 1, { type: 'tab', id: 4 }),
    false,
  )
  assert.equal(
    canUseOpenTabDropTarget(windows, 2, { type: 'tab', id: 4 }),
    false,
  )
  assert.equal(
    canUseOpenTabDropTarget(windows, 2, {
      type: 'window',
      edge: 'end',
      windowId: 2,
    }),
    true,
  )
  assert.equal(
    canUseOpenTabDropTarget(windows, 4, { type: 'tab', id: 5 }),
    true,
  )

  const groupedCrossWindow = projectOpenTabMove({
    draggedId: 2,
    pointerY: 0,
    rectangle: { height: 18, top: 0 },
    target: { type: 'window', edge: 'end', windowId: 2 },
    windows,
  })
  assert.equal(groupedCrossWindow?.windows[1].tabs.at(-1)?.id, 2)
  assert.equal(groupedCrossWindow.windows[1].tabs.at(-1)?.groupId, -1)
})

test('keeps Chrome native indexes stable when the manager tab is hidden', () => {
  const windows = [
    {
      id: 1,
      focused: true,
      tabs: [tab(1, 1, 0), tab(2, 1, 2), tab(3, 1, 3)],
    },
  ]
  const result = project(windows, 3, 2, 'before')

  assert.deepEqual(result?.destination, { index: 2, windowId: 1 })
  assert.deepEqual(getOpenTabPosition(result.windows, 3), {
    index: 1,
    windowId: 1,
  })
})
