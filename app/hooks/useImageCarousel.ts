'use client'

import { useState, useEffect } from 'react'
import type { MouseEvent } from 'react'

export function useImageCarousel(images: string[] | undefined, fallback: string) {
  const imgList = (
    images && images.filter(Boolean).length > 0
      ? images.filter(Boolean)
      : fallback
      ? [fallback]
      : []
  ) as string[]

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
  }, [isHovered, hasMultiple, imgList.length])

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
    setImgIdx(i)
  }

  return { imgList, hasMultiple, imgIdx, isHovered, setIsHovered, activeImg, goPrev, goNext, goTo }
}
