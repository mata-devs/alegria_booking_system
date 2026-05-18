import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { firebaseDb, firebaseStorage } from './firebase'
import { municipalitySlug } from './cebu-municipalities'

export const HOMEPAGE_CMS_COLLECTION = 'homepage_cms'
export const HOMEPAGE_CMS_DOC_ID = 'current'
export const TICKER_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const TICKER_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png'] as const

export type TickerItem = {
  municipalitySlug: string
  displayName: string
  bestPictureUrl: string
  caption?: string
  /**
   * Small photo credit / source attribution rendered at the bottom-right of the hero
   * background. Optional. e.g. "Photo: Wikipedia / CC BY-SA 4.0" or "© John Doe".
   */
  imageAttribution?: string
  /** Optional URL the attribution chip links to (e.g. source page). */
  imageAttributionUrl?: string
  order: number
  published: boolean
}

export type HomepageCmsHero = {
  eyebrow: string
  headline: string
  subhead: string
}

export type HomepageCmsTicker = {
  intervalMs: number
  items: TickerItem[]
}

/** Normalized shape for app code. `updatedAt` is unix millis (server-to-client safe). */
export type HomepageCms = {
  enabled: boolean
  hero: HomepageCmsHero
  ticker: HomepageCmsTicker
  updatedAt: number | null
  updatedBy: string | null
}

export const DEFAULT_HOMEPAGE_HERO: HomepageCmsHero = {
  eyebrow: 'Philippines · Cebu Island',
  headline: 'Your Gateway to\nTropical Adventure',
  subhead:
    "Discover the magic of the Philippines' most diverse island province, from deep sea wonders to mountain peaks.",
}

export const DEFAULT_TICKER_INTERVAL_MS = 2500

/**
 * Seed list (8 best-known Cebu destinations) used the first time an admin opens the
 * Homepage editor and saves. Placeholder images point to picsum so the UI is never broken;
 * admins are expected to upload real best pictures via the editor.
 */
export const DEFAULT_TICKER_ITEMS: TickerItem[] = [
  { municipalitySlug: municipalitySlug('Moalboal'),       displayName: 'Moalboal',       bestPictureUrl: 'https://picsum.photos/seed/cebu-moalboal/1600/900',       caption: 'Sardine run · turtle reef', order: 0, published: true },
  { municipalitySlug: municipalitySlug('Bantayan'),       displayName: 'Bantayan',       bestPictureUrl: 'https://picsum.photos/seed/cebu-bantayan/1600/900',       caption: 'Powder-white beaches',     order: 1, published: true },
  { municipalitySlug: municipalitySlug('Oslob'),          displayName: 'Oslob',          bestPictureUrl: 'https://picsum.photos/seed/cebu-oslob/1600/900',          caption: 'Whale shark encounter',    order: 2, published: true },
  { municipalitySlug: municipalitySlug('Badian'),         displayName: 'Badian',         bestPictureUrl: 'https://picsum.photos/seed/cebu-badian/1600/900',         caption: 'Kawasan canyoneering',     order: 3, published: true },
  { municipalitySlug: municipalitySlug('Cebu City'),      displayName: 'Cebu City',      bestPictureUrl: 'https://picsum.photos/seed/cebu-city/1600/900',           caption: 'Queen City of the South',  order: 4, published: true },
  { municipalitySlug: municipalitySlug('Lapu-Lapu City'), displayName: 'Lapu-Lapu City', bestPictureUrl: 'https://picsum.photos/seed/cebu-lapulapu/1600/900',       caption: 'Mactan island resorts',    order: 5, published: true },
  { municipalitySlug: municipalitySlug('Argao'),          displayName: 'Argao',          bestPictureUrl: 'https://picsum.photos/seed/cebu-argao/1600/900',          caption: 'Heritage town & beaches',  order: 6, published: true },
  { municipalitySlug: municipalitySlug('Poro'),           displayName: 'Camotes (Poro)', bestPictureUrl: 'https://picsum.photos/seed/cebu-camotes/1600/900',       caption: 'Camotes islands',          order: 7, published: true },
]

export const DEFAULT_HOMEPAGE_CMS: HomepageCms = {
  enabled: false,
  hero: DEFAULT_HOMEPAGE_HERO,
  ticker: { intervalMs: DEFAULT_TICKER_INTERVAL_MS, items: DEFAULT_TICKER_ITEMS },
  updatedAt: null,
  updatedBy: null,
}

