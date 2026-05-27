// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MouseEvent } from 'react'
import { useImageCarousel } from '../useImageCarousel'

describe('useImageCarousel', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('uses fallback when images is undefined', () => {
    const { result } = renderHook(() => useImageCarousel(undefined, 'fallback.jpg'))
    expect(result.current.activeImg).toBe('fallback.jpg')
    expect(result.current.hasMultiple).toBe(false)
    expect(result.current.imgList).toEqual(['fallback.jpg'])
  })

  it('uses fallback when images array is empty', () => {
    const { result } = renderHook(() => useImageCarousel([], 'fallback.jpg'))
    expect(result.current.activeImg).toBe('fallback.jpg')
    expect(result.current.hasMultiple).toBe(false)
  })

  it('uses images array when provided', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', 'b.jpg'], 'fallback.jpg'))
    expect(result.current.activeImg).toBe('a.jpg')
    expect(result.current.hasMultiple).toBe(true)
    expect(result.current.imgList).toEqual(['a.jpg', 'b.jpg'])
  })

  it('filters falsy values from images array', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', '', 'b.jpg'], 'fallback.jpg'))
    expect(result.current.imgList).toEqual(['a.jpg', 'b.jpg'])
  })

  it('goNext advances index and wraps at end', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', 'b.jpg', 'c.jpg'], 'x.jpg'))
    const e = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent
    act(() => { result.current.goNext(e) })
    expect(result.current.imgIdx).toBe(1)
    act(() => { result.current.goNext(e) })
    expect(result.current.imgIdx).toBe(2)
    act(() => { result.current.goNext(e) })
    expect(result.current.imgIdx).toBe(0)
  })

  it('goPrev decrements index and wraps at start', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', 'b.jpg', 'c.jpg'], 'x.jpg'))
    const e = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent
    act(() => { result.current.goPrev(e) })
    expect(result.current.imgIdx).toBe(2)
  })

  it('goTo jumps to specific index', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', 'b.jpg', 'c.jpg'], 'x.jpg'))
    const e = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent
    act(() => { result.current.goTo(e, 2) })
    expect(result.current.imgIdx).toBe(2)
    expect(result.current.activeImg).toBe('c.jpg')
  })

  it('auto-rotates every 1800ms when hovered with multiple images', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', 'b.jpg', 'c.jpg'], 'x.jpg'))
    act(() => { result.current.setIsHovered(true) })
    act(() => { vi.advanceTimersByTime(1800) })
    expect(result.current.imgIdx).toBe(1)
    act(() => { vi.advanceTimersByTime(1800) })
    expect(result.current.imgIdx).toBe(2)
  })

  it('does not auto-rotate when not hovered', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg', 'b.jpg'], 'x.jpg'))
    act(() => { vi.advanceTimersByTime(3600) })
    expect(result.current.imgIdx).toBe(0)
  })

  it('does not auto-rotate with a single image', () => {
    const { result } = renderHook(() => useImageCarousel(['a.jpg'], 'x.jpg'))
    act(() => { result.current.setIsHovered(true) })
    act(() => { vi.advanceTimersByTime(3600) })
    expect(result.current.imgIdx).toBe(0)
  })
})
