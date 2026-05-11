import 'server-only'
import {
  getApps,
  initializeApp,
  applicationDefault,
  type App,
} from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getStorage, type Storage } from 'firebase-admin/storage'

/**
 * Server-only Firebase Admin SDK singleton.
 *
 * Credentials:
 *  - Firebase App Hosting injects ADC via the runtime service account → no config needed.
 *  - Locally: `gcloud auth application-default login` OR `GOOGLE_APPLICATION_CREDENTIALS=path/to/sa.json`.
 *  - Emulators: set `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`.
 *
 * The Admin SDK reads emulator env vars automatically once initialized.
 */
function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]

  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[firebase-admin] applicationDefault() failed; falling back to projectId-only init. ' +
          'Set GOOGLE_APPLICATION_CREDENTIALS or run `gcloud auth application-default login` for local dev.',
        err,
      )
    }
    return initializeApp({ projectId, storageBucket })
  }
}

export const firebaseAdminApp: App = getAdminApp()
export const adminDb: Firestore = getFirestore(firebaseAdminApp)
export const adminAuth: Auth = getAuth(firebaseAdminApp)
export const adminStorage: Storage = getStorage(firebaseAdminApp)