function toMillisSafe(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis()
  if (value && typeof value === 'object' && 'toMillis' in value) {
    try {
      const v = (value as { toMillis: () => number }).toMillis()
      return typeof v === 'number' ? v : null
    } catch {
      return null
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

function parseTickerItem(raw: unknown, fallbackOrder: number): TickerItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const slug = typeof r.municipalitySlug === 'string' ? r.municipalitySlug : null
  const name = typeof r.displayName === 'string' ? r.displayName : null
  const pic = typeof r.bestPictureUrl === 'string' ? r.bestPictureUrl : null
  if (!slug || !name || !pic) return null
  return {
    municipalitySlug: slug,
    displayName: name,
    bestPictureUrl: pic,
    caption: typeof r.caption === 'string' ? r.caption : undefined,
    imageAttribution:
      typeof r.imageAttribution === 'string' && r.imageAttribution.trim()
        ? r.imageAttribution.trim()
        : undefined,
    imageAttributionUrl:
      typeof r.imageAttributionUrl === 'string' && r.imageAttributionUrl.trim()
        ? r.imageAttributionUrl.trim()
        : undefined,
    order: typeof r.order === 'number' ? r.order : fallbackOrder,
    published: typeof r.published === 'boolean' ? r.published : true,
  }
}

/** Normalize a raw Firestore snapshot (client or admin SDK) into the app shape. */
export function parseHomepageCms(raw: DocumentData | null | undefined): HomepageCms {
  if (!raw) return DEFAULT_HOMEPAGE_CMS
  const hero = (raw.hero && typeof raw.hero === 'object' ? raw.hero : {}) as Partial<HomepageCmsHero>
  const ticker = (raw.ticker && typeof raw.ticker === 'object' ? raw.ticker : {}) as Partial<HomepageCmsTicker> & {
    items?: unknown
  }
  const items = Array.isArray(ticker.items)
    ? ticker.items
        .map((it, idx) => parseTickerItem(it, idx))
        .filter((it): it is TickerItem => it !== null)
        .sort((a, b) => a.order - b.order)
    : DEFAULT_TICKER_ITEMS
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : false,
    hero: {
      eyebrow: typeof hero.eyebrow === 'string' ? hero.eyebrow : DEFAULT_HOMEPAGE_HERO.eyebrow,
      headline: typeof hero.headline === 'string' ? hero.headline : DEFAULT_HOMEPAGE_HERO.headline,
      subhead: typeof hero.subhead === 'string' ? hero.subhead : DEFAULT_HOMEPAGE_HERO.subhead,
    },
    ticker: {
      intervalMs:
        typeof ticker.intervalMs === 'number' && ticker.intervalMs >= 1000
          ? ticker.intervalMs
          : DEFAULT_TICKER_INTERVAL_MS,
      items,
    },
    updatedAt: toMillisSafe(raw.updatedAt),
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : null,
  }
}

function homepageCmsDocRef() {
  return doc(collection(firebaseDb, HOMEPAGE_CMS_COLLECTION), HOMEPAGE_CMS_DOC_ID)
}

/** One-shot client read (used by admin editor first paint). */
export async function getHomepageCmsClient(): Promise<HomepageCms> {
  const snap = await getDoc(homepageCmsDocRef())
  if (!snap.exists()) return DEFAULT_HOMEPAGE_CMS
  return parseHomepageCms(snap.data())
}

/** Live onSnapshot subscription for the admin editor. */
export function subscribeHomepageCms(
  cb: (cms: HomepageCms) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    homepageCmsDocRef(),
    (snap) => cb(snap.exists() ? parseHomepageCms(snap.data()) : DEFAULT_HOMEPAGE_CMS),
    (err) => onError?.(err),
  )
}

type SaveInput = Partial<{
  enabled: boolean
  hero: HomepageCmsHero
  ticker: HomepageCmsTicker
}>

/**
 * Firestore web SDK rejects `undefined` field values. Convert TickerItem objects to plain
 * records that only include defined keys before writing.
 */
function tickerItemForFirestore(item: TickerItem): DocumentData {
  const out: DocumentData = {
    municipalitySlug: item.municipalitySlug,
    displayName: item.displayName,
    bestPictureUrl: item.bestPictureUrl,
    order: item.order,
    published: item.published,
  }
  if (item.caption) out.caption = item.caption
  if (item.imageAttribution) out.imageAttribution = item.imageAttribution
  if (item.imageAttributionUrl) out.imageAttributionUrl = item.imageAttributionUrl
  return out
}

/** Merge-write the homepage CMS doc. `uid` is the super_admin performing the save. */
export async function saveHomepageCms(partial: SaveInput, uid: string): Promise<void> {
  const payload: DocumentData = {
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }
  if (typeof partial.enabled === 'boolean') payload.enabled = partial.enabled
  if (partial.hero) payload.hero = partial.hero
  if (partial.ticker) {
    payload.ticker = {
      intervalMs: partial.ticker.intervalMs,
      items: partial.ticker.items.map(tickerItemForFirestore),
    }
  }
  await setDoc(homepageCmsDocRef(), payload, { merge: true })
}

/** Convenience wrapper for the master Settings toggle. */
export async function setHomepageCmsEnabled(enabled: boolean, uid: string): Promise<void> {
  await saveHomepageCms({ enabled }, uid)
}

export type UploadTickerImageError =
  | { kind: 'bad-type' }
  | { kind: 'too-large' }

export type UploadTickerImageResult =
  | { ok: true; url: string }
  | { ok: false; error: UploadTickerImageError }

async function compressTickerImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      let { width, height } = img
      const maxDim = 1920

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas is not supported in this browser'))
        return
      }
      context.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
        'image/jpeg',
        0.85,
      )
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/**
 * Validate (JPEG/PNG, ≤ 5 MB), compress, and upload a best-picture for a municipality slot.
 * Stored with a versioned filename so year-long browser/CDN caches do not serve stale images
 * after an admin replaces a photo.
 */
export async function uploadTickerImage(
  slug: string,
  file: File,
): Promise<UploadTickerImageResult> {
  if (!TICKER_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof TICKER_IMAGE_ALLOWED_TYPES)[number])) {
    return { ok: false, error: { kind: 'bad-type' } }
  }
  if (file.size > TICKER_IMAGE_MAX_BYTES) {
    return { ok: false, error: { kind: 'too-large' } }
  }
  const compressed = await compressTickerImage(file)
  const path = `homepage_cms/ticker/${slug}/${Date.now()}.jpg`
  const ref = storageRef(firebaseStorage, path)
  await uploadBytes(ref, compressed, {
    contentType: 'image/jpeg',
    cacheControl: 'public,max-age=31536000',
  })
  const url = await getDownloadURL(ref)
  return { ok: true, url }
}
