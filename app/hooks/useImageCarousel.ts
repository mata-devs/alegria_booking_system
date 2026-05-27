import { useState, useEffect, useMemo, useRef } from 'react'
import type { MouseEvent } from 'react'

export function useImageCarousel(images: string[] | undefined, fallback: string) {
  // Stabilise imgList by deep-comparing input so that re-renders with the same
  // content (but a new array reference) don't produce a new imgList reference.
  const imagesKey = (images ?? []).filter(Boolean).join('\x00')
  const prevKeyRef = useRef<string | null>(null)
  const stableImagesRef = useRef<string[] | undefined>(images)
  if (prevKeyRef.current === null || imagesKey !== prevKeyRef.current) {
    prevKeyRef.current = imagesKey
    stableImagesRef.current = images
  }
  const stableImages = stableImagesRef.current

  const imgList = useMemo(() => {
    const filtered = (stableImages ?? []).filter(Boolean) as string[]
    return filtered.length > 0 ? filtered : fallback ? [fallback] : []
  }, [stableImages, fallback])

  const hasMultiple = imgList.length > 1
  const [imgIdx, setImgIdx] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const activeImg = imgList[imgIdx] ?? ''

  useEffect(() => {
    if (!isHovered || !hasMultiple) return
    const id = setInterval(() => {
      setImgIdx((i) => (i + 1) % imgList.length)
    }, 1800)
    return () => clearInterval(id)
  }, [isHovered, hasMultiple, imgList])

  useEffect(() => {
    setImgIdx(0)
  }, [imgList])

  const goPrev = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx((i) => (i - 1 + imgList.length) % imgList.length)
  }

  const goNext = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx((i) => (i + 1) % imgList.length)
  }

  const goTo = (e: MouseEvent, i: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (i >= 0 && i < imgList.length) setImgIdx(i)
  }

  return { imgList, hasMultiple, imgIdx, isHovered, setIsHovered, activeImg, goPrev, goNext, goTo }
}
