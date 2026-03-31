import { useCallback, useState } from 'react'

export interface UseUndoRedoOptions<T> {
  maxHistory?: number
}

export function useUndoRedo<T>(initialState: T, options: UseUndoRedoOptions<T> = {}) {
  const { maxHistory = 50 } = options
  const [present, setPresent] = useState<T>(initialState)
  const [past, setPast] = useState<T[]>([])
  const [future, setFuture] = useState<T[]>([])

  const set = useCallback(
    (newState: T | ((currentState: T) => T)) => {
      setPresent((current) => {
        const next = typeof newState === 'function' ? (newState as (currentState: T) => T)(current) : newState

        setPast((prev) => {
          const newPast = [...prev, current]
          if (newPast.length > maxHistory) {
            newPast.shift()
          }
          return newPast
        })
        setFuture([])

        return next
      })
    },
    [maxHistory]
  )

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev

      const previous = prev[prev.length - 1]
      const newPast = prev.slice(0, -1)

      setPresent((current) => {
        setFuture((f) => [current, ...f])
        return previous
      })

      return newPast
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev

      const next = prev[0]
      const newFuture = prev.slice(1)

      setPresent((current) => {
        setPast((p) => [...p, current])
        return next
      })

      return newFuture
    })
  }, [])

  const reset = useCallback((newState: T) => {
    setPresent(newState)
    setPast([])
    setFuture([])
  }, [])

  return {
    present,
    set,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyLength: past.length + future.length,
  }
}
