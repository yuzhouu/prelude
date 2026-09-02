import { PointerActivationConstraints } from '@dnd-kit/dom'
import { PointerSensor } from '@dnd-kit/react'

const MOUSE_DRAG_DISTANCE = 8
const TOUCH_DRAG_DELAY = 250
const TOUCH_MOVE_TOLERANCE = 5

export const FULL_ROW_SORTABLE_SENSORS = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === 'touch'
        ? [
            new PointerActivationConstraints.Delay({
              value: TOUCH_DRAG_DELAY,
              tolerance: TOUCH_MOVE_TOLERANCE,
            }),
          ]
        : [
            new PointerActivationConstraints.Distance({
              value: MOUSE_DRAG_DISTANCE,
            }),
          ],
    // Full-row sorting intentionally starts on links and buttons. The
    // activation constraints above keep a click a click until the pointer
    // clearly moves (or touch is held long enough).
    preventActivation: () => false,
  }),
]
