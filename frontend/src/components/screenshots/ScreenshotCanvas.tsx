'use client'

import dynamic from 'next/dynamic'
import type { ScreenshotCanvasProps } from './ScreenshotCanvasInner'

const ScreenshotCanvas = dynamic(() => import('./ScreenshotCanvasInner'), {
  ssr: false,
}) as React.ComponentType<ScreenshotCanvasProps>

export default ScreenshotCanvas
