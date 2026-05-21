import { useEffect, useRef } from 'react'

export function useGameLoop(
  callback: (dt: number, elapsed: number) => void,
  enabled: boolean,
): void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let rafId: number
    let lastTime = performance.now()

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      cbRef.current(dt, now / 1000)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [enabled])
}
