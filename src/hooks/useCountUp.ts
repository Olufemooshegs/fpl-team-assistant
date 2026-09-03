import { useEffect, useState } from "react"
import { animate } from "motion"
import { useReducedMotion } from "motion/react"

export function useCountUp(target: number, decimals = 1, duration = 0.9): string {
  const [display, setDisplay] = useState("0." + "0".repeat(decimals))
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setDisplay(target.toFixed(decimals))
      return
    }

    setDisplay("0." + "0".repeat(decimals))

    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setDisplay(v.toFixed(decimals)),
    })

    return () => controls.stop()
  }, [target, decimals, duration, reduced])

  return display
}
