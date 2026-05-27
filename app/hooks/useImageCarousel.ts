import { useState, useEffect, useMemo } from 'react'
import type { MouseEvent } from 'react'

export function useImageCarousel(images: string[] | undefined, fallback: string) {
  const imgList = useMemo(() => {
    if (images && images.filter(Boolean).length > 0) return images.filter(Boolean) as string[]
    return fallback ? [fallback] : []
  }, [images, fallback])

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
