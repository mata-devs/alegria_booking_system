import * as admin from "firebase-admin";

// If we are running in the cloud, Firebase initializes itself automatically!
// If we are running locally, we can provide a service account or use emulators.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
