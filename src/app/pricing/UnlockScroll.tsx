'use client'

import { useEffect } from 'react'

// Root layout sets body { overflow: hidden } for the globe.
// This component unlocks scrolling for the whole /pricing subtree.
export function UnlockScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return null
}
