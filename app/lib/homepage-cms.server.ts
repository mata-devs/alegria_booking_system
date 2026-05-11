import 'server-only'
import {
  DEFAULT_HOMEPAGE_CMS,
  HOMEPAGE_CMS_COLLECTION,
  HOMEPAGE_CMS_DOC_ID,
  parseHomepageCms,
  type HomepageCms,
} from './homepage-cms'

/**
 * Server-side reader for the homepage CMS singleton.
 *
 * We deliberately use the **Firestore REST API** (not the Admin SDK) because:
 *  - The `homepage_cms` doc is publicly readable per our security rules, so we don't need
 *    privileged credentials.
 *  - This works in any environment (Firebase App Hosting, local dev, CI) without requiring
 *    Application Default Credentials. No `gcloud auth application-default login` dance.
 *  - The Admin SDK can still be used elsewhere on the server for writes / auth verification.
 *
 * On any error (missing project ID, 404, network, malformed response) we fall back to
 * `DEFAULT_HOMEPAGE_CMS` and log to the server console. The guest landing page must never
 * crash because the CMS is unreachable.
 */

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } }

function decodeValue(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('nullValue' in v) return null
  if ('timestampValue' in v) return new Date(v.timestampValue).getTime()
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decodeValue)
  if ('mapValue' in v) return decodeFields(v.mapValue.fields ?? {})
  return undefined
}

function decodeFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeValue(v)
  }
  return out
}

function getProjectId(): string | null {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    null
  )
}

export async function getHomepageCmsServer(): Promise<HomepageCms> {
  const projectId = getProjectId()
  if (!projectId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[homepage-cms.server] Neither FIREBASE_PROJECT_ID nor NEXT_PUBLIC_FIREBASE_PROJECT_ID is set; serving defaults.',
      )
    }
    return DEFAULT_HOMEPAGE_CMS
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/${HOMEPAGE_CMS_COLLECTION}/${HOMEPAGE_CMS_DOC_ID}` +
    (apiKey ? `?key=${encodeURIComponent(apiKey)}` : '')

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (res.status === 404) return DEFAULT_HOMEPAGE_CMS
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[homepage-cms.server] Firestore REST read failed:', res.status, body)
      return DEFAULT_HOMEPAGE_CMS
    }
    const json = (await res.json()) as { fields?: Record<string, FsValue> }
    if (!json.fields) return DEFAULT_HOMEPAGE_CMS
    return parseHomepageCms(decodeFields(json.fields))
  } catch (err) {
    console.error('[homepage-cms.server] read failed:', err)
    return DEFAULT_HOMEPAGE_CMS
  }
}
