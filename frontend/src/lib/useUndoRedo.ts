import { useCallback, useState, useMemo } from 'react'

export interface UseUndoRedoOptions<T> {
  maxHistory?: number
}

export function useUndoRedo<T>(initialState: T, options: UseUndoRedoOptions<T> = {}) {
  const { maxHistory = 20 } = options
  const [past, setPast] = useState<T[]>([])
  const [future, setFuture] = useState<T[]>([])
  const [present, setPresent] = useState<T>(initialState)

  const set = useCallback((newState: T | ((currentState: T) => T)) => {
    setPresent((current) => {
      const next = typeof newState === 'function'
        ? (newState as (currentState: T) => T)(current)
        : newState

      setPast((prev) => {
        const newPast = [...prev, current]
        return newPast.length > maxHistory ? newPast.slice(newPast.length - maxHistory) : newPast
      })
      setFuture([])
      return next
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev
      const previous = prev[prev.length - 1]
      setPresent((current) => {
        setFuture((f) => [current, ...f])
        return previous
      })
      return prev.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev
      const next = prev[0]
      setPresent((current) => {
        setPast((p) => [...p, current])
        return next
      })
      return prev.slice(1)
    })
  }, [])

  const reset = useCallback((newState: T) => {
    setPresent(newState)
    setPast([])
    setFuture([])
  }, [])

  return useMemo(() => ({
    present,
    set,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }), [present, past, future, set, reset, undo, redo])
}
