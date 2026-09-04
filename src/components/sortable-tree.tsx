import { DragDropProvider, DragOverlay, useDroppable } from '@dnd-kit/react'
import type {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/react'
import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { useSortable } from '@dnd-kit/react/sortable'
import { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import type { MouseEventHandler, PointerEventHandler, ReactNode } from 'react'

const SORTABLE_TREE_NODE_TYPE = 'sortable-tree-node'

interface DragClickGuard {
  clear: () => void
  consume: () => boolean
}

const DragClickGuardContext = createContext<DragClickGuard | null>(null)

const pointerSensor = PointerSensor.configure({
  activationConstraints(event) {
    if (event.pointerType === 'touch') {
      return [
        new PointerActivationConstraints.Delay({
          value: 250,
          tolerance: 5,
        }),
      ]
    }

    return [new PointerActivationConstraints.Distance({ value: 5 })]
  },
  preventActivation(event) {
    return (
      event.target instanceof Element &&
      event.target.closest('[data-no-drag]') !== null
    )
  },
})

interface SortableTreeProps {
  children: ReactNode
  onDragEnd?: (event: DragEndEvent) => void
  onDragMove?: (event: DragMoveEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragStart?: (event: DragStartEvent) => void
  overlay: ReactNode
}

export function SortableTree({
  children,
  onDragEnd,
  onDragMove,
  onDragOver,
  onDragStart,
  overlay,
}: SortableTreeProps) {
  const suppressClickUntilRef = useRef(0)
  const dragClickGuard = useMemo<DragClickGuard>(
    () => ({
      clear: () => {
        suppressClickUntilRef.current = 0
      },
      consume: () => {
        const shouldSuppress = Date.now() < suppressClickUntilRef.current
        suppressClickUntilRef.current = 0
        return shouldSuppress
      },
    }),
    [],
  )

  return (
    <DragClickGuardContext.Provider value={dragClickGuard}>
      <DragDropProvider
        sensors={(defaults) => [
          ...defaults.filter((sensor) => sensor !== PointerSensor),
          pointerSensor,
        ]}
        onDragStart={(event) => {
          dragClickGuard.clear()
          onDragStart?.(event)
        }}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragEnd={(event) => {
          suppressClickUntilRef.current = Date.now() + 750
          onDragEnd?.(event)
        }}
      >
        {children}
        <DragOverlay
          className="sortable-tree-overlay"
          dropAnimation={{
            duration: 180,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {overlay}
        </DragOverlay>
      </DragDropProvider>
    </DragClickGuardContext.Provider>
  )
}

export interface SortableTreeItemState {
  isDragSource: boolean
  isDropTarget: boolean
  onClickCapture: MouseEventHandler<HTMLElement>
  onPointerDownCapture: PointerEventHandler<HTMLElement>
  setDragHandleRef: (element: Element | null) => void
  setDragTargetRef: (element: Element | null) => void
  setNodeRef: (element: Element | null) => void
}

export function SortableTreeItem({
  children,
  data,
  dragDisabled,
  dropDisabled,
  group,
  id,
  index,
}: {
  children: (state: SortableTreeItemState) => ReactNode
  data: Record<string, unknown>
  dragDisabled: boolean
  dropDisabled: boolean
  group: string
  id: string
  index: number
}) {
  const clickGuard = useContext(DragClickGuardContext)
  const sortable = useSortable({
    id,
    index,
    group,
    type: SORTABLE_TREE_NODE_TYPE,
    accept: SORTABLE_TREE_NODE_TYPE,
    data,
    disabled: { draggable: dragDisabled, droppable: dropDisabled },
    collisionPriority: 2,
    transition: {
      duration: 220,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  })
  const setDragTargetRef = useCallback(
    (element: Element | null) => {
      sortable.sourceRef(element)
      sortable.targetRef(element)
    },
    [sortable],
  )
  const handleClickCapture = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      if (!clickGuard?.consume()) return
      event.preventDefault()
      event.stopPropagation()
    },
    [clickGuard],
  )
  const handlePointerDownCapture = useCallback<
    PointerEventHandler<HTMLElement>
  >(() => clickGuard?.clear(), [clickGuard])

  return children({
    isDragSource: sortable.isDragSource,
    isDropTarget: sortable.isDropTarget,
    onClickCapture: handleClickCapture,
    onPointerDownCapture: handlePointerDownCapture,
    setDragHandleRef: sortable.handleRef,
    setDragTargetRef,
    setNodeRef: sortable.ref,
  })
}

export function SortableTreeDropZone({
  children,
  data,
  disabled,
  id,
  priority = 3,
}: {
  children: (state: {
    isDropTarget: boolean
    setNodeRef: (element: Element | null) => void
  }) => ReactNode
  data: Record<string, unknown>
  disabled: boolean
  id: string
  priority?: number
}) {
  const droppable = useDroppable({
    id,
    accept: SORTABLE_TREE_NODE_TYPE,
    collisionPriority: priority,
    data,
    disabled,
  })

  return children({
    isDropTarget: droppable.isDropTarget,
    setNodeRef: droppable.ref,
  })
}
