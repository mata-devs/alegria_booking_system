import { setGlobalOptions } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

/**
 * When a user document's `status` field changes, sync the Firebase Auth
 * disabled state:
 *   status === 'suspended'  →  disabled: true  (blocks login & token refresh)
 *   status === 'active'     →  disabled: false (re-enables the account)
 */
export const syncOperatorAuthStatus = onDocumentUpdated(
  { document: "users/{userId}", region: "us-central1" },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // Only act when status actually changed
    if (before.status === after.status) return;

    // Only apply to operators (not super_admins)
    if (after.role !== "operator") return;

    const userId = event.params.userId;
    const disabled = after.status === "suspended";

    try {
      await admin.auth().updateUser(userId, { disabled });
      logger.info(
        `Auth account ${userId} ${disabled ? "disabled" : "enabled"} (status: ${after.status})`
      );
    } catch (err) {
      logger.error(`Failed to update auth for ${userId}:`, err);
    }
  }
);
