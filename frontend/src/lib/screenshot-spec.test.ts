import { describe, expect, it } from 'vitest'
import {
  DEVICE_PRESETS,
  createBrandKit,
  generateSceneDeck,
  getInitials,
  scaleSceneSpec,
  updateSceneElement,
  type ScreenshotAsset,
} from './screenshot-spec'

const uploads: ScreenshotAsset[] = [
  {
    id: 'shot-1',
    name: 'home.png',
    dataUrl: 'data:image/png;base64,home',
    width: 1284,
    height: 2778,
  },
  {
    id: 'shot-2',
    name: 'detail.png',
    dataUrl: 'data:image/png;base64,detail',
    width: 1284,
    height: 2778,
  },
]

describe('screenshot-spec', () => {
  it('selects a health-oriented theme for fitness apps', () => {
    const brandKit = createBrandKit('Fitness Flow', '健身 计划 训练 习惯 打卡', false)

    expect(brandKit.themeName).toBe('calm_health')
    expect(brandKit.logoMode).toBe('badge')
  })

  it('generates one scene per uploaded screenshot', () => {
    const deck = generateSceneDeck({
      appName: 'Pulse Studio',
      description: 'Track your workouts with clean routines and daily momentum.',
      uploads,
      deviceType: 'iphone_67',
    })

    expect(deck.storyboard).toHaveLength(2)
    expect(deck.scenes).toHaveLength(2)
    expect(deck.scenes[0].elements.some((element) => element.kind === 'image')).toBe(true)
    expect(deck.scenes[0].elements.some((element) => element.kind === 'text')).toBe(true)
  })

  it('scales scenes when switching device families', () => {
    const deck = generateSceneDeck({
      appName: 'Maker Lab',
      description: 'Design shots, promo cards, and creator assets faster.',
      uploads,
      deviceType: 'iphone_65',
    })
    const scaled = scaleSceneSpec(deck.scenes[0], 'ipad_109')

    expect(scaled.width).toBe(DEVICE_PRESETS.ipad_109.width)
    expect(scaled.height).toBe(DEVICE_PRESETS.ipad_109.height)
    expect(scaled.elements[0].x).toBeGreaterThan(deck.scenes[0].elements[0].x)
  })

  it('updates a single element without mutating the original scene', () => {
    const deck = generateSceneDeck({
      appName: 'Notes Space',
      description: 'Capture ideas and tasks in a fast writing flow.',
      uploads,
      deviceType: 'iphone_67',
    })

    const original = deck.scenes[0]
    const updated = updateSceneElement(original, original.elements[0].id, { x: 999 })

    expect(updated.elements[0].x).toBe(999)
    expect(original.elements[0].x).not.toBe(999)
  })

  it('builds stable initials for logo badges', () => {
    expect(getInitials('iOS Kit')).toBe('IK')
    expect(getInitials('Single')).toBe('S')
  })
})
