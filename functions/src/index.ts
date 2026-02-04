import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import app from "./app";

// Set global options for all functions
const region = process.env.APP_REGION || "asia-southeast1";
const maxInstances = parseInt(process.env.APP_MAX_INSTANCES || "10");

setGlobalOptions({ maxInstances: maxInstances, region: region as any });

// Export the Express app as a Cloud Function named 'api'
export const api = onRequest(app);

// Export the separate initialization function
export { initDb } from "./initDb";