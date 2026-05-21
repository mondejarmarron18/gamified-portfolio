import { useEffect, useRef } from 'react'

export interface InputCallbacks {
  onLeftClick: (clientX: number, clientY: number) => void
  onRightClick: (clientX: number, clientY: number) => void
  onMouseMove: (clientX: number, clientY: number) => void
  onWheel: (deltaY: number) => void
  onTap: (clientX: number, clientY: number) => void
  onPinchDelta: (delta: number) => void
  onEscape: () => void
}

export function useInput(
  canvas: HTMLCanvasElement | null,
  callbacks: InputCallbacks,
  enabled: boolean,
): void {
  const cbRef = useRef(callbacks)
  cbRef.current = callbacks

  useEffect(() => {
    if (!enabled || !canvas) return

    let mouseDownTime = 0
    let prevTouchDist = 0

    function getTouchDist(e: TouchEvent): number {
      const t0 = e.touches[0]!
      const t1 = e.touches[1]!
      return Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button === 0) mouseDownTime = Date.now()
    }

    function onMouseMove(e: MouseEvent) {
      cbRef.current.onMouseMove(e.clientX, e.clientY)
    }

    function onMouseUp(e: MouseEvent) {
      if (e.button !== 0) return
      if (Date.now() - mouseDownTime < 500)
        cbRef.current.onLeftClick(e.clientX, e.clientY)
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault()
      cbRef.current.onRightClick(e.clientX, e.clientY)
    }

    function onWheel(e: WheelEvent) {
      cbRef.current.onWheel(e.deltaY)
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 1) {
        prevTouchDist = 0
        const t = e.touches[0]!
        cbRef.current.onTap(t.clientX, t.clientY)
      } else if (e.touches.length >= 2) {
        prevTouchDist = getTouchDist(e)
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length >= 2) {
        const d = getTouchDist(e)
        if (prevTouchDist > 0) cbRef.current.onPinchDelta(d - prevTouchDist)
        prevTouchDist = d
      }
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 0) prevTouchDist = 0
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Escape') cbRef.current.onEscape()
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('contextmenu', onContextMenu)
    canvas.addEventListener('wheel', onWheel, { passive: true })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    document.addEventListener('keydown', onKeyDown)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('contextmenu', onContextMenu)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [canvas, enabled])
}
