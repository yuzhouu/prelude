/// <reference types="node" />

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildBookmarkTreeIndex,
  canMoveBookmarkNode,
  canUseBookmarkDropTarget,
  projectBookmarkNodeMove,
} from './bookmark-drag.ts'
import type { BookmarkNode } from './model'

const row = { height: 40, top: 100 }

function bookmark(id: string): BookmarkNode {
  return { id, title: id, url: `https://${id}.example` }
}

function folder(
  id: string,
  children: Array<BookmarkNode> = [],
  folderType?: BookmarkNode['folderType'],
): BookmarkNode {
  return { id, title: id, children, folderType }
}

function childIds(roots: Array<BookmarkNode>, parentId: string) {
  return buildBookmarkTreeIndex(roots)
    .childrenByParent.get(parentId)
    ?.map((node) => node.id)
}

describe('projectBookmarkNodeMove', () => {
  it('moves upward using the post-removal index', () => {
    const roots = [
      folder('root', [bookmark('a'), bookmark('b'), bookmark('c')]),
    ]
    const projection = projectBookmarkNodeMove({
      draggedId: 'c',
      pointerY: 101,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'b' },
    })

    assert.deepEqual(childIds(projection?.tree ?? [], 'root'), ['a', 'c', 'b'])
    assert.deepEqual(projection?.position, { parentId: 'root', index: 1 })
  })

  it('moves downward without an off-by-one error', () => {
    const roots = [
      folder('root', [bookmark('a'), bookmark('b'), bookmark('c')]),
    ]
    const projection = projectBookmarkNodeMove({
      draggedId: 'a',
      pointerY: 139,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'c' },
    })

    assert.deepEqual(childIds(projection?.tree ?? [], 'root'), ['b', 'c', 'a'])
    assert.deepEqual(projection?.position, { parentId: 'root', index: 2 })
  })

  it('keeps the original location as a legal no-op', () => {
    const roots = [
      folder('root', [bookmark('a'), bookmark('b'), bookmark('c')]),
    ]
    const projection = projectBookmarkNodeMove({
      draggedId: 'b',
      pointerY: 101,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'c' },
    })

    assert.ok(projection)
    assert.equal(projection.isNoop, true)
    assert.equal(projection.tree, roots)
  })

  it('moves to the end of another folder from its add-bookmark row', () => {
    const roots = [
      folder('source', [bookmark('a')]),
      folder('target', [bookmark('b')]),
    ]
    const projection = projectBookmarkNodeMove({
      draggedId: 'a',
      pointerY: 120,
      rectangle: row,
      roots,
      target: { type: 'container', parentId: 'target', edge: 'end' },
    })

    assert.deepEqual(childIds(projection?.tree ?? [], 'source'), [])
    assert.deepEqual(childIds(projection?.tree ?? [], 'target'), ['b', 'a'])
    assert.deepEqual(projection?.position, { parentId: 'target', index: 1 })
  })

  it('moves after a folder from that folder add-folder row', () => {
    const roots = [
      folder('root', [folder('target', [bookmark('dragged')]), folder('next')]),
    ]
    const projection = projectBookmarkNodeMove({
      draggedId: 'dragged',
      pointerY: 120,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'target', mode: 'after' },
    })

    assert.ok(projection)
    assert.deepEqual(childIds(projection.tree, 'root'), [
      'target',
      'dragged',
      'next',
    ])
    assert.deepEqual(childIds(projection.tree, 'target'), [])
    assert.deepEqual(projection.position, { parentId: 'root', index: 1 })
    assert.equal(projection.mode, 'after')
  })

  it('moves into an empty folder from the middle of its header', () => {
    const roots = [folder('source', [bookmark('a')]), folder('target')]
    const projection = projectBookmarkNodeMove({
      draggedId: 'a',
      pointerY: 120,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'target' },
    })

    assert.ok(projection)
    assert.equal(projection.mode, 'inside')
    assert.deepEqual(childIds(projection.tree, 'target'), ['a'])
  })

  it('sorts before and after folders at their header edges', () => {
    const roots = [folder('root', [folder('a'), folder('b'), bookmark('link')])]
    const before = projectBookmarkNodeMove({
      draggedId: 'link',
      pointerY: 101,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'b' },
    })
    const after = projectBookmarkNodeMove({
      draggedId: 'link',
      pointerY: 139,
      rectangle: row,
      roots,
      target: { type: 'node', id: 'a' },
    })

    assert.deepEqual(childIds(before?.tree ?? [], 'root'), ['a', 'link', 'b'])
    assert.deepEqual(childIds(after?.tree ?? [], 'root'), ['a', 'link', 'b'])
  })

  it('supports large start and end container targets', () => {
    const roots = [folder('root', [bookmark('a'), bookmark('b')])]
    const start = projectBookmarkNodeMove({
      draggedId: 'b',
      pointerY: 0,
      rectangle: row,
      roots,
      target: { type: 'container', parentId: 'root', edge: 'start' },
    })
    const end = projectBookmarkNodeMove({
      draggedId: 'a',
      pointerY: 0,
      rectangle: row,
      roots,
      target: { type: 'container', parentId: 'root', edge: 'end' },
    })

    assert.deepEqual(childIds(start?.tree ?? [], 'root'), ['b', 'a'])
    assert.deepEqual(childIds(end?.tree ?? [], 'root'), ['b', 'a'])
  })

  it('rejects self-descendants and managed trees', () => {
    const roots = [
      folder('root', [folder('parent', [folder('child')]), bookmark('a')]),
      folder('managed', [bookmark('locked')], 'managed'),
      {
        ...folder('legacy-managed', [bookmark('legacy-locked')]),
        unmodifiable: 'managed' as const,
      },
    ]
    const tree = buildBookmarkTreeIndex(roots)

    assert.equal(
      canUseBookmarkDropTarget(tree, 'parent', {
        type: 'node',
        id: 'child',
      }),
      false,
    )
    assert.equal(
      canUseBookmarkDropTarget(tree, 'a', {
        type: 'container',
        parentId: 'managed',
        edge: 'end',
      }),
      false,
    )
    assert.equal(canMoveBookmarkNode(tree, 'locked'), false)
    assert.equal(canMoveBookmarkNode(tree, 'legacy-locked'), false)
  })
})
